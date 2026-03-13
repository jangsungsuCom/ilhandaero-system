import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useMypageStores } from "../../hooks/useMypageStores";
import { useAppDispatch } from "../../store/hooks";
import { fetchCompanies } from "../../store/slices/companySlice";
import { media } from "../../styles/breakpoints";
import { mypageTitle, mypageSubtitle, mypageContent } from "../../styles/mypageTypography";
import { WorkerListInline } from "./WorkerListPage";

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
                    <TextButton onClick={() => navigate("/mypage/stores/new")}>+ 업장 등록</TextButton>
                </Header>

                {stores.length === 0 ? (
                    <EmptyState>등록된 업장이 없습니다. 업장을 등록해주세요.</EmptyState>
                ) : (
                    <StoresGrid>
                        {stores.map((store) => (
                            <StoreCard key={store.companyId}>
                                {editingId === store.companyId ? (
                                    <EditForm>
                                        <EditInput type="text" value={editName} onChange={(e) => setEditName(e.target.value)} onClick={(e) => e.stopPropagation()} />
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
                                        <StoreHeader>
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
                                        </StoreHeader>
                                        <InlineWorkersWrapper>
                                            <WorkerListInline storeId={store.companyId} />
                                        </InlineWorkersWrapper>
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
    ${mypageTitle}
    font-weight: 700;
    color: #00ccc7;
    margin: 0 0 30px 3px;
    align-self: flex-start;

    ${media.tablet} {
        margin-bottom: 20px;
    }

    ${media.mobile} {
        margin-bottom: 16px;
    }
`;

const ContentWrapper = styled.div`
    width: 1200px;
    max-width: 100%;

    ${media.desktop} {
        width: 100%;
    }
`;

const Header = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 30px;
    padding-right: 14px;

    ${media.tablet} {
        margin-bottom: 20px;
    }
`;

const TextButton = styled.button`
    ${mypageContent}
    background: none;
    border: none;
    color: #00ccc7;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    transition: all 0.2s ease;

    &:hover {
        color: #00ccc7;
    }
`;

const StoresGrid = styled.div`
    display: flex;
    flex-direction: column;
    gap: 20px;

    ${media.mobile} {
        gap: 16px;
    }
`;

const StoreCard = styled.div`
    width: 100%;
    background: #ffffff;
    padding: 24px;
    border-radius: 12px;
    border: 1.5px solid #00ccc7;
    cursor: default;
    transition: all 0.2s ease;

    ${media.mobile} {
        padding: 16px;
    }
`;

const InlineWorkersWrapper = styled.div`
    margin-top: 16px;
`;

const StoreHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
`;

const StoreName = styled.h3`
    ${mypageSubtitle}
    margin: 0 0 16px 0;
    font-weight: 600;
    color: #000;

    ${media.mobile} {
        margin-bottom: 12px;
    }
`;

const EditForm = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const EditInput = styled.input`
    ${mypageContent}
    width: 100%;
    padding: 12px;
    border: 1.5px solid #00ccc7;
    border-radius: 8px;

    ${media.mobile} {
        padding: 10px;
    }
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 8px;
`;

const ActionButton = styled.button<{ $variant?: "edit" | "delete" | "save" | "cancel" }>`
    ${mypageContent}
    flex: 1;
    padding: 8px 16px;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;

    ${(props) => {
        switch (props.$variant) {
            case "delete":
                return `
                    background: #00ccc7;
                    color: white;
                    &:hover {
                        opacity: 0.85;
                    }
                `;
            case "save":
                return `
                    background-color: #00ccc7;
                    color: white;
                    &:hover {
                        background-color: #00ccc7;
                    }
                `;
            case "cancel":
                return `
                    background-color: #000;
                    color: white;
                    &:hover {
                        background-color: #000;
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

    ${media.mobile} {
        padding: 6px 12px;
    }
`;

const EmptyState = styled.div`
    ${mypageContent}
    text-align: center;
    padding: 60px 20px;
    color: #000;

    ${media.mobile} {
        padding: 40px 16px;
    }
`;

const LoadingText = styled.div`
    ${mypageContent}
    text-align: center;
    padding: 60px 20px;
    color: #000;

    ${media.mobile} {
        padding: 40px 16px;
    }
`;
