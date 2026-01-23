import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useMypageStores } from "../../hooks/useMypageStores";
import { useAppDispatch } from "../../store/hooks";
import { fetchCompanies } from "../../store/slices/companySlice";

export default function DashboardPage() {
    const dispatch = useAppDispatch();
    const { stores, loading, deleteStore, updateStore } = useMypageStores();
    const navigate = useNavigate();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");

    const handleEdit = (store: { companyId: number; name: string }) => {
        setEditingId(store.companyId);
        setEditName(store.name);
    };

    const handleSaveEdit = async (companyId: number) => {
        if (editName.trim()) {
            const result = await updateStore(companyId, editName.trim());
            if (result.success) {
                dispatch(fetchCompanies());
            }
            setEditingId(null);
            setEditName("");
        }
    };

    const handleDelete = async (companyId: number) => {
        if (window.confirm("정말 삭제하시겠습니까?")) {
            const result = await deleteStore(companyId);
            if (result.success) {
                dispatch(fetchCompanies());
            }
        }
    };

    const handleCardClick = (storeId: number) => {
        navigate(`/mypage/stores/${storeId}/workers`);
    };

    if (loading) {
        return (
            <Container>
                <PageTitle>업장 목록</PageTitle>
                <ContentWrapper>
                    <LoadingText>로딩 중...</LoadingText>
                </ContentWrapper>
            </Container>
        );
    }

    return (
        <Container>
            <PageTitle>업장 목록</PageTitle>
            <ContentWrapper>
                <Header>
                    <TextButton onClick={() => navigate("/mypage/stores/new")}>
                        + 업장 등록
                    </TextButton>
                </Header>

                {stores.length === 0 ? (
                    <EmptyState>등록된 업장이 없습니다. 업장을 등록해주세요.</EmptyState>
                ) : (
                    <StoresGrid>
                        {stores.map((store) => (
                            <StoreCard key={store.companyId} onClick={() => handleCardClick(store.companyId)}>
                                {editingId === store.companyId ? (
                                    <EditForm>
                                        <EditInput
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <ActionButtons>
                                            <ActionButton
                                                $variant="save"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSaveEdit(store.companyId);
                                                }}
                                            >
                                                저장
                                            </ActionButton>
                                            <ActionButton
                                                $variant="cancel"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingId(null);
                                                }}
                                            >
                                                취소
                                            </ActionButton>
                                        </ActionButtons>
                                    </EditForm>
                                ) : (
                                    <>
                                        <StoreName>{store.name}</StoreName>
                                        <ActionButtons>
                                            <ActionButton
                                                $variant="edit"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(store);
                                                }}
                                            >
                                                수정
                                            </ActionButton>
                                            <ActionButton
                                                $variant="delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(store.companyId);
                                                }}
                                            >
                                                삭제
                                            </ActionButton>
                                        </ActionButtons>
                                    </>
                                )}
                            </StoreCard>
                        ))}
                    </StoresGrid>
                )}
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
    font-size: 32px;
    font-weight: 700;
    color: #00a8a5;
    margin: 0 0 30px 0;
    align-self: flex-start;
`;

const ContentWrapper = styled.div`
    width: 922px; /* 1152px * 0.8 = 921.6px */
    max-width: 100%;
`;

const Header = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 30px;
`;

const TextButton = styled.button`
    background: none;
    border: none;
    color: #00a8a5;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    transition: all 0.2s ease;

    &:hover {
        color: #00cbc7;
    }
`;


const StoresGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
`;

const StoreCard = styled.div`
    background: #f9fbfc;
    padding: 24px;
    border-radius: 12px;
    border: 1.5px solid #00ccc7;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 204, 199, 0.2);
    }
`;

const StoreName = styled.h3`
    margin: 0 0 16px 0;
    font-size: 20px;
    font-weight: 600;
    color: #2c3e50;
`;

const EditForm = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const EditInput = styled.input`
    width: 100%;
    padding: 12px;
    border: 1.5px solid #00ccc7;
    border-radius: 8px;
    font-size: 16px;
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 8px;
`;

const ActionButton = styled.button<{ $variant?: "edit" | "delete" | "save" | "cancel" }>`
    flex: 1;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    ${(props) => {
        switch (props.$variant) {
            case "delete":
                return `
                    background-color: #e74c3c;
                    color: white;
                    &:hover {
                        background-color: #c0392b;
                    }
                `;
            case "save":
                return `
                    background-color: #00cbc7;
                    color: white;
                    &:hover {
                        background-color: #00a8a5;
                    }
                `;
            case "cancel":
                return `
                    background-color: #95a5a6;
                    color: white;
                    &:hover {
                        background-color: #7f8c8d;
                    }
                `;
            default:
                return `
                    background-color: #95a5a6;
                    color: white;
                    &:hover {
                        background-color: #7f8c8d;
                    }
                `;
        }
    }}
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 60px 20px;
    color: #95a5a6;
    font-size: 16px;
`;

const LoadingText = styled.div`
    text-align: center;
    padding: 60px 20px;
    color: #95a5a6;
    font-size: 16px;
`;
