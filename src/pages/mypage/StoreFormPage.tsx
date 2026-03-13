import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { useMypageStores } from "../../hooks/useMypageStores";
import { useAppDispatch } from "../../store/hooks";
import { fetchCompanies } from "../../store/slices/companySlice";
import { FormCard, Form, FieldGroup, Label, Input, SubmitButton } from "../../components/common/FormCard";
import { mypageTitle, mypageSubtitle } from "../../styles/mypageTypography";

export default function StoreFormPage() {
    const dispatch = useAppDispatch();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;
    const navigate = useNavigate();
    const { createStore, updateStore, stores } = useMypageStores();
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit && id) {
            const store = stores.find((s) => s.companyId === Number(id));
            if (store) {
                setName(store.name);
            }
        }
    }, [isEdit, id, stores]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let result;
            if (isEdit && id) {
                result = await updateStore(Number(id), name);
            } else {
                result = await createStore(name);
            }
            if (result.success) {
                dispatch(fetchCompanies());
                navigate("/mypage");
            } else {
                alert("저장에 실패했습니다.");
            }
        } catch (error) {
            console.error("Error saving store:", error);
            alert("저장에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container>
            <PageTitle>{isEdit ? "업장 수정" : "업장 등록"}</PageTitle>
            <ContentWrapper>
                <TransparentFormCard>
                    <Form onSubmit={handleSubmit}>
                    <FieldGroup>
                        <Label>업장 이름</Label>
                        <Input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="업장 이름을 입력하세요"
                        />
                    </FieldGroup>
                    <ButtonGroup>
                        <SubmitButton type="submit" disabled={loading || !name.trim()} style={{ width: "100%" }}>
                            {loading ? "저장 중..." : isEdit ? "수정" : "등록"}
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

const TransparentFormCard = styled(FormCard)`
    background: transparent;
`;

const ContentWrapper = styled.div`
    width: 922px;
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
    background: #000;
    border: none;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #000;
    }
`;
