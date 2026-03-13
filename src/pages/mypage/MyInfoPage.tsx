import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FormCard, Form, FieldGroup, Label, Input, ReadOnlyInput, SubmitButton } from "../../components/common/FormCard";
import { mypageTitle, mypageSubtitle, mypageContent } from "../../styles/mypageTypography";
import { userApi } from "../../utils/userApi";
import type { MyInfoUpdateRequest } from "../../types/user";

const PROVIDER_LABEL: Record<string, string> = {
    LOCAL: "이메일",
    GOOGLE: "구글",
};

export default function MyInfoPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [email, setEmail] = useState("");
    const [provider, setProvider] = useState<string>("");
    const [name, setName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [phone, setPhone] = useState("");
    const [address1, setAddress1] = useState("");
    const [address2, setAddress2] = useState("");

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            try {
                const data = await userApi.getMyInfo();
                if (!mounted) return;
                setEmail(data.email);
                setProvider(data.provider || "LOCAL");
                setName(data.name ?? "");
                setBirthDate(data.birthDate ? data.birthDate.slice(0, 10) : "");
                setPhone(data.phone ?? "");
                setAddress1(data.address1 ?? "");
                setAddress2(data.address2 ?? "");
            } catch (e: unknown) {
                console.error("Failed to load my info:", e);
                if (mounted) {
                    const msg =
                        e && typeof e === "object" && "response" in e && e.response && typeof e.response === "object" && "data" in e.response && e.response.data && typeof e.response.data === "object" && "message" in e.response.data
                            ? String((e.response.data as { message?: string }).message)
                            : "회원 정보를 불러오지 못했습니다.";
                    alert(msg);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const body: MyInfoUpdateRequest = {
                name: name.trim() || undefined,
                birthDate: birthDate.trim() || undefined,
                phone: phone.trim() || undefined,
                address1: address1.trim() || undefined,
                address2: address2.trim() || undefined,
            };
            await userApi.updateMyInfo(body);
            alert("회원 정보가 수정되었습니다.");
            navigate("/mypage");
        } catch (err: unknown) {
            console.error("Failed to update my info:", err);
            const msg =
                err && typeof err === "object" && "response" in err && err.response && typeof err.response === "object" && "data" in err.response && err.response.data && typeof err.response.data === "object" && "message" in err.response.data
                    ? String((err.response.data as { message?: string }).message)
                    : "수정에 실패했습니다. 다시 시도해 주세요.";
            alert(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Container>
                <PageTitle>회원 정보 수정</PageTitle>
                <LoadingText>불러오는 중...</LoadingText>
            </Container>
        );
    }

    return (
        <Container>
            <PageTitle>회원 정보 수정</PageTitle>
            <ContentWrapper>
                <TransparentFormCard>
                    <Form onSubmit={handleSubmit}>
                        <FieldGroup>
                            <Label>이메일</Label>
                            <ReadOnlyInput value={email} readOnly />
                        </FieldGroup>
                        <FieldGroup>
                            <Label>로그인 방식</Label>
                            <ReadOnlyInput value={PROVIDER_LABEL[provider] ?? provider} readOnly />
                        </FieldGroup>
                        <FieldGroup>
                            <Label>이름</Label>
                            <Input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="이름을 입력하세요"
                            />
                        </FieldGroup>
                        <FieldGroup>
                            <Label>생년월일</Label>
                            <Input
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                            />
                        </FieldGroup>
                        <FieldGroup>
                            <Label>휴대폰 번호</Label>
                            <Input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="01012345678"
                            />
                        </FieldGroup>
                        <FieldGroup>
                            <Label>기본 주소</Label>
                            <Input
                                type="text"
                                value={address1}
                                onChange={(e) => setAddress1(e.target.value)}
                                placeholder="기본 주소를 입력하세요"
                            />
                        </FieldGroup>
                        <FieldGroup>
                            <Label>상세 주소</Label>
                            <Input
                                type="text"
                                value={address2}
                                onChange={(e) => setAddress2(e.target.value)}
                                placeholder="상세 주소 (동, 호수 등)"
                            />
                        </FieldGroup>
                        <ButtonGroup>
                            <SubmitButton type="submit" disabled={saving}>
                                {saving ? "저장 중..." : "저장"}
                            </SubmitButton>
                            <CancelButton type="button" onClick={() => navigate("/mypage")}>
                                취소
                            </CancelButton>
                        </ButtonGroup>
                    </Form>
                </TransparentFormCard>
            </ContentWrapper>
        </Container>
    );
}

const Container = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
`;

const PageTitle = styled.h1`
    ${mypageTitle}
    font-weight: 700;
    color: #00ccc7;
    margin: 0 0 30px 0;
    align-self: flex-start;
`;

const LoadingText = styled.p`
    ${mypageContent}
    color: #000;
    margin: 0;
`;

const TransparentFormCard = styled(FormCard)`
    background: transparent;
`;

const ContentWrapper = styled.div`
    width: 522px;
    max-width: 100%;
`;

const ButtonGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 20px;
    width: 100%;
`;

const CancelButton = styled.button`
    ${mypageSubtitle}
    width: 100%;
    height: 62px;
    font-weight: bold;
    color: white;
    background: #95a5a6;
    border: none;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #7f8c8d;
    }
`;
