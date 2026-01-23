import { useState, useEffect } from "react";
import styled from "styled-components";
// import { type DateRange } from "react-day-picker";
// import { format, differenceInCalendarDays } from "date-fns";
import { PageContainer, FormCard, Title, Form, FieldGroup, Label, Input, ReadOnlyInput, InputWrapper, Unit, SubmitButton } from "../components/common/FormCard";
// import WorkPeriodPicker from "../components/specific/payment/WorkPeriodPicker";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import type { RootState } from "../store/store";
import { fetchCompanies, setSelectedCompany } from "../store/slices/companySlice";
import { fetchSalaryTargets } from "../store/slices/salaryTargetSlice";
import { getWorkAmount } from "../utils/workLog";
import { getLoginMethod } from "../utils/auth";

export default function PaymentPage() {
    const dispatch = useAppDispatch();
    const loginMethod = getLoginMethod();
    const { companies, selectedCompanyId } = useAppSelector((state: RootState) => state.company);
    const salaryTargets = useAppSelector((state: RootState) => state.salaryTarget.salaryTargetsByCompany);

    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | "">("");
    // const [workPeriod, setWorkPeriod] = useState<DateRange | undefined>(undefined);
    // const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [hourlyWage, setHourlyWage] = useState<number | "">("");
    const [bank, setBank] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [basicSalary, setBasicSalary] = useState<number>(0);
    const [advancePayment, setAdvancePayment] = useState<number>(0);
    const [additionalPayment, setAdditionalPayment] = useState<number>(0);
    const [additionalDeduction, setAdditionalDeduction] = useState<number>(0);

    // 실수령액 = 추가지급액 - 추가공제액
    const netPay = additionalPayment - additionalDeduction;

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

    // 직원 선택 시 정보 자동 채우기 및 work-amount API 호출
    useEffect(() => {
        if (loginMethod === "email" && selectedCompanyId && selectedEmployeeId) {
            const targets = salaryTargets[selectedCompanyId] || [];
            const selectedEmployee = targets.find((target) => target.id === selectedEmployeeId);
            if (selectedEmployee) {
                setHourlyWage(selectedEmployee.hourlyWage);
                setBank(selectedEmployee.bankName);
                setAccountNumber(selectedEmployee.accountNumber);

                // work-amount API 호출
                const loadWorkAmount = async () => {
                    try {
                        const response = await getWorkAmount(selectedEmployee.accessCode);
                        setBasicSalary(response.data.totalEarnedAmount);
                        setAdvancePayment(response.data.totalAdvancedAmount);
                        setAdditionalPayment(response.data.availableAmount);
                        setAdditionalDeduction(0);
                    } catch (error) {
                        console.error("Failed to load work amount:", error);
                    }
                };
                loadWorkAmount();
            }
        }
    }, [loginMethod, selectedCompanyId, selectedEmployeeId, salaryTargets]);

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
            <PageContainer width="580px">
                <FormCard>
                    <Title>급여 결제</Title>

                    <Form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Label>업장 선택</Label>
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
                        </FieldGroup>

                        <FieldGroup>
                            <Label>직원 선택</Label>
                            <Select
                                value={selectedEmployeeId}
                                onChange={(e) => setSelectedEmployeeId(e.target.value ? Number(e.target.value) : "")}
                                disabled={!selectedCompanyId}
                            >
                                <option value="">직원을 선택하세요</option>
                                {selectedCompanyId &&
                                    (salaryTargets[selectedCompanyId] || []).map((target) => (
                                        <option key={target.id} value={target.id}>
                                            {target.workerName}
                                        </option>
                                    ))}
                            </Select>
                        </FieldGroup>

                        {/* <FieldGroup>
                            <Label>근무기간 {daysWorked > 0 && `(${daysWorked}일)`}</Label>
                            <DateInputWrapper>
                                <DateDisplayButton type="button" onClick={handleOpenCalendar}>
                                    {getDateRangeDisplay()}
                                </DateDisplayButton>
                            </DateInputWrapper>
                        </FieldGroup> */}

                        <FieldGroup>
                            <Label>시급</Label>
                            <InputWrapper>
                                <Input type="number" value={hourlyWage} onChange={(e) => setHourlyWage(e.target.value ? Number(e.target.value) : "")} placeholder="시급 입력" min={0} disabled />
                                <Unit>원</Unit>
                            </InputWrapper>
                        </FieldGroup>

                        <FieldGroup>
                            <Label>은행</Label>
                            <Input type="text" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="은행명 입력" disabled />
                        </FieldGroup>

                        <FieldGroup>
                            <Label>계좌번호</Label>
                            <Input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="계좌번호 입력 (숫자만)" disabled />
                        </FieldGroup>

                        <FieldGroup>
                            <Label>기본급여</Label>
                            <ReadOnlyInput value={`${basicSalary.toLocaleString()} 원`} readOnly />
                        </FieldGroup>

                        <FieldGroup>
                            <Label>선지급금</Label>
                            <InputWrapper>
                                <Input type="number" value={advancePayment} onChange={(e) => setAdvancePayment(e.target.value ? Number(e.target.value) : 0)} placeholder="선지급금 입력" min={0} disabled />
                                <Unit>원</Unit>
                            </InputWrapper>
                        </FieldGroup>

                        <FieldGroup>
                            <Label>추가지급액</Label>
                            <InputWrapper>
                                <Input
                                    type="number"
                                    value={additionalPayment}
                                    onChange={(e) => setAdditionalPayment(e.target.value ? Number(e.target.value) : 0)}
                                    placeholder="추가지급액 입력"
                                    min={0}
                                    disabled
                                />
                                <Unit>원</Unit>
                            </InputWrapper>
                        </FieldGroup>

                        <FieldGroup>
                            <Label>추가공제액</Label>
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
                        </FieldGroup>

                        <FieldGroup>
                            <Label>실수령액</Label>
                            <ReadOnlyInput value={`${netPay.toLocaleString()} 원`} readOnly />
                        </FieldGroup>

                        <SubmitButton type="submit">결제하기</SubmitButton>
                    </Form>
                </FormCard>
            </PageContainer>
            {/* <WorkPeriodPicker isOpen={isCalendarOpen} selectedRange={workPeriod} onClose={handleCloseCalendar} onConfirm={handleConfirmDate} /> */}
        </>
    );
}

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

// const DateInputWrapper = styled.div`
//     position: relative;
// `;

// const DateDisplayButton = styled.button`
//     width: 100%;
//     height: 52px;
//     padding: 0 16px;
//     font-size: 17px;
//     border: 1.5px solid #00ccc7;
//     border-radius: 12px;
//     background: #f9fbfc;
//     text-align: left;
//     cursor: pointer;
//     transition: all 0.2s ease;

//     &:hover {
//         border-color: #00a8a5;
//         background: #f0f9f8;
//     }

//     &:focus {
//         outline: none;
//         border-color: #00a8a5;
//         box-shadow: 0 0 0 3px rgba(0, 204, 199, 0.18);
//     }
// `;
