import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { useMypageWorkers } from "../../hooks/useMypageWorkers";
import { useMypageStores } from "../../hooks/useMypageStores";

export default function WorkerListPage() {
    const { storeId } = useParams<{ storeId: string }>();
    const { workers, loading } = useMypageWorkers(storeId ? Number(storeId) : undefined);
    const { stores } = useMypageStores();
    const navigate = useNavigate();

    const store = stores.find((s) => s.companyId === Number(storeId));

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
                        <TextButton onClick={() => navigate(`/mypage/stores/${storeId}/workers/new`)}>
                            + 직원 등록
                        </TextButton>
                        <BackButton onClick={() => navigate("/mypage")}>뒤로가기</BackButton>
                    </ButtonGroup>
                </Header>

                {workers.length === 0 ? (
                    <EmptyState>등록된 직원이 없습니다. 직원을 등록해주세요.</EmptyState>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell>이름</TableHeaderCell>
                                <TableHeaderCell>전화번호</TableHeaderCell>
                                <TableHeaderCell>시급</TableHeaderCell>
                                <TableHeaderCell>지급일</TableHeaderCell>
                                <TableHeaderCell>은행</TableHeaderCell>
                                <TableHeaderCell>계좌번호</TableHeaderCell>
                                <TableHeaderCell>접근코드</TableHeaderCell>
                                <TableHeaderCell>상태</TableHeaderCell>
                                <TableHeaderCell>작업</TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {workers.map((worker) => (
                                <TableRow key={worker.id}>
                                    <TableCell>{worker.workerName}</TableCell>
                                    <TableCell>{worker.phoneNumber}</TableCell>
                                    <TableCell>{worker.hourlyWage.toLocaleString()}원</TableCell>
                                    <TableCell>{worker.payDay}일</TableCell>
                                    <TableCell>{worker.bankName}</TableCell>
                                    <TableCell>{worker.accountNumber}</TableCell>
                                    <TableCell>
                                        <AccessCode>{worker.accessCode}</AccessCode>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge $status={worker.codeStatus}>
                                            {worker.codeStatus === "ACTIVE" ? "활성" : "비활성"}
                                        </StatusBadge>
                                    </TableCell>
                                    <TableCell>
                                        <ActionButton onClick={() => navigate(`/mypage/stores/${storeId}/workers/${worker.id}/edit`)}>
                                            수정
                                        </ActionButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </tbody>
                    </Table>
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

const ButtonGroup = styled.div`
    display: flex;
    gap: 24px;
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

const BackButton = styled.button`
    background: none;
    border: none;
    color: #555;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    transition: all 0.2s ease;

    &:hover {
        color: #333;
    }
`;

const Table = styled.table`
    width: 100%;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    border-collapse: collapse;
    border: 1.5px solid #00ccc7;
`;

const TableHeader = styled.thead`
    background-color: #f0f9f8;
`;

const TableRow = styled.tr`
    border-bottom: 1px solid #e0e0e0;

    &:hover {
        background-color: #f9fbfc;
    }

    &:last-child {
        border-bottom: none;
    }
`;

const TableHeaderCell = styled.th`
    padding: 16px;
    text-align: left;
    font-weight: 600;
    color: #2c3e50;
    font-size: 14px;
`;

const TableCell = styled.td`
    padding: 16px;
    color: #555;
    font-size: 14px;
`;

const AccessCode = styled.code`
    background-color: #f0f0f0;
    padding: 4px 8px;
    border-radius: 6px;
    font-family: monospace;
    font-size: 13px;
    color: #2c3e50;
`;

const StatusBadge = styled.span<{ $status: "ACTIVE" | "INACTIVE" }>`
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    background-color: ${(props) => (props.$status === "ACTIVE" ? "#d4edda" : "#f8d7da")};
    color: ${(props) => (props.$status === "ACTIVE" ? "#155724" : "#721c24")};
`;

const ActionButton = styled.button`
    padding: 6px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: #00cbc7;
    color: white;
    font-weight: 600;

    &:hover {
        background-color: #00a8a5;
    }
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
