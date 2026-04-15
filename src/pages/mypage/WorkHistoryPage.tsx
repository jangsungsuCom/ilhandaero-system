import { useState, useEffect } from "react";
import styled from "styled-components";
import { getWorkLogs, getWorkAmount, getWorkerInfo, updateWorkerBankAccount } from "../../utils/workLog";
import { getAccessCode, getLoginMethod } from "../../utils/auth";
import { getAccessCodePaymentDetail, getAccessCodePayments } from "../../utils/paymentApi";
import { format } from "date-fns";
import type { WorkAmountData } from "../../types/payment";
import type { WorkerInfo } from "../../types/worker";
import { IosWheelPicker, type WheelOption } from "../../components/common/IosWheelPicker";
import { media } from "../../styles/breakpoints";
import { mypageTitle, mypageSubtitle, mypageContent } from "../../styles/mypageTypography";

const YEAR_OPTIONS = (centerYear: number): WheelOption<number>[] => Array.from({ length: 21 }, (_, i) => centerYear - 10 + i).map((y) => ({ value: y, label: `${y}년` }));

const MONTH_OPTIONS: WheelOption<number>[] = Array.from({ length: 12 }, (_, i) => ({ value: i, label: `${i + 1}월` }));
const ACCOUNT_NUMBER_STORAGE_PREFIX = "workerAccountNumber:";

const getStoredAccountNumber = (accessCode: string): string => {
    return localStorage.getItem(`${ACCOUNT_NUMBER_STORAGE_PREFIX}${accessCode}`) || "";
};

const isMaskedAccountNumber = (value: string): boolean => {
    return /[*xX]/.test(value);
};

const setStoredAccountNumber = (accessCode: string, accountNumber: string) => {
    const normalized = accountNumber.replace(/\s/g, "");
    if (!normalized || isMaskedAccountNumber(normalized)) return;
    localStorage.setItem(`${ACCOUNT_NUMBER_STORAGE_PREFIX}${accessCode}`, normalized);
};

const resolveAccountNumber = (workerData: WorkerInfo, accessCode: string): string => {
    const raw = workerData as WorkerInfo & { bankAccountNumber?: string; accountNo?: string };
    const apiAccountNumber = (raw.accountNumber || raw.bankAccountNumber || raw.accountNo || "").replace(/\s/g, "");
    if (apiAccountNumber && !isMaskedAccountNumber(apiAccountNumber)) {
        setStoredAccountNumber(accessCode, apiAccountNumber);
        return apiAccountNumber;
    }
    return getStoredAccountNumber(accessCode);
};

const fetchAccountNumberFromPaymentDetail = async (accessCode: string, from: string, to: string): Promise<string> => {
    try {
        const payments = await getAccessCodePayments(accessCode, from, to);
        if (!payments.length) return "";
        const latest = [...payments].sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())[0];
        if (!latest?.paymentId) return "";
        const detail = await getAccessCodePaymentDetail(accessCode, latest.paymentId);
        const accountNumber = (detail?.accountNumber || "").replace(/\s/g, "");
        if (!accountNumber || isMaskedAccountNumber(accountNumber)) return "";
        setStoredAccountNumber(accessCode, accountNumber);
        return accountNumber;
    } catch {
        return "";
    }
};

export default function WorkHistoryPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [workLogs, setWorkLogs] = useState<any[]>([]);
    const [workAmount, setWorkAmount] = useState<WorkAmountData | null>(null);
    const [workerInfo, setWorkerInfo] = useState<WorkerInfo | null>(null);
    const [deductionDetailsOpen, setDeductionDetailsOpen] = useState(false);

    const [bankEditOpen, setBankEditOpen] = useState(false);
    const [bankNameEdit, setBankNameEdit] = useState("");
    const [accountNumberEdit, setAccountNumberEdit] = useState("");
    const [bankSaving, setBankSaving] = useState(false);
    const [bankError, setBankError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pendingYear, setPendingYear] = useState(new Date().getFullYear());
    const [pendingMonth, setPendingMonth] = useState(new Date().getMonth());

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    useEffect(() => {
        if (pickerOpen) {
            setPendingYear(currentYear);
            setPendingMonth(currentMonth);
        }
    }, [pickerOpen, currentYear, currentMonth]);

    useEffect(() => {
        // accessCode 로그인이 아니면 데이터를 로드하지 않음
        const loginMethod = getLoginMethod();
        if (loginMethod !== "accessCode") {
            setWorkLogs([]);
            setWorkAmount(null);
            setLoading(false);
            return;
        }

        fetchData();
    }, [currentYear, currentMonth]);

    // 로그인 방법이 변경될 때 상태 초기화
    useEffect(() => {
        const loginMethod = getLoginMethod();
        if (loginMethod !== "accessCode") {
            setWorkLogs([]);
            setWorkAmount(null);
        }
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const accessCode = getAccessCode();
            if (!accessCode) return;

            const startDate = new Date(currentYear, currentMonth, 1);
            const endDate = new Date(currentYear, currentMonth + 1, 0);
            const from = format(startDate, "yyyy-MM-dd");
            const to = format(endDate, "yyyy-MM-dd");

            const [workLogsResponse, workAmountResponse, workerInfoResponse] = await Promise.all([
                getWorkLogs(currentYear, currentMonth, accessCode),
                getWorkAmount(accessCode, from, to),
                getWorkerInfo(accessCode),
            ]);

            setWorkLogs(workLogsResponse.data || []);
            const waData = workAmountResponse?.data;
            if (waData) {
                setWorkAmount({
                    ...waData,
                    totalAdvanced: waData.totalAdvanced ?? waData.totalAdvancedInPeriod,
                });
            } else {
                setWorkAmount(null);
            }

            const workerData = workerInfoResponse?.data ?? null;
            if (workerData) {
                let fullAccountNumber = resolveAccountNumber(workerData, accessCode);
                if (!fullAccountNumber) {
                    fullAccountNumber = await fetchAccountNumberFromPaymentDetail(accessCode, from, to);
                }
                setWorkerInfo({
                    ...workerData,
                    accountNumber: fullAccountNumber || workerData.accountNumber || workerData.maskedAccountNumber || "",
                });
            } else {
                setWorkerInfo(null);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const openBankEdit = () => {
        setBankError(null);
        setBankNameEdit(workerInfo?.bankName ?? "");
        setAccountNumberEdit("");
        setBankEditOpen(true);
    };

    const cancelBankEdit = () => {
        setBankError(null);
        setBankEditOpen(false);
        setBankSaving(false);
    };

    const saveBankAccount = async () => {
        const accessCode = getAccessCode();
        if (!accessCode) return;

        const bankName = bankNameEdit.trim();
        const accountNumber = accountNumberEdit.replace(/\s/g, "");
        if (!bankName) {
            setBankError("은행을 선택해주세요.");
            return;
        }
        if (!accountNumber) {
            setBankError("계좌번호를 입력해주세요.");
            return;
        }

        setBankSaving(true);
        setBankError(null);
        try {
            await updateWorkerBankAccount(bankName, accountNumber, accessCode);
            setStoredAccountNumber(accessCode, accountNumber);
            const refreshed = await getWorkerInfo(accessCode);
            const refreshedData = refreshed?.data ?? null;
            if (refreshedData) {
                const fullAccountNumber = resolveAccountNumber(refreshedData, accessCode) || accountNumber;
                setWorkerInfo({
                    ...refreshedData,
                    accountNumber: fullAccountNumber,
                });
            } else {
                setWorkerInfo(null);
            }
            setBankEditOpen(false);
            setAccountNumberEdit("");
        } catch (e) {
            console.error("Error updating bank account:", e);
            setBankError("계좌 정보 수정에 실패했습니다.");
        } finally {
            setBankSaving(false);
        }
    };

    /** 시간 문자열을 HH:mm 형태로 (초 제거) */
    const toHHmm = (timeStr: string): string => {
        const part = String(timeStr || "")
            .trim()
            .split(":");
        if (part.length >= 2) return `${part[0].padStart(2, "0")}:${part[1].padStart(2, "0")}`;
        return String(timeStr || "");
    };

    const formatWorkTime = (log: { startTime?: string; endTime?: string; workedMinutes: number }): string => {
        const hours = Math.floor(log.workedMinutes / 60);
        const hoursLabel = `${hours}시간`;
        if (log.startTime && log.endTime) {
            return `${toHHmm(log.startTime)}~${toHHmm(log.endTime)} (${hoursLabel})`;
        }
        return hoursLabel;
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const days = ["일", "월", "화", "수", "목", "금", "토"];
        const dayOfWeek = days[date.getDay()];
        return `${format(date, "yyyy.MM.dd")} (${dayOfWeek})`;
    };

    const handleSelectMonthYear = (year: number, month: number) => {
        setCurrentDate(new Date(year, month, 1));
        setPickerOpen(false);
    };

    const convertDeductionType = (deductionType: string): string => {
        switch (deductionType) {
            case "FOUR_INSURANCE":
                return "4대보험";
            case "THREE_POINT_THREE":
                return "3.3%";
            default:
                return "미적용";
        }
    };

    if (loading) {
        return (
            <Container>
                <PageTitle>근무내역</PageTitle>
                <ContentWrapper>
                    <LoadingText>로딩 중...</LoadingText>
                </ContentWrapper>
            </Container>
        );
    }

    return (
        <Container>
            <ContentWrapper>
                <TopRow>
                    <PageTitle>근무내역</PageTitle>
                    <MonthSelector>
                        <MonthPickerButton onClick={() => setPickerOpen(!pickerOpen)}>
                            {currentYear}년 {currentMonth + 1}월 ˅
                        </MonthPickerButton>
                    </MonthSelector>
                </TopRow>

                {pickerOpen && (
                    <PickerBox>
                        <WheelPickerRow>
                            <IosWheelPicker options={YEAR_OPTIONS(currentYear)} value={pendingYear} onChange={(y: number) => setPendingYear(y)} centerInputMode centerInputSuffix="년" />
                            <IosWheelPicker options={MONTH_OPTIONS} value={pendingMonth} onChange={(m: number) => setPendingMonth(m)} centerInputMode centerInputSuffix="월" />
                        </WheelPickerRow>
                        <PickerConfirmRow>
                            <PickerConfirmButton type="button" onClick={() => handleSelectMonthYear(pendingYear, pendingMonth)}>
                                적용
                            </PickerConfirmButton>
                        </PickerConfirmRow>
                    </PickerBox>
                )}

                <SummaryCard>
                    <SummaryMainItem>
                        <SummaryMainLabel>총 급여</SummaryMainLabel>
                        <SummaryMainValue>{workAmount?.netAfterDeduction != null ? `${workAmount.netAfterDeduction.toLocaleString()}원` : "-"}</SummaryMainValue>
                    </SummaryMainItem>
                    <SummaryDivider />
                    <SummaryMeta>
                        <SummaryMetaRow>
                            <SummaryMetaLabel>기본금</SummaryMetaLabel>
                            <SummaryMetaValue>{workAmount?.grossAmount != null ? `${workAmount.grossAmount.toLocaleString()}원` : "-"}</SummaryMetaValue>
                        </SummaryMetaRow>
                        <SummaryMetaRow>
                            <SummaryMetaLabel>공제내역({convertDeductionType(workAmount?.deductionType ?? "")})</SummaryMetaLabel>
                            <SummaryMetaValue>{workAmount?.deduction != null ? `${workAmount.deduction.toLocaleString()}원` : "-"}</SummaryMetaValue>
                        </SummaryMetaRow>

                        {workAmount?.deductionType && workAmount.deductionType !== "NONE" && (
                            <SummaryMetaDetails>
                                <SummaryMetaDetailsHeader>
                                    <SummaryMetaDetailsTitle>세부사항</SummaryMetaDetailsTitle>
                                    <SummaryMetaDetailsToggle
                                        type="button"
                                        aria-expanded={deductionDetailsOpen}
                                        onClick={() => setDeductionDetailsOpen((v) => !v)}
                                        title={deductionDetailsOpen ? "세부사항 접기" : "세부사항 펼치기"}
                                    >
                                        <SummaryMetaDetailsArrow $open={deductionDetailsOpen}>▾</SummaryMetaDetailsArrow>
                                    </SummaryMetaDetailsToggle>
                                </SummaryMetaDetailsHeader>

                                {deductionDetailsOpen &&
                                    (workAmount.deductionType === "THREE_POINT_THREE" ? (
                                        <SummaryMetaDetailsList>
                                            <SummaryMetaDetailsItem>
                                                <span>사업소득세(3.0%)</span>
                                                <span>{workAmount.threePointThree?.businessIncomeTax != null ? `${workAmount.threePointThree.businessIncomeTax.toLocaleString()}원` : "-"}</span>
                                            </SummaryMetaDetailsItem>
                                            <SummaryMetaDetailsItem>
                                                <span>지방소득세(0.3%)</span>
                                                <span>{workAmount.threePointThree?.localIncomeTax != null ? `${workAmount.threePointThree.localIncomeTax.toLocaleString()}원` : "-"}</span>
                                            </SummaryMetaDetailsItem>
                                        </SummaryMetaDetailsList>
                                    ) : (
                                        <SummaryMetaDetailsList>
                                            <SummaryMetaDetailsItem>
                                                <span>국민연금(4.75%)</span>
                                                <span>{workAmount.fourInsurance?.pension != null ? `${workAmount.fourInsurance.pension.toLocaleString()}원` : "-"}</span>
                                            </SummaryMetaDetailsItem>
                                            <SummaryMetaDetailsItem>
                                                <span>건강보험(3.595%)</span>
                                                <span>{workAmount.fourInsurance?.health != null ? `${workAmount.fourInsurance.health.toLocaleString()}원` : "-"}</span>
                                            </SummaryMetaDetailsItem>
                                            <SummaryMetaDetailsItem>
                                                <span>장기요양보험(0.4724%)</span>
                                                <span>{workAmount.fourInsurance?.longTermCare != null ? `${workAmount.fourInsurance.longTermCare.toLocaleString()}원` : "-"}</span>
                                            </SummaryMetaDetailsItem>
                                            <SummaryMetaDetailsItem>
                                                <span>고용보험(0.9%)</span>
                                                <span>{workAmount.fourInsurance?.employment != null ? `${workAmount.fourInsurance.employment.toLocaleString()}원` : "-"}</span>
                                            </SummaryMetaDetailsItem>
                                        </SummaryMetaDetailsList>
                                    ))}
                            </SummaryMetaDetails>
                        )}
                    </SummaryMeta>
                    <SummarySubItem>
                        <SummaryLabel>선정산액</SummaryLabel>
                        <SummaryValue>{workAmount?.totalAdvanced != null ? `${workAmount.totalAdvanced.toLocaleString()}원` : "-"}</SummaryValue>
                    </SummarySubItem>
                    <SummarySubItem>
                        <SummaryLabel>미결제 임금</SummaryLabel>
                        <SummaryValue>{workAmount?.available != null ? `${workAmount.available.toLocaleString()}원` : "-"}</SummaryValue>
                    </SummarySubItem>
                    <SummarySubItem>
                        <SummaryLabel>최대 선정산 가능액</SummaryLabel>
                        <SummaryValue>{workAmount?.maxAdvance != null ? `${workAmount.maxAdvance.toLocaleString()}원` : "-"}</SummaryValue>
                    </SummarySubItem>
                </SummaryCard>

                <BankInfoCard>
                    <BankInfoHeader>
                        <BankInfoTitle>계좌 정보</BankInfoTitle>
                        {!bankEditOpen ? (
                            <BankEditButton type="button" onClick={openBankEdit}>
                                수정
                            </BankEditButton>
                        ) : (
                            <BankEditButton type="button" onClick={cancelBankEdit}>
                                취소
                            </BankEditButton>
                        )}
                    </BankInfoHeader>
                    <SummaryDivider />
                    {!bankEditOpen ? (
                        <BankInfoBody>
                            <BankInfoRow>
                                <BankInfoValue>{workerInfo?.bankName || "-"}</BankInfoValue>

                                <BankInfoValue>{workerInfo?.accountNumber || "-"}</BankInfoValue>
                            </BankInfoRow>
                        </BankInfoBody>
                    ) : (
                        <BankEditBody>
                            <BankEditGrid>
                                <BankSelect value={bankNameEdit} onChange={(e) => setBankNameEdit(e.target.value)} required>
                                    <option value="">은행을 선택하세요</option>
                                    <option value="KB국민은행">KB국민은행</option>
                                    <option value="신한은행">신한은행</option>
                                    <option value="우리은행">우리은행</option>
                                    <option value="하나은행">하나은행</option>
                                    <option value="NH농협은행">NH농협은행</option>
                                    <option value="카카오뱅크">카카오뱅크</option>
                                    <option value="토스뱅크">토스뱅크</option>
                                    <option value="IBK기업은행">IBK기업은행</option>
                                    <option value="SC제일은행">SC제일은행</option>
                                    <option value="한국씨티은행">한국씨티은행</option>
                                    <option value="케이뱅크">케이뱅크</option>
                                    <option value="새마을금고">새마을금고</option>
                                    <option value="신협">신협</option>
                                    <option value="우체국">우체국</option>
                                    <option value="수협은행">수협은행</option>
                                    <option value="대구은행">대구은행</option>
                                    <option value="부산은행">부산은행</option>
                                    <option value="경남은행">경남은행</option>
                                    <option value="광주은행">광주은행</option>
                                    <option value="전북은행">전북은행</option>
                                    <option value="제주은행">제주은행</option>
                                </BankSelect>

                                <AccountInput type="text" value={accountNumberEdit} onChange={(e) => setAccountNumberEdit(e.target.value)} placeholder="계좌번호를 입력하세요" />
                            </BankEditGrid>

                            {bankError && <BankErrorText>{bankError}</BankErrorText>}

                            <BankEditActions>
                                <BankSaveButton type="button" onClick={saveBankAccount} disabled={bankSaving}>
                                    {bankSaving ? "저장 중..." : "저장"}
                                </BankSaveButton>
                            </BankEditActions>
                        </BankEditBody>
                    )}
                </BankInfoCard>

                {workLogs.length === 0 ? (
                    <EmptyState>해당 기간의 근무 기록이 없습니다.</EmptyState>
                ) : (
                    <WorkLogSection>
                        <WorkLogTable>
                            <TableHeader>
                                <TableRow>
                                    <TableHeaderCell>날짜</TableHeaderCell>
                                    <TableHeaderCell>근무시간</TableHeaderCell>
                                    <TableHeaderCell>급여</TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                            <tbody>
                                {[...workLogs].reverse().map((log) => (
                                    <TableRow key={log.workLogId}>
                                        <TableCell>{formatDate(log.workDate)}</TableCell>
                                        <TableCell>{formatWorkTime(log)}</TableCell>
                                        <TableCell>{log.earnedAmount?.toLocaleString() || 0}원</TableCell>
                                    </TableRow>
                                ))}
                            </tbody>
                        </WorkLogTable>
                    </WorkLogSection>
                )}
            </ContentWrapper>
        </Container>
    );
}

const Container = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
`;

const PageTitle = styled.h1`
    ${mypageTitle}
    font-weight: 700;
    color: #00ccc7;
    margin: 0;
`;

const ContentWrapper = styled.div`
    width: 922px;
    max-width: 100%;

    ${media.desktop} {
        width: 100%;
    }
`;

const SummaryCard = styled.div`
    background: transparent;
    border-radius: 12px;
    padding: 24px 30px;
    margin-bottom: 30px;
    border: 1.5px solid #00ccc7;
    display: flex;
    flex-direction: column;

    ${media.tablet} {
        padding: 20px;
        margin-bottom: 20px;
    }

    ${media.mobile} {
        padding: 16px;
        margin-bottom: 16px;
        border-radius: 8px;
    }
`;

const BankInfoCard = styled.div`
    background: transparent;
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 20px;
    border: 1.5px solid #00ccc7;

    ${media.mobile} {
        padding: 16px;
        border-radius: 8px;
    }
`;

const BankInfoHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
`;

const BankInfoTitle = styled.div`
    ${mypageSubtitle}
    font-weight: 700;
    color: #000;
`;

const BankEditButton = styled.button`
    ${mypageContent}
    border: none;
    background: transparent;
    color: #00ccc7;
    font-weight: 700;
    cursor: pointer;
    padding: 6px 8px;

    &:hover {
        opacity: 0.85;
    }
`;

const BankInfoBody = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const BankInfoRow = styled.div`
    display: flex;
    align-items: center;
    gap: 20px;
`;

// const BankInfoLabel = styled.div`
//     ${mypageContent}
//     color: #000;
//     font-weight: 500;
// `;

const BankInfoValue = styled.div`
    ${mypageContent}
    color: #000;
    font-weight: 600;
    text-align: right;
`;

const BankEditBody = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const BankEditGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    ${media.mobile} {
        grid-template-columns: 1fr;
    }
`;

const BankSelect = styled.select`
    width: 100%;
    height: 52px;
    padding: 0 16px;
    ${mypageContent}
    border: 1.5px solid #00ccc7;
    border-radius: 12px;
    background: #ffffff;
    transition: all 0.2s ease;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%20viewBox%3D%220%200%20292.4%20292.4%22%3E%3Cpath%20fill%3D%22%2300a8a5%22%20d%3D%22M287%20197.9L159.3%2069.2c-3.7-3.7-9.7-3.7-13.4%200L5.4%20197.9c-3.7%203.7-3.7%209.7%200%2013.4l13.4%2013.4c3.7%203.7%209.7%203.7%2013.4%200l110.7-110.7c3.7-3.7%209.7-3.7%2013.4%200l110.7%20110.7c3.7%203.7%209.7%203.7%2013.4%200l13.4-13.4c3.7-3.7%203.7-9.7%200-13.4z%22%2F%3E%3C%2Fsvg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    background-size: 12px;
    cursor: pointer;

    &:focus {
        outline: none;
        border-color: #00ccc7;
        box-shadow: 0 0 0 3px rgba(0, 204, 199, 0.18);
    }

    option[value=""] {
        display: none;
    }
`;

const AccountInput = styled.input`
    width: 100%;
    height: 52px;
    padding: 0 16px;
    ${mypageContent}
    border: 1.5px solid #00ccc7;
    border-radius: 12px;
    background: #ffffff;

    &:focus {
        outline: none;
        border-color: #00ccc7;
        box-shadow: 0 0 0 3px rgba(0, 204, 199, 0.18);
    }
`;

const BankEditActions = styled.div`
    display: flex;
    justify-content: flex-end;
`;

const BankSaveButton = styled.button`
    ${mypageContent}
    padding: 10px 16px;
    border: none;
    border-radius: 12px;
    background: #00ccc7;
    color: #fff;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:hover {
        opacity: 0.9;
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const BankErrorText = styled.div`
    ${mypageContent}
    color: #d32f2f;
    font-weight: 600;
`;

const SummaryMainItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
`;

const SummaryMainLabel = styled.div`
    ${mypageSubtitle}
    font-weight: 700;
    color: #000;
`;

const SummaryMainValue = styled.div`
    ${mypageSubtitle}
    font-weight: 700;
    color: #00ccc7;
`;

const SummaryDivider = styled.div`
    width: 100%;
    height: 1px;
    background: #e0e0e0;
    margin: 12px 0;
`;

const SummaryMeta = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 10px;
`;

const SummaryMetaRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 16px;
`;

const SummaryMetaLabel = styled.div`
    ${mypageContent}
    font-size: 13px;
    color: #555;
    font-weight: 500;
`;

const SummaryMetaValue = styled.div`
    ${mypageContent}
    font-size: 13px;
    color: #555;
    font-weight: 700;
    text-align: right;
`;

const SummaryMetaDetails = styled.div`
    margin-top: 6px;
    padding-top: 8px;
    border-top: 1px dashed #e0e0e0;
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

const SummaryMetaDetailsHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
`;

const SummaryMetaDetailsTitle = styled.div`
    ${mypageContent}
    font-size: 12px;
    color: #777;
    font-weight: 700;
`;

const SummaryMetaDetailsToggle = styled.button`
    border: none;
    background: transparent;
    padding: 2px 6px;
    cursor: pointer;
    color: #777;
    display: inline-flex;
    align-items: center;

    &:hover {
        opacity: 0.85;
    }
`;

const SummaryMetaDetailsArrow = styled.span<{ $open: boolean }>`
    display: inline-block;
    transition: transform 0.15s ease;
    transform: ${({ $open }) => ($open ? "rotate(180deg)" : "rotate(0deg)")};
`;

const SummaryMetaDetailsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const SummaryMetaDetailsItem = styled.div`
    ${mypageContent}
    font-size: 12px;
    color: #777;
    display: flex;
    justify-content: space-between;
    gap: 12px;
`;

const SummarySubItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
`;

const SummaryLabel = styled.div`
    ${mypageContent}
    color: #000;
    font-weight: 500;
`;

const SummaryValue = styled.div`
    ${mypageContent}
    font-weight: 600;
    color: #000;
`;

const MonthSelector = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0;
`;

const TopRow = styled.div`
    width: 100%;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    margin-bottom: 30px;
    gap: 16px;

    ${media.tablet} {
        margin-bottom: 20px;
    }

    ${media.mobile} {
        margin-bottom: 16px;
    }
`;

const MonthPickerButton = styled.button`
    ${mypageContent}
    padding: 12px 24px;
    background: #00ccc7;
    border: none;
    border-radius: 24px;
    color: #ffffff;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.9;
    }

    ${media.tablet} {
        padding: 10px 20px;
    }

    ${media.mobile} {
        padding: 8px 16px;
    }
`;

const PickerBox = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
    gap: 20px;
`;

const WheelPickerRow = styled.div`
    display: flex;
    gap: 40px;
    align-items: flex-start;
`;

const PickerConfirmRow = styled.div`
    margin-left: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const PickerConfirmButton = styled.button`
    ${mypageContent}
    width: 80px;
    height: 32px;
    font-weight: 600;
    color: #fff;
    background: #00ccc7;
    border: none;
    border-radius: 24px;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.85;
    }

    ${media.mobile} {
        min-width: 90px;
    }
`;

const WorkLogSection = styled.div`
    width: 100%;
    overflow-x: auto;
`;

const WorkLogTable = styled.table`
    width: 100%;
    min-width: 400px;
    background: transparent;
    border-radius: 12px;
    overflow: hidden;
    border-collapse: collapse;
    border: 1.5px solid #00ccc7;

    ${media.mobile} {
        min-width: 120px;
        border-radius: 8px;
    }
`;

const TableHeader = styled.thead`
    background-color: #ffffff;
`;

const TableRow = styled.tr`
    border-bottom: 1px solid #e0e0e0;

    &:hover {
        background-color: #ffffff;
    }

    &:last-child {
        border-bottom: none;
    }
`;

const TableHeaderCell = styled.th`
    ${mypageContent}
    padding: 16px;
    text-align: left;
    font-weight: 600;
    color: #000;

    ${media.tablet} {
        padding: 12px;
    }

    ${media.mobile} {
        padding: 10px 8px;
    }
`;

const TableCell = styled.td`
    ${mypageContent}
    padding: 16px;
    color: #000;

    ${media.tablet} {
        padding: 12px;
    }

    ${media.mobile} {
        font-size: clamp(8px, 3.2vw, 16px);
        //font-size: 3.2vw;
        padding: 10px 8px;
    }
`;

const EmptyState = styled.div`
    ${mypageContent}
    text-align: center;
    padding: 60px 20px;
    color: #000;

    ${media.mobile} {
        padding: 40px 16px;
    }
`;

const LoadingText = styled.div`
    ${mypageContent}
    text-align: center;
    padding: 60px 20px;
    color: #000;

    ${media.mobile} {
        padding: 40px 16px;
    }
`;
