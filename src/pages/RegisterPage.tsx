import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { PageContainer, FormCard, Title, Form, FieldGroup, Label, Input, SubmitButton } from "../components/common/FormCard";
import { registerWithEmail } from "../utils/auth";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        birthDate: "",
        phone: "",
        address1: "",
        address2: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // 유효성 검사
        if (formData.password !== formData.confirmPassword) {
            setError("비밀번호가 일치하지 않습니다.");
            return;
        }

        if (formData.password.length < 8 || formData.password.length > 64) {
            setError("비밀번호는 8자 이상 64자 이하여야 합니다.");
            return;
        }

        if (!formData.name.trim()) {
            setError("이름을 입력해주세요.");
            return;
        }

        if (!formData.birthDate) {
            setError("생년월일을 입력해주세요.");
            return;
        }

        if (!formData.phone.trim()) {
            setError("전화번호를 입력해주세요.");
            return;
        }

        if (!formData.address1.trim()) {
            setError("기본주소를 입력해주세요.");
            return;
        }

        setIsLoading(true);

        try {
            await registerWithEmail({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                birthDate: formData.birthDate,
                phone: formData.phone,
                address1: formData.address1,
                address2: formData.address2 || undefined,
            });
            // 회원가입 성공 시 로그인 페이지로 이동
            navigate("/login", { state: { message: "회원가입이 완료되었습니다. 로그인해주세요." } });
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || "회원가입에 실패했습니다. 다시 시도해주세요.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageContainer>
            <RegisterFormCard>
                <Title>회원가입</Title>

                <Form onSubmit={handleSubmit}>
                    <FieldGroup>
                        <Label>이메일 *</Label>
                        <Input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="이메일을 입력하세요"
                            disabled={isLoading}
                            required
                        />
                    </FieldGroup>

                    <FieldGroup>
                        <Label>비밀번호 *</Label>
                        <Input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="비밀번호를 입력하세요 (8-64자)"
                            minLength={8}
                            maxLength={64}
                            disabled={isLoading}
                            required
                        />
                    </FieldGroup>

                    <FieldGroup>
                        <Label>비밀번호 확인 *</Label>
                        <Input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="비밀번호를 다시 입력하세요"
                            disabled={isLoading}
                            required
                        />
                    </FieldGroup>

                    <FieldGroup>
                        <Label>이름 *</Label>
                        <Input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="이름을 입력하세요"
                            disabled={isLoading}
                            required
                        />
                    </FieldGroup>

                    <FieldGroup>
                        <Label>생년월일 *</Label>
                        <Input
                            type="date"
                            name="birthDate"
                            value={formData.birthDate}
                            onChange={handleChange}
                            disabled={isLoading}
                            required
                        />
                    </FieldGroup>

                    <FieldGroup>
                        <Label>전화번호 *</Label>
                        <Input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="전화번호를 입력하세요"
                            disabled={isLoading}
                            required
                        />
                    </FieldGroup>

                    <FieldGroup>
                        <Label>기본주소 *</Label>
                        <Input
                            type="text"
                            name="address1"
                            value={formData.address1}
                            onChange={handleChange}
                            placeholder="기본주소를 입력하세요"
                            disabled={isLoading}
                            required
                        />
                    </FieldGroup>

                    <FieldGroup>
                        <Label>상세주소</Label>
                        <Input
                            type="text"
                            name="address2"
                            value={formData.address2}
                            onChange={handleChange}
                            placeholder="상세주소를 입력하세요 (선택사항)"
                            disabled={isLoading}
                        />
                    </FieldGroup>

                    {error && <ErrorText>{error}</ErrorText>}

                    <SubmitButton type="submit" disabled={isLoading}>
                        {isLoading ? "가입 중..." : "회원가입"}
                    </SubmitButton>
                </Form>

                <LinkText>
                    이미 계정이 있으신가요?                     <LinkButton onClick={() => navigate("/login")}>로그인</LinkButton>
                </LinkText>
            </RegisterFormCard>
        </PageContainer>
    );
}

const ErrorText = styled.p`
    font-size: 14px;
    color: #e57373;
    margin: -8px 0 0 4px;
    padding: 8px;
    background: #ffebee;
    border-radius: 8px;
    border-left: 3px solid #e57373;
`;

const LinkText = styled.div`
    text-align: center;
    margin-top: 24px;
    font-size: 14px;
    color: #666;
`;

const LinkButton = styled.button`
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

const RegisterFormCard = styled(FormCard)`
    min-width: 420px;
`;
