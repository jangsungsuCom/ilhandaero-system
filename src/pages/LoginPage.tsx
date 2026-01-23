import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styled from "styled-components";
import { PageContainer, FormCard, Title, Form, FieldGroup, Label, Input, SubmitButton, ToggleButton } from "../components/common/FormCard";
import { loginWithEmail, validateAccessCode } from "../utils/auth";
import { useAppDispatch } from "../store/hooks";
import { setAccessToken, setAccessCode } from "../store/slices/authSlice";
import { fetchCompanies } from "../store/slices/companySlice";
import type { LoginMethod } from "../types/auth";

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();
    const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [inputAccessCode, setInputAccessCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            // URL에서 state 제거
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            if (loginMethod === "email") {
                if (!email.trim() || !password.trim()) {
                    setError("이메일과 비밀번호를 입력해주세요.");
                    setIsLoading(false);
                    return;
                }
                const response = await loginWithEmail({ email, password });
                // response.data.data에서 accessToken 추출
                const token = response.data.accessToken;
                dispatch(setAccessToken({ token, method: loginMethod }));

                // 업장 목록 로드
                await dispatch(fetchCompanies()).unwrap();

                navigate("/work-log");
            } else {
                if (!inputAccessCode.trim()) {
                    setError("접근 코드를 입력해주세요.");
                    setIsLoading(false);
                    return;
                }
                // accessCode 유효성 검증 (work-logs API 호출)
                await validateAccessCode(inputAccessCode);
                // 유효한 경우 로그인 처리
                dispatch(setAccessCode(inputAccessCode));
                navigate("/work-log");
            }
        } catch (err: any) {
            // 에러 응답에서 메시지 추출
            const errorMessage = err.response?.data?.message || err.message || "로그인에 실패했습니다. 다시 시도해주세요.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageContainer>
            <FormCard>
                <Title>로그인</Title>

                <MethodToggle>
                    <ToggleButton
                        type="button"
                        isActive={loginMethod === "email"}
                        onClick={() => {
                            setLoginMethod("email");
                            setError("");
                        }}
                    >
                        이메일 로그인
                    </ToggleButton>
                    <ToggleButton
                        type="button"
                        isActive={loginMethod === "accessCode"}
                        onClick={() => {
                            setLoginMethod("accessCode");
                            setError("");
                        }}
                    >
                        접근 코드 로그인
                    </ToggleButton>
                </MethodToggle>

                <Form onSubmit={handleSubmit}>
                    {loginMethod === "email" ? (
                        <>
                            <FieldGroup>
                                <Label>이메일</Label>
                                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일을 입력하세요" disabled={isLoading} />
                            </FieldGroup>

                            <FieldGroup>
                                <Label>비밀번호</Label>
                                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호를 입력하세요" disabled={isLoading} />
                            </FieldGroup>
                        </>
                    ) : (
                        <FieldGroup>
                            <Label>접근 코드</Label>
                            <Input type="text" value={inputAccessCode} onChange={(e) => setInputAccessCode(e.target.value)} placeholder="접근 코드를 입력하세요" disabled={isLoading} />
                        </FieldGroup>
                    )}

                    {successMessage && <SuccessText>{successMessage}</SuccessText>}
                    {error && <ErrorText>{error}</ErrorText>}

                    <SubmitButton type="submit" disabled={isLoading}>
                        {isLoading ? "로그인 중..." : "로그인"}
                    </SubmitButton>
                </Form>

                {loginMethod === "email" && (
                    <RegisterLink>
                        <RegisterButton type="button" onClick={() => navigate("/register")}>
                            회원가입
                        </RegisterButton>
                    </RegisterLink>
                )}
            </FormCard>
        </PageContainer>
    );
}

const MethodToggle = styled.div`
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
`;

const ErrorText = styled.p`
    font-size: 14px;
    color: #e57373;
    margin: -8px 0 0 4px;
    padding: 8px;
    background: #ffebee;
    border-radius: 8px;
    border-left: 3px solid #e57373;
`;

const RegisterLink = styled.div`
    text-align: center;
    margin-top: 24px;
    font-size: 14px;
    color: #666;
`;

const RegisterButton = styled.button`
    background: none;
    border: none;
    color: #00a8a5;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;

    &:hover {
        color: #00cbc7;
    }
`;

const SuccessText = styled.p`
    font-size: 14px;
    color: #4caf50;
    margin: -8px 0 0 4px;
    padding: 8px;
    background: #e8f5e9;
    border-radius: 8px;
    border-left: 3px solid #4caf50;
`;
