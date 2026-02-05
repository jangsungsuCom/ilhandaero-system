import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { PageContainer, FormCard, Title, Form, FieldGroup, Label, Input, SubmitButton } from "../components/common/FormCard";
import urlAxios from "../utils/urlAxios";
import { media } from "../styles/breakpoints";

export default function FindEmailPage() {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [foundEmail, setFoundEmail] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setFoundEmail(null);

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
            const response = await urlAxios.post("/auth/find-email", {
                name: name.trim(),
                phone: phone.trim().replace(/-/g, ""),
            });
            setFoundEmail(response.data.data.email);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || "이메일을 찾을 수 없습니다.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageContainer>
            <FindEmailFormCard>
                <Title>아이디 찾기</Title>

                {foundEmail ? (
                    <ResultContainer>
                        <ResultText>회원님의 이메일은</ResultText>
                        <EmailText>{foundEmail}</EmailText>
                        <ResultText>입니다.</ResultText>
                        <ButtonGroup>
                            <SubmitButton type="button" onClick={() => navigate("/login")}>
                                로그인하기
                            </SubmitButton>
                            <SecondaryButton type="button" onClick={() => navigate("/reset-password")}>
                                비밀번호 찾기
                            </SecondaryButton>
                        </ButtonGroup>
                    </ResultContainer>
                ) : (
                    <Form onSubmit={handleSubmit}>
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
                            {isLoading ? "찾는 중..." : "이메일 찾기"}
                        </SubmitButton>
                    </Form>
                )}

                <BackLink>
                    <BackButton type="button" onClick={() => navigate("/login")}>
                        로그인 페이지로 가기
                    </BackButton>
                </BackLink>
            </FindEmailFormCard>
        </PageContainer>
    );
}

const FindEmailFormCard = styled(FormCard)`
    min-width: 420px;

    ${media.tablet} {
        min-width: 360px;
    }

    ${media.mobile} {
        min-width: 100%;
    }
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
    font-size: 16px;
    color: #333;
    margin: 0;
`;

const EmailText = styled.p`
    font-size: 24px;
    font-weight: 700;
    color: #00a8a5;
    margin: 8px 0;
`;

const ButtonGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    margin-top: 20px;
`;

const SecondaryButton = styled.button`
    width: 100%;
    height: 52px;
    font-size: 18px;
    font-weight: 600;
    color: #00a8a5;
    background: white;
    border: 1.5px solid #00a8a5;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #f0f9f8;
    }

    ${media.mobile} {
        height: 46px;
        font-size: 16px;
    }
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
