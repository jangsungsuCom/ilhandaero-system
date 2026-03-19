import { useState, useEffect } from "react";
import styled from "styled-components";
import { type DateRange } from "react-day-picker";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { PageContainer, FormCard, Title, Form, FieldGroup, Label, Input, ReadOnlyInput, InputWrapper, Unit } from "../components/common/FormCard";
import WorkPeriodPicker from "../components/specific/payment/WorkPeriodPicker";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type { RootState } from "../store/store";
import { fetchCompanies, setSelectedCompany } from "../store/slices/companySlice";
import { fetchSalaryTargets } from "../store/slices/salaryTargetSlice";
import { getWorkAmount } from "../utils/workLog";
//import { postSalaryPay } from "../utils/paymentApi";
import { getLoginMethod } from "../utils/auth";
import { RiShareBoxLine } from "react-icons/ri";
import type { DeductionDetail } from "../types/payment";
import { media } from "../styles/breakpoints";
import { isInAppBrowser } from "../utils/inAppBrowser";
import { postSalaryPay } from "../utils/paymentApi";

export default function PaymentPage() {
    const dispatch = useAppDispatch();
    const loginMethod = getLoginMethod();
    const { companies, selectedCompanyId } = useAppSelector((state: RootState) => state.company);
    const salaryTargets = useAppSelector((state: RootState) => state.salaryTarget.salaryTargetsByCompany);

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | "">("");
    const [workPeriod, setWorkPeriod] = useState<DateRange | undefined>(() => {
        const now = new Date();
        return { from: startOfMonth(now), to: endOfMonth(now) };
    });
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [hourlyWage, setHourlyWage] = useState<number | "">("");
    const [bank, setBank] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [basicSalary, setBasicSalary] = useState<number>(0);
    const [weeklyAllowance, setWeeklyAllowance] = useState<number>(0);
    //const [grossAmount, setGrossAmount] = useState<number>(0);
    const [advancePayment, setAdvancePayment] = useState<number>(0);
    const [additionalPayment, setAdditionalPayment] = useState<number>(0);
    const [additionalPaymentDescription, setAdditionalPaymentDescription] = useState<string>("");
    const [deductionTotal, setDeductionTotal] = useState<number>(0);
    const [deductionDetail, setDeductionDetail] = useState<DeductionDetail>({});
    const [agreed, setAgreed] = useState(false);
    //const [isCardPaying, setIsCardPaying] = useState(false);

    // 잔여금액 = 기본+주휴 - 선정산금 (공제 뺀 값 아님). 최종 정산금 = (잔여금액+추가지급) - 공제액
    const remainingAmount = (basicSalary || 0) + (weeklyAllowance || 0) - (advancePayment || 0);
    const totalBeforeDeduction = remainingAmount + additionalPayment;
    const netPayment = totalBeforeDeduction - (deductionTotal || 0);

    // 이메일 로그인 시 업장 목록 로드
    useEffect(() => {
        if (loginMethod === "email" && companies.length === 0) {
            dispatch(fetchCompanies());
        }
    }, [loginMethod, dispatch, companies.length]);

    // 선택된 업장이 변경되면 직원 목록 로드
    useEffect(() => {
        if (loginMethod === "email" && selectedCompanyId && !salaryTargets[selectedCompanyId]) {
            dispatch(fetchSalaryTargets(selectedCompanyId));
        }
    }, [loginMethod, selectedCompanyId, dispatch, salaryTargets]);

    // 직원 선택 시 정보 자동 채우기, 해제 시 초기화
    useEffect(() => {
        if (loginMethod !== "email" || !selectedCompanyId) return;
        if (!selectedEmployeeId) {
            setHourlyWage("");
            setBank("");
            setAccountNumber("");
            setBasicSalary(0);
            setWeeklyAllowance(0);
            //setGrossAmount(0);
            setAdvancePayment(0);
            setDeductionTotal(0);
            setDeductionDetail({});
            const now = new Date();
            setWorkPeriod({ from: startOfMonth(now), to: endOfMonth(now) });
            return;
        }
        const targets = salaryTargets[selectedCompanyId] || [];
        const emp = targets.find((t) => t.id === selectedEmployeeId);
        if (emp) {
            setHourlyWage(emp.hourlyWage);
            setBank(emp.bankName);
            setAccountNumber(emp.accountNumber);

            // 직원 payDay 기반으로 정산 기간 자동 설정
            // 최근 급여일(이번 달 payDay가 지났으면 이번 달, 아니면 지난달)을 period 종료일로 사용
            // 시작일은 그 직전 급여일 다음날
            const now = new Date();
            const payDayRaw = typeof emp.payDay === "number" ? emp.payDay : 1;
            const payDay = Math.min(31, Math.max(1, Math.floor(payDayRaw)));

            const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
            const clampDay = (y: number, m: number, d: number) => Math.min(d, daysInMonth(y, m));

            const y = now.getFullYear();
            const m = now.getMonth();
            const today = now.getDate();

            // period end 기준 월 결정
            const endMonthOffset = today >= payDay ? 0 : -1;
            const endBase = new Date(y, m + endMonthOffset, 1);
            const endY = endBase.getFullYear();
            const endM = endBase.getMonth();
            const endD = clampDay(endY, endM, payDay);
            const periodEnd = new Date(endY, endM, endD);

            // period start = 직전 급여일 + 1일
            const prevBase = new Date(endY, endM - 1, 1);
            const prevY = prevBase.getFullYear();
            const prevM = prevBase.getMonth();
            const prevD = clampDay(prevY, prevM, payDay);
            const prevPayday = new Date(prevY, prevM, prevD);
            const periodStart = new Date(prevPayday);
            periodStart.setDate(periodStart.getDate() + 1);

            setWorkPeriod({ from: periodStart, to: periodEnd });
            setIsCalendarOpen(false);
        }
    }, [loginMethod, selectedCompanyId, selectedEmployeeId, salaryTargets]);

    const fromStr = workPeriod?.from ? format(workPeriod.from, "yyyy-MM-dd") : null;
    const toStr = workPeriod?.to ? format(workPeriod.to, "yyyy-MM-dd") : null;

    // work-amount API: 처음 렌더링(직원+기간 있을 때) 및 날짜 변경 시 호출
    useEffect(() => {
        if (loginMethod !== "email" || !selectedCompanyId || !selectedEmployeeId || !fromStr || !toStr) return;
        const targets = salaryTargets[selectedCompanyId] || [];
        const emp = targets.find((t) => t.id === selectedEmployeeId);
        if (!emp) return;

        const load = async () => {
            try {
                const res = await getWorkAmount(emp.accessCode, fromStr, toStr);
                const d = res.data;
                setBasicSalary(d.basePay);
                setWeeklyAllowance(d.weeklyAllowance);
                setAdvancePayment(d.totalAdvanced ?? d.totalAdvancedInPeriod ?? 0);
                setDeductionTotal(d.deduction ?? 0);
                const detail: DeductionDetail = {};
                if (d.threePointThree) {
                    if (d.threePointThree.businessIncomeTax != null) detail["사업소득세(3.0%)"] = d.threePointThree.businessIncomeTax;
                    if (d.threePointThree.localIncomeTax != null) detail["지방소득세(0.3%)"] = d.threePointThree.localIncomeTax;
                }
                if (d.fourInsurance) {
                    if (d.fourInsurance.pension != null) detail["국민연금(4.75%)"] = d.fourInsurance.pension;
                    if (d.fourInsurance.health != null) detail["건강보험(3.595%)"] = d.fourInsurance.health;
                    if (d.fourInsurance.longTermCare != null) detail["장기요양보험(0.4724%)"] = d.fourInsurance.longTermCare;
                    if (d.fourInsurance.employment != null) detail["고용보험(0.9%)"] = d.fourInsurance.employment;
                }
                setDeductionDetail(detail);
            } catch (e) {
                console.error("Failed to load work amount:", e);
            }
        };
        load();
    }, [loginMethod, selectedCompanyId, selectedEmployeeId, salaryTargets, fromStr, toStr]);

    const handleOpenCalendar = () => setIsCalendarOpen(true);
    const handleCloseCalendar = () => setIsCalendarOpen(false);
    const handleConfirmDate = (range: DateRange) => {
        setWorkPeriod(range);
        handleCloseCalendar();
    };
    const dateRangeDisplay = workPeriod?.from && workPeriod?.to ? `${format(workPeriod.from, "yyyy.MM.dd")} ~ ${format(workPeriod.to, "yyyy.MM.dd")}` : "근무기간 선택";

    // const handleCardPay = async () => {
    //     if (!selectedCompanyId) {
    //         alert("업장을 선택해주세요.");
    //         return;
    //     }
    //     if (!selectedEmployeeId) {
    //         alert("직원을 선택해주세요.");
    //         return;
    //     }
    //     if (!fromStr || !toStr) {
    //         alert("근무기간을 선택해주세요.");
    //         return;
    //     }
    //     setIsCardPaying(true);
    //     try {
    //         await postSalaryPay(selectedCompanyId, selectedEmployeeId, fromStr, toStr, {
    //             extraPay: additionalPayment,
    //             extraMemo: additionalPaymentDescription || "",
    //         });
    //         alert("일반 급여 지급 처리되었습니다.");
    //         window.location.reload();
    //     } catch (err: unknown) {
    //         const message = err && typeof err === "object" && "response" in err && (err as { response?: { data?: { message?: string } } }).response?.data?.message;
    //         alert(message || "일반 급여 지급 처리에 실패했습니다.");
    //     } finally {
    //         setIsCardPaying(false);
    //     }
    // };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCompanyId) {
            alert("업장을 선택해주세요.");
            return;
        }
        if (!selectedEmployeeId) {
            alert("직원을 선택해주세요.");
            return;
        }
        if (!agreed) {
            alert("결제 내역에 동의해주세요.");
            return;
        }

        try {
            if (!fromStr || !toStr) {
                alert("근무기간을 선택해주세요.");
                return;
            }
            const res = await postSalaryPay(selectedCompanyId, selectedEmployeeId, fromStr, toStr, {
                extraPay: additionalPayment,
                extraMemo: additionalPaymentDescription || "",
            });
            console.log(res.data);
            alert("급여 결제가 완료되었습니다!");
        } catch (error) {
            console.error("Failed to pay salary:", error);
            alert("급여 결제에 실패했습니다.");
        }
    };

    const inAppBrowser = isInAppBrowser();

    return (
        <>
            <PaymentPageWrap $inAppBrowser={inAppBrowser}>
                <PageContainer width="100%">
                    <FormCard>
                        <Title>정산금액 지급</Title>

                        <PaymentForm onSubmit={handleSubmit}>
                            <RowFieldGroup>
                                <RowLabel>업장 선택</RowLabel>
                                <ControlArea>
                                    <Select
                                        value={selectedCompanyId || ""}
                                        onChange={(e) => {
                                            dispatch(setSelectedCompany(Number(e.target.value) || null));
                                            setSelectedEmployeeId("");
                                        }}
                                    >
                                        <option value="">업장을 선택하세요</option>
                                        {companies.map((company) => (
                                            <option key={company.companyId} value={company.companyId}>
                                                {company.name}
                                            </option>
                                        ))}
                                    </Select>
                                </ControlArea>
                            </RowFieldGroup>

                            <RowFieldGroup>
                                <RowLabel>직원 선택</RowLabel>
                                <ControlArea>
                                    <Select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value ? Number(e.target.value) : "")} disabled={!selectedCompanyId}>
                                        <option value="">직원을 선택하세요</option>
                                        {selectedCompanyId &&
                                            (salaryTargets[selectedCompanyId] || []).map((target) => (
                                                <option key={target.id} value={target.id}>
                                                    {target.workerName}
                                                </option>
                                            ))}
                                    </Select>
                                </ControlArea>
                            </RowFieldGroup>

                            <RowFieldGroup>
                                <RowLabel>근무 기간</RowLabel>
                                <ControlArea>
                                    <DateInputWrapper>
                                        <DateDisplayButton type="button" onClick={handleOpenCalendar} disabled={!selectedEmployeeId}>
                                            {dateRangeDisplay}
                                        </DateDisplayButton>
                                    </DateInputWrapper>
                                </ControlArea>
                            </RowFieldGroup>

                            <RowFieldGroup>
                                <RowLabel>시급</RowLabel>
                                <ControlArea>
                                    <InputWrapper>
                                        <ReadOnlyInput value={`${(hourlyWage || 0).toLocaleString()} 원`} readOnly />
                                    </InputWrapper>
                                </ControlArea>
                            </RowFieldGroup>

                            <RowFieldGroup>
                                <RowLabel>은행</RowLabel>
                                <ControlArea>
                                    <Input type="text" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="은행명 입력" disabled />
                                </ControlArea>
                            </RowFieldGroup>

                            <RowFieldGroup>
                                <RowLabel>계좌번호</RowLabel>
                                <ControlArea>
                                    <Input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="계좌번호 입력 (숫자만)" disabled />
                                </ControlArea>
                            </RowFieldGroup>

                            <RowFieldGroup>
                                <RowLabel>기본 정산금</RowLabel>
                                <ControlArea>
                                    <ReadOnlyInput value={`${(basicSalary || 0).toLocaleString()} 원`} readOnly />
                                </ControlArea>
                            </RowFieldGroup>

                            <RowFieldGroup>
                                <RowLabel>주휴수당</RowLabel>
                                <ControlArea>
                                    <ReadOnlyInput value={`${(weeklyAllowance || 0).toLocaleString()} 원`} readOnly />
                                </ControlArea>
                            </RowFieldGroup>

                            <RowFieldGroup>
                                <RowLabel>선정산금</RowLabel>
                                <ControlArea>
                                    <ReadOnlyInput value={`${(advancePayment || 0).toLocaleString()} 원`} readOnly />
                                </ControlArea>
                            </RowFieldGroup>

                            <RowFieldGroup>
                                <RowLabel>잔여 금액</RowLabel>
                                <ControlArea>
                                    <ReadOnlyInput value={`${Math.max(0, remainingAmount).toLocaleString()} 원`} readOnly />
                                </ControlArea>
                            </RowFieldGroup>

                            <SectionDivider />

                            <RowFieldGroup>
                                <RowLabel>추가 지급액</RowLabel>
                                <ControlArea>
                                    <InlineInputsRow>
                                        <InlineInputBlock>
                                            <InlineInputLabel>내용</InlineInputLabel>
                                            <Input type="text" value={additionalPaymentDescription} onChange={(e) => setAdditionalPaymentDescription(e.target.value)} placeholder="예: 교통비" />
                                        </InlineInputBlock>
                                        <InlineInputBlock>
                                            <InlineInputLabel>금액</InlineInputLabel>
                                            <InputWrapper>
                                                <Input
                                                    type="number"
                                                    value={additionalPayment || ""}
                                                    onChange={(e) => setAdditionalPayment(e.target.value ? Number(e.target.value) : 0)}
                                                    placeholder="0"
                                                    min={0}
                                                />
                                                <Unit>원</Unit>
                                            </InputWrapper>
                                        </InlineInputBlock>
                                    </InlineInputsRow>
                                </ControlArea>
                            </RowFieldGroup>
                            <SectionDivider />
                            <RowFieldGroup>
                                <RowLabel>전체 공제액</RowLabel>
                                <ControlArea>
                                    <ReadOnlyInput value={`${(deductionTotal || 0).toLocaleString()} 원`} readOnly />
                                    {Object.entries(deductionDetail).map(([key, value]) => (
                                        <div key={key} style={{ fontSize: "14px", color: "#00ccc7" }}>
                                            {key}: {(value ?? 0).toLocaleString()} 원
                                        </div>
                                    ))}
                                </ControlArea>
                            </RowFieldGroup>
                            <SectionDivider />
                            <RowFieldGroup>
                                <RowLabel>
                                    <div style={{ fontSize: "16px", fontWeight: "bold", color: "#00ccc7" }}>최종 정산금</div>
                                </RowLabel>
                                <ControlArea>
                                    <ReadOnlyInput value={`${netPayment.toLocaleString()} 원`} readOnly />
                                </ControlArea>
                            </RowFieldGroup>
                            <SectionDivider />

                            <AgreementRow>
                                <AgreementCheckbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
                                <AgreementText>위 결제 내역에 동의</AgreementText>
                            </AgreementRow>

                            <PrimaryActionButton type="submit">
                                정산내역서 결제 후 전송하기
                                <RiShareBoxLine style={{ fontSize: "24px", color: "white", marginLeft: "10px" }} />
                            </PrimaryActionButton>

                            {/* <PaymentButtonsRow>
                            <PaymentButton type="button" onClick={handleCardPay} disabled={isCardPaying}>
                                {isCardPaying ? "처리 중..." : "카드결제"}
                            </PaymentButton>
                            <PaymentButton type="button">송금하기</PaymentButton>
                        </PaymentButtonsRow> */}
                        </PaymentForm>
                    </FormCard>
                </PageContainer>
            </PaymentPageWrap>
            <WorkPeriodPicker isOpen={isCalendarOpen} selectedRange={workPeriod} onClose={handleCloseCalendar} onConfirm={handleConfirmDate} />
        </>
    );
}

const PaymentPageWrap = styled.div<{ $inAppBrowser?: boolean }>`
    width: 525px;
    max-width: 100%;
    /* 인앱 브라우저: GPU 렌더링 강제, 레이아웃 안정화 */
    ${({ $inAppBrowser }) =>
        $inAppBrowser &&
        `
        -webkit-transform: translateZ(0);
        transform: translateZ(0);
        -webkit-backface-visibility: hidden;
        backface-visibility: hidden;
        min-height: 100vh;
        min-height: -webkit-fill-available;
    `}

    ${media.mobile} {
        width: 100%;
    }
`;

const PaymentForm = styled(Form)`
    gap: 16px;

    ${media.mobile} {
        gap: 16px;
    }
`;

const RowFieldGroup = styled(FieldGroup)`
    flex-direction: row;
    align-items: center;
    gap: 60px;

    ${media.mobile} {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
    }
`;

const RowLabel = styled(Label)`
    flex: 1;
    text-align: right;

    ${media.mobile} {
        text-align: left;
        flex: none;
    }
`;

const ControlArea = styled.div`
    width: 330px;
    display: flex;
    flex-direction: column;
    gap: 16px;

    ${media.mobile} {
        width: 100%;
    }
`;

const SectionDivider = styled.div`
    border-top: 1px solid #000;
    margin: 16px 0;
`;

const PrimaryActionButton = styled.button`
    width: 446px;
    max-width: 100%;
    height: 63px;
    margin: 16px auto 0;
    font-size: 22px;
    line-height: 22px;
    font-weight: bold;
    color: white;
    background: #00ccc7;
    border: 2px solid transparent;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover:not(:disabled) {
        border-color: rgb(0, 161, 159);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    ${media.mobile} {
        width: 100%;
        height: 52px;
        font-size: 18px;
    }
`;

// const PaymentButtonsRow = styled.div`
//     display: flex;
//     justify-content: center;
//     gap: 20px;
// `;

// const PaymentButton = styled.button`
//     width: 212px;
//     height: 63px;
//     border-radius: 10px;
//     background-image: linear-gradient(-60deg, #00cbc7 0%, #75ec9d 100%);
//     border: 2px solid transparent;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     font-size: 21px;
//     letter-spacing: 2px;
//     color: #ffffff;
//     font-weight: 800;
//     cursor: pointer;

//     &:hover {
//         border-color: #00ccc7;
//     }
// `;

const AgreementRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 16px;
`;

const AgreementCheckbox = styled.input.attrs({ type: "checkbox" })`
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid #00ccc7;
    background-color: transparent;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;

    &:checked {
        background: #00ccc7;
    }
`;

const AgreementText = styled.span`
    font-size: 14px;
    line-height: 14px;
    color: #00ccc7;
    text-align: center;
`;

const InlineInputsRow = styled.div`
    display: flex;
    gap: 16px;

    ${media.mobile} {
        flex-direction: column;
    }
`;

const InlineInputBlock = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const InlineInputLabel = styled.span`
    font-size: 12px;
    color: #00ccc7;
`;

const Select = styled.select`
    width: 100%;
    height: 52px;
    padding: 0 16px;
    border: 1.5px solid #00ccc7;
    border-radius: 12px;
    font-size: 17px;
    background: #ffffff;
    color: #000;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2300ccc7' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    padding-right: 40px;

    &:focus {
        outline: none;
        border-color: #00ccc7;
        box-shadow: 0 0 0 3px rgba(0, 204, 199, 0.18);
    }

    &:disabled {
        background-color: #f5f5f5;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23555' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
        color: #000;
        cursor: not-allowed;
    }

    option[value=""] {
        display: none;
    }

    ${media.mobile} {
        height: 46px;
        font-size: 16px;
        padding: 0 14px;
        padding-right: 40px;
    }
`;

const DateInputWrapper = styled.div`
    position: relative;
`;

const DateDisplayButton = styled.button`
    width: 100%;
    height: 52px;
    padding: 0 16px;
    font-size: 17px;
    border: 1.5px solid #00ccc7;
    border-radius: 12px;
    background: #ffffff;
    color: #000;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
    box-sizing: border-box;

    &:hover:not(:disabled) {
        border-color: #00ccc7;
    }

    &:focus {
        outline: none;
        border-color: #00ccc7;
        box-shadow: 0 0 0 3px rgba(0, 204, 199, 0.18);
    }

    &:disabled {
        background: #f5f5f5;
        color: #000;
        cursor: not-allowed;
    }

    ${media.mobile} {
        height: 46px;
        font-size: 16px;
        padding: 0 14px;
    }
`;
