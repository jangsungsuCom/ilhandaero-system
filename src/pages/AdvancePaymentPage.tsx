import { useState, useEffect } from "react";
import {
    PageContainer,
    FormCard,
    Title,
    Form,
    FieldGroup,
    Label,
    Input,
    ReadOnlyInput,
    InputWrapper,
    Unit,
    SubmitButton,
} from "../components/common/FormCard";
import { getWorkAmount, createAdvanceRequest } from "../utils/workLog";
import { getAccessCode } from "../utils/auth";

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
                const response = await getWorkAmount(accessCode);
                setCumulativeReceived(response.data.totalEarnedAmount);
                setCumulativeAdvance(response.data.totalAdvancedAmount);
                setMaxAdvanceAmount(response.data.maxAdvanceAmount);
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
        <PageContainer width="580px">
            <FormCard>
                <Title>선지급 요청</Title>

                <Form onSubmit={handleSubmit}>
                    <FieldGroup>
                        <Label>누적 수령액</Label>
                        <ReadOnlyInput value={`${cumulativeReceived.toLocaleString()} 원`} readOnly />
                    </FieldGroup>

                    <FieldGroup>
                        <Label>누적 선지급액</Label>
                        <ReadOnlyInput value={`${cumulativeAdvance.toLocaleString()} 원`} readOnly />
                    </FieldGroup>

                    <FieldGroup>
                        <Label>
                            선지급 금액 <span style={{ fontSize: "14px", color: "#666", fontWeight: "normal" }}>(최대 {maxAdvanceAmount.toLocaleString()}원)</span>
                        </Label>
                        <InputWrapper>
                            <Input
                                type="number"
                                value={advanceAmount}
                                onChange={handleAdvanceAmountChange}
                                placeholder="금액 입력"
                                min={0}
                                max={maxAdvanceAmount}
                            />
                            <Unit>원</Unit>
                        </InputWrapper>
                    </FieldGroup>

                    <FieldGroup>
                        <Label>수수료</Label>
                        <InputWrapper>
                            <Input type="number" value={fee} onChange={(e) => setFee(e.target.value ? Number(e.target.value) : "")} placeholder="0" disabled />
                            <Unit>원</Unit>
                        </InputWrapper>
                    </FieldGroup>

                    <SubmitButton type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "요청 중..." : "요청하기"}
                    </SubmitButton>
                </Form>
            </FormCard>
        </PageContainer>
    );
}
