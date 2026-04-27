import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import styled from "styled-components";
import { EmailInput, Form, FormCard, Input, Label, PageContainer, SubmitButton, ToggleButton, FieldGroup } from "../components/common/FormCard";
import { media } from "../styles/breakpoints";
import { useAppDispatch } from "../store/hooks";
import { setAccessCode, setAccessToken } from "../store/slices/authSlice";
import { fetchCompanies } from "../store/slices/companySlice";
import type { LoginMethod } from "../types/auth";
import { loginWithEmail, validateAccessCode } from "../utils/auth";

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const dispatch = useAppDispatch();

    const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [inputAccessCode, setInputAccessCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [autoLogin, setAutoLogin] = useState(false);

    useEffect(() => {
        if (location.state?.message) {
            setSuccessMessage(location.state.message);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        if (searchParams.get("session_expired") === "1") {
            setSuccessMessage("로그인이 만료되었습니다. 다시 로그인해 주세요.");
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams]);

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
                const token = response.data.accessToken;
                dispatch(setAccessToken({ token, method: loginMethod }));
                await dispatch(fetchCompanies()).unwrap();
                navigate("/work-log");
                return;
            }

            if (!inputAccessCode.trim()) {
                setError("접근 코드를 입력해주세요.");
                setIsLoading(false);
                return;
            }

            await validateAccessCode(inputAccessCode);
            dispatch(setAccessCode(inputAccessCode));
            navigate("/work-log");
        } catch (err: any) {
            const originalMessage = err.response?.data?.originalMessage || err.response?.data?.message || err.message;

            if (loginMethod === "accessCode" && typeof originalMessage === "string" && originalMessage.includes("블랙리스트에 등록된 급여 대상자입니다")) {
                alert("현재 해당 계정은 접근이 제한된 상태입니다.\n이용 문의는 '일한대로 카카오고객센터'를 이용해 주세요");
                setError("");
            } else {
                const errorMessage = err.response?.data?.message || err.message || "로그인에 실패했습니다. 다시 시도해주세요.";
                setError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageContainer>
            <LoginFormCard>
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
                                <EmailInput value={email} onChange={setEmail} placeholder="이메일" disabled={isLoading} />
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

                    <AutoLoginRow>
                        <AutoLoginCheckbox type="checkbox" id="autoLogin" checked={autoLogin} onChange={(e) => setAutoLogin(e.target.checked)} />
                        <AutoLoginLabel htmlFor="autoLogin">자동 로그인</AutoLoginLabel>
                    </AutoLoginRow>
                </Form>

                {loginMethod === "email" && (
                    <LinkRow>
                        <RegisterLink>
                            <RegisterButton type="button" onClick={() => navigate("/find-email")}>
                                아이디 찾기
                            </RegisterButton>
                        </RegisterLink>
                        <Divider />
                        <RegisterLink>
                            <RegisterButton type="button" onClick={() => navigate("/reset-password")}>
                                비밀번호 찾기
                            </RegisterButton>
                        </RegisterLink>
                        <Divider />
                        <RegisterLink>
                            <RegisterButton type="button" onClick={() => navigate("/register")}>
                                회원가입
                            </RegisterButton>
                        </RegisterLink>
                    </LinkRow>
                )}
            </LoginFormCard>
        </PageContainer>
    );
}

const MethodToggle = styled.div`
    display: flex;
    gap: 12px;
    margin-bottom: 24px;

    ${media.mobile} {
        gap: 8px;
        margin-bottom: 20px;
        flex-direction: column;
    }
`;

const ErrorText = styled.p`
    font-size: 14px;
    color: #000;
    margin: -8px 0 0 4px;
    padding: 8px;
    background: #fff;
    border-radius: 8px;
    border-left: 3px solid #000;

    ${media.mobile} {
        font-size: 13px;
    }
`;

const SuccessText = styled.p`
    font-size: 14px;
    color: #00ccc7;
    margin: -8px 0 0 4px;
    padding: 8px;
    background: #fff;
    border-radius: 8px;
    border-left: 3px solid #4caf50;

    ${media.mobile} {
        font-size: 13px;
    }
`;

const AutoLoginRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 16px;
    margin-right: 10px;
`;

const AutoLoginCheckbox = styled.input`
    width: 18px;
    height: 18px;
    border-radius: 4px;
    border: 2px solid #00ccc7;
    cursor: pointer;
    accent-color: #00ccc7;
`;

const AutoLoginLabel = styled.label`
    font-size: 14px;
    color: #666;
    cursor: pointer;
`;

const LoginFormCard = styled(FormCard)`
    min-width: 420px;

    ${media.tablet} {
        min-width: 360px;
    }

    ${media.mobile} {
        min-width: 100%;
    }
`;

const LinkRow = styled.div`
    width: 100%;
    display: flex;
    gap: 12px;
    justify-content: center;
    align-items: center;
    margin-top: 24px;
    margin-right: 5px;
`;

const RegisterLink = styled.div`
    text-align: center;
    font-size: 14px;
`;

const RegisterButton = styled.button`
    background: none;
    border: none;
    color: #00ccc7;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;

    &:hover {
        opacity: 0.8;
    }
`;

const Divider = styled.div`
    width: 2px;
    height: 12px;
    background-color: #00ccc7;
`;
