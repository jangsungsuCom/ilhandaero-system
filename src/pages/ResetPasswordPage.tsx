import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { PageContainer, FormCard, Title, Form, FieldGroup, Label, Input, SubmitButton, EmailInput } from "../components/common/FormCard";
import urlAxios from "../utils/urlAxios";
import { media } from "../styles/breakpoints";

type Step = "verify" | "reset" | "complete";

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>("verify");

    // Step 1: Verify
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");

    // Step 2: Reset
    const [resetToken, setResetToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!email.trim()) {
            setError("이메일을 입력해주세요.");
            return;
        }
        if (!name.trim()) {
            setError("이름을 입력해주세요.");
            return;
        }
        if (!phone.trim()) {
            setError("전화번호를 입력해주세요.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await urlAxios.post("/auth/password-reset/verify", {
                email: email.trim(),
                name: name.trim(),
                phone: phone.trim().replace(/-/g, ""),
            });
            setResetToken(response.data.data.resetToken);
            setStep("reset");
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || "인증에 실패했습니다. 입력 정보를 확인해주세요.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!newPassword.trim()) {
            setError("새 비밀번호를 입력해주세요.");
            return;
        }
        if (newPassword.length < 8) {
            setError("비밀번호는 8자 이상이어야 합니다.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("비밀번호가 일치하지 않습니다.");
            return;
        }

        setIsLoading(true);

        try {
            await urlAxios.post("/auth/password-reset/confirm", {
                resetToken,
                newPassword: newPassword.trim(),
            });
            setStep("complete");
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || "비밀번호 재설정에 실패했습니다.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageContainer>
            <ResetPasswordFormCard>
                <Title>비밀번호 찾기</Title>

                {step === "verify" && (
                    <Form onSubmit={handleVerify}>
                        <StepIndicator>1단계: 본인 인증</StepIndicator>

                        <FieldGroup>
                            <Label>이메일</Label>
                            <EmailInput value={email} onChange={setEmail} placeholder="이메일" disabled={isLoading} />
                        </FieldGroup>

                        <FieldGroup>
                            <Label>이름</Label>
                            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력하세요" disabled={isLoading} />
                        </FieldGroup>

                        <FieldGroup>
                            <Label>전화번호</Label>
                            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="전화번호를 입력하세요 (예: 01012341234)" disabled={isLoading} />
                        </FieldGroup>

                        {error && <ErrorText>{error}</ErrorText>}

                        <SubmitButton type="submit" disabled={isLoading}>
                            {isLoading ? "확인 중..." : "다음"}
                        </SubmitButton>
                    </Form>
                )}

                {step === "reset" && (
                    <Form onSubmit={handleReset}>
                        <StepIndicator>2단계: 새 비밀번호 설정</StepIndicator>

                        <FieldGroup>
                            <Label>새 비밀번호</Label>
                            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="새 비밀번호를 입력하세요 (8자 이상)" disabled={isLoading} />
                        </FieldGroup>

                        <FieldGroup>
                            <Label>비밀번호 확인</Label>
                            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="비밀번호를 다시 입력하세요" disabled={isLoading} />
                        </FieldGroup>

                        {error && <ErrorText>{error}</ErrorText>}

                        <SubmitButton type="submit" disabled={isLoading}>
                            {isLoading ? "변경 중..." : "비밀번호 변경"}
                        </SubmitButton>
                    </Form>
                )}

                {step === "complete" && (
                    <ResultContainer>
                        <ResultText>비밀번호 재설정을 완료했습니다.</ResultText>
                        <ResultSubText>새 비밀번호로 로그인해주세요.</ResultSubText>
                        <SubmitButton type="button" onClick={() => navigate("/login")}>
                            로그인 페이지로 가기
                        </SubmitButton>
                    </ResultContainer>
                )}

                {step !== "complete" && (
                    <BackLink>
                        <BackButton type="button" onClick={() => navigate("/login")}>
                            로그인으로 돌아가기
                        </BackButton>
                    </BackLink>
                )}
            </ResetPasswordFormCard>
        </PageContainer>
    );
}

const ResetPasswordFormCard = styled(FormCard)`
    min-width: 420px;

    ${media.tablet} {
        min-width: 360px;
    }

    ${media.mobile} {
        min-width: 100%;
    }
`;

const StepIndicator = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: #00a8a5;
    margin-bottom: 20px;
    padding: 8px 12px;
    background: #f0f9f8;
    border-radius: 8px;
    text-align: center;
`;

const ErrorText = styled.p`
    font-size: 14px;
    color: #e57373;
    margin: -8px 0 0 4px;
    padding: 8px;
    background: #ffebee;
    border-radius: 8px;
    border-left: 3px solid #e57373;

    ${media.mobile} {
        font-size: 13px;
    }
`;

const ResultContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 20px 0;
`;

const ResultText = styled.p`
    font-size: 20px;
    font-weight: 700;
    color: #333;
    margin: 0;
`;

const ResultSubText = styled.p`
    font-size: 14px;
    color: #666;
    margin: 0 0 20px 0;
`;

const BackLink = styled.div`
    text-align: center;
    margin-top: 24px;
`;

const BackButton = styled.button`
    background: none;
    border: none;
    color: #666;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    padding: 0;

    &:hover {
        color: #00a8a5;
    }
`;
