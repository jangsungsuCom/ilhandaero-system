import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { useMypageStores } from "../../hooks/useMypageStores";
import { useMypageWorkers } from "../../hooks/useMypageWorkers";
import { media } from "../../styles/breakpoints";
import { mypageContent, mypageSubtitle, mypageTitle } from "../../styles/mypageTypography";
import type { DeductionType, MyPageWorker } from "../../types/mypage";

const DEFAULT_COLOR = "#00ccc7";

function getDeductionLabel(type?: DeductionType): string {
    switch (type) {
        case "FOUR_INSURANCE":
            return "4대보험";
        case "THREE_POINT_THREE":
            return "3.3%";
        default:
            return "미적용";
    }
}

function isBlacklisted(worker: MyPageWorker): boolean {
    return Boolean(worker.blacklisted);
}

function getBlacklistActionLabel(worker: MyPageWorker): string {
    return isBlacklisted(worker) ? "해제" : "블랙";
}

function getBlacklistConfirmMessage(worker: MyPageWorker): string {
    return isBlacklisted(worker)
        ? `${worker.workerName} 직원의 블랙리스트를 해제하시겠습니까?`
        : `${worker.workerName} 직원을 블랙리스트 처리하시겠습니까?`;
}

interface WorkerTableProps {
    workers: MyPageWorker[];
    onEdit: (workerId: number) => void;
    onDelete: (workerId: number, workerName: string) => void;
    onToggleBlacklist: (worker: MyPageWorker) => void;
}

function WorkerTable({ workers, onEdit, onDelete, onToggleBlacklist }: WorkerTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHeaderCell>작업</TableHeaderCell>
                    <TableHeaderCell>이름</TableHeaderCell>
                    <TableHeaderCell>생년월일</TableHeaderCell>
                    <TableHeaderCell>전화번호</TableHeaderCell>
                    <TableHeaderCell>시급</TableHeaderCell>
                    <TableHeaderCell>지급일</TableHeaderCell>
                    <TableHeaderCell>은행</TableHeaderCell>
                    <TableHeaderCell>계좌번호</TableHeaderCell>
                    <TableHeaderCell>주휴수당</TableHeaderCell>
                    <TableHeaderCell>공제 방식</TableHeaderCell>
                    <TableHeaderCell>접근코드</TableHeaderCell>
                    <TableHeaderCell>색상</TableHeaderCell>
                    <TableHeaderCell>상태</TableHeaderCell>
                </TableRow>
            </TableHeader>
            <tbody>
                {workers.map((worker) => {
                    const blacklisted = isBlacklisted(worker);

                    return (
                        <TableRow key={worker.id} $blacklisted={blacklisted}>
                            <TableCell>
                                <ActionButtonsInline>
                                    <ActionButton onClick={() => onEdit(worker.id)}>수정</ActionButton>
                                    <ActionButton $variant={blacklisted ? "restore" : "blacklist"} onClick={() => onToggleBlacklist(worker)}>
                                        {getBlacklistActionLabel(worker)}
                                    </ActionButton>
                                    <ActionButton $variant="delete" onClick={() => onDelete(worker.id, worker.workerName)}>
                                        삭제
                                    </ActionButton>
                                </ActionButtonsInline>
                            </TableCell>
                            <TableCell>{worker.workerName}</TableCell>
                            <TableCell>{worker.birthDate || "-"}</TableCell>
                            <TableCell>{worker.phoneNumber}</TableCell>
                            <TableCell>{worker.hourlyWage.toLocaleString()}원</TableCell>
                            <TableCell>{worker.payDay}일</TableCell>
                            <TableCell>{worker.bankName}</TableCell>
                            <TableCell>{worker.accountNumber}</TableCell>
                            <TableCell>{worker.weeklyAllowanceEnabled ? "적용" : "미적용"}</TableCell>
                            <TableCell>{getDeductionLabel(worker.deductionType)}</TableCell>
                            <TableCell>
                                <AccessCode $blacklisted={blacklisted}>{worker.accessCode}</AccessCode>
                            </TableCell>
                            <TableCell>
                                <ColorDot
                                    $color={worker.colorHex && /^#[0-9A-Fa-f]{6}$/.test(worker.colorHex) ? worker.colorHex : DEFAULT_COLOR}
                                    title={worker.colorHex || DEFAULT_COLOR}
                                />
                            </TableCell>
                            <TableCell>
                                <StatusBadge $blacklisted={blacklisted}>{blacklisted ? "블랙리스트" : "정상"}</StatusBadge>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </tbody>
        </Table>
    );
}

export default function WorkerListPage() {
    const { storeId } = useParams<{ storeId: string }>();
    const numericStoreId = storeId ? Number(storeId) : undefined;
    const { workers, loading, deleteWorker, toggleWorkerBlacklist } = useMypageWorkers(numericStoreId);
    const { stores } = useMypageStores();
    const navigate = useNavigate();

    const store = stores.find((s) => s.companyId === numericStoreId);

    const handleDeleteWorker = async (workerId: number, workerName: string) => {
        if (!window.confirm(`${workerName} 직원을 삭제하시겠습니까?`)) return;
        await deleteWorker(workerId);
    };

    const handleToggleBlacklist = async (worker: MyPageWorker) => {
        if (!window.confirm(getBlacklistConfirmMessage(worker))) return;
        await toggleWorkerBlacklist(worker);
    };

    if (loading) {
        return (
            <Container>
                <PageTitle>{store?.name || "업장"} - 직원 목록</PageTitle>
                <ContentWrapper>
                    <LoadingText>로딩 중...</LoadingText>
                </ContentWrapper>
            </Container>
        );
    }

    return (
        <Container>
            <PageTitle>{store?.name || "업장"} - 직원 목록</PageTitle>
            <ContentWrapper>
                <Header>
                    <ButtonGroup>
                        <TextButton onClick={() => navigate(`/mypage/stores/${storeId}/workers/new`)}>+ 직원 등록</TextButton>
                        <BackButton onClick={() => navigate("/mypage")}>뒤로가기</BackButton>
                    </ButtonGroup>
                </Header>

                {workers.length === 0 ? (
                    <EmptyState>등록된 직원이 없습니다. 직원을 먼저 등록해주세요.</EmptyState>
                ) : (
                    <WorkerTable
                        workers={workers}
                        onEdit={(workerId) => navigate(`/mypage/stores/${numericStoreId}/workers/${workerId}/edit`)}
                        onDelete={handleDeleteWorker}
                        onToggleBlacklist={handleToggleBlacklist}
                    />
                )}
            </ContentWrapper>
        </Container>
    );
}

export function WorkerListInline({ storeId }: { storeId: number }) {
    const { workers, loading, deleteWorker, toggleWorkerBlacklist } = useMypageWorkers(storeId);
    const navigate = useNavigate();

    const handleDeleteWorker = async (workerId: number, workerName: string) => {
        if (!window.confirm(`${workerName} 직원을 삭제하시겠습니까?`)) return;
        await deleteWorker(workerId);
    };

    const handleToggleBlacklist = async (worker: MyPageWorker) => {
        if (!window.confirm(getBlacklistConfirmMessage(worker))) return;
        await toggleWorkerBlacklist(worker);
    };

    if (loading) {
        return (
            <InlineWrapper>
                <LoadingText>로딩 중...</LoadingText>
            </InlineWrapper>
        );
    }

    return (
        <InlineWrapper>
            <InlineHeader>
                <InlineTitle>직원 목록</InlineTitle>
                <TextButton onClick={() => navigate(`/mypage/stores/${storeId}/workers/new`)}>+ 직원 등록</TextButton>
            </InlineHeader>

            {workers.length === 0 ? (
                <EmptyState>등록된 직원이 없습니다. 직원을 먼저 등록해주세요.</EmptyState>
            ) : (
                <InlineTableWrapper>
                    <WorkerTable
                        workers={workers}
                        onEdit={(workerId) => navigate(`/mypage/stores/${storeId}/workers/${workerId}/edit`)}
                        onDelete={handleDeleteWorker}
                        onToggleBlacklist={handleToggleBlacklist}
                    />
                </InlineTableWrapper>
            )}
        </InlineWrapper>
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

    ${media.tablet} {
        margin-bottom: 20px;
    }

    ${media.mobile} {
        margin-bottom: 16px;
    }
`;

const ContentWrapper = styled.div`
    width: 1152px;
    max-width: 100%;
    overflow-x: auto;

    ${media.desktop} {
        width: 100%;
    }
`;

const InlineWrapper = styled.div`
    margin-top: 16px;
`;

const InlineHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
`;

const InlineTitle = styled.h4`
    ${mypageSubtitle}
    margin: 0;
    font-weight: 600;
    color: #000;
`;

const InlineTableWrapper = styled.div`
    width: 100%;
    overflow-x: auto;
`;

const Header = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 30px;

    ${media.tablet} {
        margin-bottom: 20px;
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 24px;

    ${media.mobile} {
        gap: 16px;
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
        color: #00a8a5;
    }
`;

const BackButton = styled.button`
    ${mypageContent}
    background: none;
    border: none;
    color: #000;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    transition: all 0.2s ease;

    &:hover {
        color: #444;
    }
`;

const Table = styled.table`
    width: 100%;
    min-width: 1080px;
    background: transparent;
    border-radius: 12px;
    overflow: hidden;
    border-collapse: collapse;
    border: 1.5px solid #00ccc7;
`;

const TableHeader = styled.thead`
    background-color: #ffffff;
`;

const TableRow = styled.tr<{ $blacklisted?: boolean }>`
    border-bottom: 1px solid #e0e0e0;
    background-color: ${({ $blacklisted }) => ($blacklisted ? "#fff6f6" : "#ffffff")};

    &:hover {
        background-color: ${({ $blacklisted }) => ($blacklisted ? "#ffecec" : "#fafafa")};
    }

    &:last-child {
        border-bottom: none;
    }
`;

const TableHeaderCell = styled.th`
    ${mypageContent}
    padding: 16px;
    text-align: left;
    font-weight: 600;
    color: #000;
    white-space: nowrap;

    ${media.tablet} {
        padding: 12px 8px;
    }
`;

const TableCell = styled.td`
    ${mypageContent}
    padding: 16px;
    color: #000;
    white-space: nowrap;

    ${media.tablet} {
        padding: 12px 8px;
    }
`;

const ColorDot = styled.span<{ $color: string }>`
    display: inline-block;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${({ $color }) => $color};
    border: 1px solid rgba(0, 0, 0, 0.1);
    vertical-align: middle;
`;

const AccessCode = styled.code<{ $blacklisted?: boolean }>`
    ${mypageContent}
    background-color: ${({ $blacklisted }) => ($blacklisted ? "#fde4e4" : "#f0f0f0")};
    padding: 4px 8px;
    border-radius: 6px;
    font-family: monospace;
    color: ${({ $blacklisted }) => ($blacklisted ? "#b71c1c" : "#000")};

    ${media.tablet} {
        padding: 3px 6px;
    }
`;

const StatusBadge = styled.span<{ $blacklisted: boolean }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 4px 10px;
    border-radius: 999px;
    background: ${({ $blacklisted }) => ($blacklisted ? "#fde4e4" : "#e7f8f7")};
    color: ${({ $blacklisted }) => ($blacklisted ? "#b71c1c" : "#008884")};
    font-weight: 700;
`;

const ActionButtonsInline = styled.div`
    display: flex;
    gap: 6px;
`;

const ActionButton = styled.button<{ $variant?: "delete" | "blacklist" | "restore" }>`
    ${mypageContent}
    padding: 4px 8px;
    min-width: 48px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: ${({ $variant }) => {
        if ($variant === "delete") return "#000";
        if ($variant === "blacklist") return "#d32f2f";
        if ($variant === "restore") return "#2e7d32";
        return "#00cbc7";
    }};
    color: white;
    font-weight: 600;

    &:hover {
        background-color: ${({ $variant }) => {
            if ($variant === "delete") return "#222";
            if ($variant === "blacklist") return "#b71c1c";
            if ($variant === "restore") return "#1b5e20";
            return "#00a8a5";
        }};
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
