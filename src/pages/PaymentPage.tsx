import { useState, useEffect } from "react";
import styled from "styled-components";
import { type DateRange } from "react-day-picker";
import { format, subDays } from "date-fns";
import { PageContainer, FormCard, Title, Form, FieldGroup, Label, Input, ReadOnlyInput, InputWrapper, Unit } from "../components/common/FormCard";
import WorkPeriodPicker from "../components/specific/payment/WorkPeriodPicker";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type { RootState } from "../store/store";
import { fetchCompanies, setSelectedCompany } from "../store/slices/companySlice";
import { fetchSalaryTargets } from "../store/slices/salaryTargetSlice";
import { getWorkAmount } from "../utils/workLog";
import { postSalaryPay } from "../utils/paymentApi";
import { getLoginMethod } from "../utils/auth";
import { RiShareBoxLine } from "react-icons/ri";

export default function PaymentPage() {
    const dispatch = useAppDispatch();
    const loginMethod = getLoginMethod();
    const { companies, selectedCompanyId } = useAppSelector((state: RootState) => state.company);
    const salaryTargets = useAppSelector((state: RootState) => state.salaryTarget.salaryTargetsByCompany);

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | "">("");
    const [workPeriod, setWorkPeriod] = useState<DateRange | undefined>(() => {
        const now = new Date();
        return { from: subDays(now, 30), to: now };
    });
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [hourlyWage, setHourlyWage] = useState<number | "">("");
    const [bank, setBank] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [basicSalary, setBasicSalary] = useState<number>(0);
    const [weeklyAllowance, setWeeklyAllowance] = useState<number>(0);
    //const [grossAmount, setGrossAmount] = useState<number>(0);
    const [advancePayment, setAdvancePayment] = useState<number>(0);
    const [available, setAvailable] = useState<number>(0);
    const [additionalPayment, setAdditionalPayment] = useState<number>(0);
    const [additionalPaymentDescription, setAdditionalPaymentDescription] = useState<string>("");
    const [additionalDeduction, setAdditionalDeduction] = useState<number>(0);
    const [isCardPaying, setIsCardPaying] = useState(false);

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
            setAvailable(0);
            return;
        }
        const targets = salaryTargets[selectedCompanyId] || [];
        const emp = targets.find((t) => t.id === selectedEmployeeId);
        if (emp) {
            setHourlyWage(emp.hourlyWage);
            setBank(emp.bankName);
            setAccountNumber(emp.accountNumber);
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
                //setGrossAmount(d.grossAmount);
                setAdvancePayment(d.totalAdvanced);
                setAvailable(d.available);
                setAdditionalDeduction(0);
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

    const handleCardPay = async () => {
        if (!selectedCompanyId) {
            alert("업장을 선택해주세요.");
            return;
        }
        if (!selectedEmployeeId) {
            alert("직원을 선택해주세요.");
            return;
        }
        if (!fromStr || !toStr) {
            alert("근무기간을 선택해주세요.");
            return;
        }
        setIsCardPaying(true);
        try {
            await postSalaryPay(selectedCompanyId, selectedEmployeeId, fromStr, toStr, {
                extraPay: additionalPayment,
                extraMemo: additionalPaymentDescription || "",
            });
            alert("일반 급여 지급 처리되었습니다.");
            window.location.reload();
        } catch (err: unknown) {
            const message = err && typeof err === "object" && "response" in err && (err as { response?: { data?: { message?: string } } }).response?.data?.message;
            alert(message || "일반 급여 지급 처리에 실패했습니다.");
        } finally {
            setIsCardPaying(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedCompanyId) {
            alert("업장을 선택해주세요.");
            return;
        }
        if (!selectedEmployeeId) {
            alert("직원을 선택해주세요.");
            return;
        }

        // TODO: 실제 API 호출 또는 데이터 저장 로직
        alert("급여 결제가 완료되었습니다!");
    };

    return (
        <>
            <PageContainer width="525px">
                <FormCard>
                    <Title>급여 결제</Title>

                    <Form onSubmit={handleSubmit}>
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
                            <RowLabel>근무기간</RowLabel>
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
                                    <Input type="number" value={hourlyWage} onChange={(e) => setHourlyWage(e.target.value ? Number(e.target.value) : "")} placeholder="시급 입력" min={0} disabled />
                                    <Unit>원</Unit>
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
                            <RowLabel>기본급여</RowLabel>
                            <ControlArea>
                                <ReadOnlyInput value={`${basicSalary.toLocaleString()} 원`} readOnly />
                            </ControlArea>
                        </RowFieldGroup>

                        <RowFieldGroup>
                            <RowLabel>주휴수당</RowLabel>
                            <ControlArea>
                                <ReadOnlyInput value={`${weeklyAllowance.toLocaleString()} 원`} readOnly />
                            </ControlArea>
                        </RowFieldGroup>

                        <RowFieldGroup>
                            <RowLabel>선지급금</RowLabel>
                            <ControlArea>
                                <ReadOnlyInput value={`${advancePayment.toLocaleString()} 원`} readOnly />
                            </ControlArea>
                        </RowFieldGroup>

                        <RowFieldGroup>
                            <RowLabel>잔여금액</RowLabel>
                            <ControlArea>
                                <ReadOnlyInput value={`${available.toLocaleString()} 원`} readOnly />
                            </ControlArea>
                        </RowFieldGroup>

                        <SectionDivider />

                        <RowFieldGroup>
                            <RowLabel>추가지급액</RowLabel>
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
                                                value={additionalPayment}
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

                        <RowFieldGroup>
                            <RowLabel>추가공제액</RowLabel>
                            <ControlArea>
                                <InputWrapper>
                                    <Input
                                        type="number"
                                        value={additionalDeduction}
                                        onChange={(e) => setAdditionalDeduction(e.target.value ? Number(e.target.value) : 0)}
                                        placeholder="추가공제액 입력"
                                        min={0}
                                        disabled
                                    />
                                    <Unit>원</Unit>
                                </InputWrapper>
                            </ControlArea>
                        </RowFieldGroup>
                        <SectionDivider />
                        <RowFieldGroup>
                            <RowLabel>
                                <div style={{ fontSize: "24px", fontWeight: "bold", color: "#00ccc7" }}>실급여</div>
                            </RowLabel>
                            <ControlArea>
                                <ReadOnlyInput value={`${(available + additionalPayment).toLocaleString()} 원`} readOnly />
                            </ControlArea>
                        </RowFieldGroup>
                        <SectionDivider />

                        <AgreementRow>
                            <AgreementCheckbox />
                            <AgreementText>위 결제 내역에 동의</AgreementText>
                        </AgreementRow>

                        <PrimaryActionButton type="submit">
                            급여명세서 전송하기
                            <RiShareBoxLine style={{ fontSize: "24px", color: "white", marginLeft: "10px" }} />
                        </PrimaryActionButton>

                        <PaymentButtonsRow>
                            <PaymentButton type="button" onClick={handleCardPay} disabled={isCardPaying}>
                                {isCardPaying ? "처리 중..." : "카드결제"}
                            </PaymentButton>
                            <PaymentButton type="button">송금하기</PaymentButton>
                        </PaymentButtonsRow>
                    </Form>
                </FormCard>
            </PageContainer>
            <WorkPeriodPicker isOpen={isCalendarOpen} selectedRange={workPeriod} onClose={handleCloseCalendar} onConfirm={handleConfirmDate} />
        </>
    );
}

const RowFieldGroup = styled(FieldGroup)`
    flex-direction: row;
    align-items: center;
    gap: 60px;
`;

const RowLabel = styled(Label)`
    flex: 1;
    text-align: right;
`;

const ControlArea = styled.div`
    width: 330px;
`;

const SectionDivider = styled.div`
    border-top: 1px solid #bebebe;
    margin: 8px 0 20px;
`;

const PrimaryActionButton = styled.button`
    width: 446px;
    height: 63px;
    margin: 20px auto 0;
    font-size: 22px;
    line-height: 22px;
    font-weight: bold;
    color: white;
    background-color: #00ccc7;
    border: 2px solid transparent;
    border-radius: 10px;
    cursor: pointer;
    //box-shadow: 0 6px 12px rgba(0, 204, 199, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover:not(:disabled) {
        //transform: translateY(-2px);
        //box-shadow: 0 10px 20px rgba(0, 204, 199, 0.4);
        border-color: rgb(0, 161, 159);
    }

    &:active:not(:disabled) {
        transform: translateY(0);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const PaymentButtonsRow = styled.div`
    display: flex;
    justify-content: center;
    gap: 20px;
`;

const PaymentButton = styled.button`
    width: 212px;
    height: 63px;
    border-radius: 10px;
    background-image: linear-gradient(-60deg, #00cbc7 0%, #75ec9d 100%);
    border: 2px solid transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 21px;
    letter-spacing: 2px;
    color: #ffffff;
    font-weight: 800;
    cursor: pointer;

    &:hover {
        border-color: #00ccc7;
    }
`;

const AgreementRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
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
        background-color: #00ccc7;
    }
`;

const AgreementText = styled.span`
    font-size: 14px;
    line-height: 14px;
    color: #333;
    text-align: center;
`;

const InlineInputsRow = styled.div`
    display: flex;
    gap: 12px;
`;

const InlineInputBlock = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const InlineInputLabel = styled.span`
    font-size: 12px;
    color: #999;
`;

const Select = styled.select`
    width: 100%;
    padding: 12px;
    border: 1.5px solid #00ccc7;
    border-radius: 12px;
    font-size: 17px;
    background: white;
    cursor: pointer;

    &:focus {
        outline: none;
        border-color: #00a8a5;
        box-shadow: 0 0 0 3px rgba(0, 204, 199, 0.18);
    }

    &:disabled {
        background: #f5f5f5;
        cursor: not-allowed;
        opacity: 0.6;
    }

    option[value=""] {
        display: none;
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
    background: #f9fbfc;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
        border-color: #00a8a5;
        background: #f0f9f8;
    }

    &:focus {
        outline: none;
        border-color: #00a8a5;
        box-shadow: 0 0 0 3px rgba(0, 204, 199, 0.18);
    }

    &:disabled {
        background: #f5f5f5;
        cursor: not-allowed;
        opacity: 0.6;
    }
`;
