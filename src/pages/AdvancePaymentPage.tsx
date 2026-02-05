import { useState, useEffect } from "react";
import styled from "styled-components";
import { format } from "date-fns";
import { PageContainer, FormCard, Title, Form, FieldGroup, Label, Input, ReadOnlyInput, InputWrapper, Unit } from "../components/common/FormCard";
import { getWorkAmount, createAdvanceRequest, getWorkerInfo } from "../utils/workLog";
import { getAccessCode } from "../utils/auth";

/**
 * payDay 기준으로 from, to 날짜를 계산합니다.
 * - 오늘이 payDay 이후라면: 이번달 payDay ~ 다음달 payDay
 * - 오늘이 payDay 이전이라면: 저번달 payDay ~ 이번달 payDay
 */
function getPayPeriod(payDay: number): { from: string; to: string } {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-based
    const currentDate = today.getDate();

    let toYear: number, toMonth: number;
    let fromYear: number, fromMonth: number;

    if (currentDate >= payDay) {
        // 오늘이 payDay 이후 → 이번달 payDay ~ 다음달 payDay
        fromYear = currentYear;
        fromMonth = currentMonth;
        toYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        toMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    } else {
        // 오늘이 payDay 이전 → 저번달 payDay ~ 이번달 payDay
        fromYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        fromMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        toYear = currentYear;
        toMonth = currentMonth;
    }

    const fromDate = new Date(fromYear, fromMonth, payDay);
    const toDate = new Date(toYear, toMonth, payDay);

    return {
        from: format(fromDate, "yyyy-MM-dd"),
        to: format(toDate, "yyyy-MM-dd"),
    };
}

export default function AdvancePaymentPage() {
    const [cumulativeReceived, setCumulativeReceived] = useState<number>(0);
    const [cumulativeAdvance, setCumulativeAdvance] = useState<number>(0);
    const [maxAdvanceAmount, setMaxAdvanceAmount] = useState<number>(0);
    const [advanceAmount, setAdvanceAmount] = useState<number | "">("");
    const [fee, setFee] = useState<number | "">("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadWorkAmount = async () => {
            try {
                const accessCode = getAccessCode();
                if (!accessCode) {
                    console.error("Access code not found");
                    return;
                }

                // 먼저 worker 정보에서 payDay를 가져옴
                const workerInfo = await getWorkerInfo(accessCode);
                const payDay = workerInfo.data.payDay;

                // payDay 기준으로 from, to 계산
                const { from, to } = getPayPeriod(payDay);
                console.log(`Pay period: ${from} ~ ${to} (payDay: ${payDay})`);

                const response = await getWorkAmount(accessCode, from, to);
                console.log("response", response);
                setCumulativeReceived(response.data.grossAmount);
                setCumulativeAdvance(response.data.totalAdvanced);
                setMaxAdvanceAmount(response.data.maxAdvance);
            } catch (error) {
                console.error("Failed to load work amount:", error);
            }
        };

        loadWorkAmount();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!advanceAmount || advanceAmount > maxAdvanceAmount) {
            alert("선지급 가능 금액을 초과했습니다.");
            return;
        }

        if (typeof advanceAmount !== "number") {
            alert("선지급 금액을 입력해주세요.");
            return;
        }

        setIsSubmitting(true);
        try {
            const accessCode = getAccessCode();
            if (!accessCode) {
                alert("접근 코드를 찾을 수 없습니다.");
                return;
            }
            await createAdvanceRequest(advanceAmount, accessCode);
            alert("선지급 요청이 완료되었습니다!");
            // 폼 초기화
            setAdvanceAmount("");
        } catch (error: any) {
            alert(error.response?.data?.message || "선지급 요청에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAdvanceAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value ? Number(e.target.value) : "";
        if (value === "" || (typeof value === "number" && value <= maxAdvanceAmount)) {
            setAdvanceAmount(value);
        }
    };

    return (
        <PageContainer width="525px">
            <FormCard>
                <Title>선지급 요청</Title>

                <Form onSubmit={handleSubmit}>
                    <RowFieldGroup>
                        <RowLabel>누적 급여</RowLabel>
                        <ControlArea>
                            <ReadOnlyInput value={`${cumulativeReceived.toLocaleString()} 원`} readOnly />
                        </ControlArea>
                    </RowFieldGroup>

                    <RowFieldGroup>
                        <RowLabel>누적 선지급액</RowLabel>
                        <ControlArea>
                            <ReadOnlyInput value={`${cumulativeAdvance.toLocaleString()} 원`} readOnly />
                        </ControlArea>
                    </RowFieldGroup>

                    <RowFieldGroup>
                        <RowLabel>
                            선지급 금액 <span style={{ fontSize: "12px", color: "#666", fontWeight: "normal" }}>(최대 {maxAdvanceAmount.toLocaleString()}원)</span>
                        </RowLabel>
                        <ControlArea>
                            <InputWrapper>
                                <Input type="number" value={advanceAmount} onChange={handleAdvanceAmountChange} placeholder="금액 입력" min={0} max={maxAdvanceAmount} />
                                <Unit>원</Unit>
                            </InputWrapper>
                        </ControlArea>
                    </RowFieldGroup>

                    <RowFieldGroup>
                        <RowLabel>사용이용료</RowLabel>
                        <ControlArea>
                            <InputWrapper>
                                <Input type="number" value={fee} onChange={(e) => setFee(e.target.value ? Number(e.target.value) : "")} placeholder="0" disabled />
                                <Unit>원</Unit>
                            </InputWrapper>
                        </ControlArea>
                    </RowFieldGroup>

                    <SectionDivider />

                    <RequestButton type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "요청 중..." : "요청하기"}
                    </RequestButton>
                </Form>
            </FormCard>
        </PageContainer>
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

const RequestButton = styled.button`
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
    margin: 20px auto 0;

    &:hover:not(:disabled) {
        border-color: #00ccc7;
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;
