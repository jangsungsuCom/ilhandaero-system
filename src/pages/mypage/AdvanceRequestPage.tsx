import { useState } from "react";
import styled from "styled-components";
import { useMypageAdvanceRequests } from "../../hooks/useMypageAdvanceRequests";
import { getStatusLabel } from "../../types/mypage";

export default function AdvanceRequestPage() {
    const { requests, loading, approveRequest, rejectRequest } = useMypageAdvanceRequests();
    const [processingId, setProcessingId] = useState<number | null>(null);

    const handleApprove = async (request: any) => {
        if (window.confirm("선지급 요청을 승인하시겠습니까?")) {
            setProcessingId(request.requestId);
            try {
                await approveRequest(request);
            } finally {
                setProcessingId(null);
            }
        }
    };

    const handleReject = async (request: any) => {
        if (window.confirm("선지급 요청을 거절하시겠습니까?")) {
            setProcessingId(request.requestId);
            try {
                await rejectRequest(request);
            } finally {
                setProcessingId(null);
            }
        }
    };

    if (loading) {
        return (
            <Container>
                <PageTitle>선지급 요청 목록</PageTitle>
                <ContentWrapper>
                    <LoadingText>로딩 중...</LoadingText>
                </ContentWrapper>
            </Container>
        );
    }

    return (
        <Container>
            <PageTitle>선지급 요청 목록</PageTitle>
            <ContentWrapper>
                {requests.length === 0 ? (
                    <EmptyState>선지급 요청이 없습니다.</EmptyState>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell>업장</TableHeaderCell>
                                <TableHeaderCell>직원명</TableHeaderCell>
                                <TableHeaderCell>요청일</TableHeaderCell>
                                <TableHeaderCell>금액</TableHeaderCell>
                                <TableHeaderCell>상태</TableHeaderCell>
                                <TableHeaderCell>작업</TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {requests.map((request) => (
                                <TableRow key={`${request.companyId}-${request.salaryTargetId}-${request.requestId}`}>
                                    <TableCell>{request.companyName || "-"}</TableCell>
                                    <TableCell>{request.workerName || "-"}</TableCell>
                                    <TableCell>{request.requestDate || "-"}</TableCell>
                                    <TableCell>{request.amount ? `${request.amount.toLocaleString()}원` : "-"}</TableCell>
                                    <TableCell>
                                        <StatusBadge $status={request.status || "PENDING"}>{getStatusLabel(request.status)}</StatusBadge>
                                    </TableCell>
                                    <TableCell>
                                        {request.status === "PENDING" && (
                                            <ActionButtons>
                                                <ApproveButton
                                                    onClick={() => handleApprove(request)}
                                                    disabled={processingId === request.requestId}
                                                >
                                                    {processingId === request.requestId ? "처리중..." : "승인"}
                                                </ApproveButton>
                                                <RejectButton
                                                    onClick={() => handleReject(request)}
                                                    disabled={processingId === request.requestId}
                                                >
                                                    {processingId === request.requestId ? "처리중..." : "거절"}
                                                </RejectButton>
                                            </ActionButtons>
                                        )}
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

const StatusBadge = styled.span<{ $status: string }>`
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    background-color: ${(props) => {
        if (props.$status === "APPROVED") return "#d4edda";
        if (props.$status === "REJECTED") return "#f8d7da";
        if (props.$status === "PAID") return "#cfe2ff";
        return "#fff3cd";
    }};
    color: ${(props) => {
        if (props.$status === "APPROVED") return "#155724";
        if (props.$status === "REJECTED") return "#721c24";
        if (props.$status === "PAID") return "#084298";
        return "#856404";
    }};
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 8px;
`;

const ApproveButton = styled.button`
    padding: 6px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: #28a745;
    color: white;
    font-weight: 600;

    &:hover:not(:disabled) {
        background-color: #218838;
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const RejectButton = styled.button`
    padding: 6px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: #dc3545;
    color: white;
    font-weight: 600;

    &:hover:not(:disabled) {
        background-color: #c82333;
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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
