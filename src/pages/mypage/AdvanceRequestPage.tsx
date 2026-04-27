import { useState, useMemo } from "react";
import styled from "styled-components";
import { useMypageAdvanceRequests } from "../../hooks/useMypageAdvanceRequests";
import { getStatusLabel, type MyPageAdvanceRequest } from "../../types/mypage";
import { media } from "../../styles/breakpoints";
import { mypageTitle, mypageContent } from "../../styles/mypageTypography";
import CustomSelect from "../../components/common/CustomSelect";

export default function AdvanceRequestPage() {
    const { requests, loading, approveRequest, rejectRequest } = useMypageAdvanceRequests();
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [selectedCompany, setSelectedCompany] = useState<string>("");
    const [selectedWorker, setSelectedWorker] = useState<string>("");
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const [selectedStatus, setSelectedStatus] = useState<string>("");

    const companyNames = useMemo(() => {
        const names = new Set(requests.map((r) => r.companyName).filter(Boolean));
        return Array.from(names);
    }, [requests]);

    const workerNames = useMemo(() => {
        if (!selectedCompany) return [];
        const names = new Set(
            requests.filter((r) => r.companyName === selectedCompany).map((r) => r.workerName).filter(Boolean)
        );
        return Array.from(names);
    }, [requests, selectedCompany]);

    const availableMonths = useMemo(() => {
        const months = new Set(
            requests
                .map((r) => r.requestedAt?.slice(0, 7))
                .filter(Boolean) as string[]
        );
        return Array.from(months).sort().reverse();
    }, [requests]);

    const filteredRequests = useMemo(() => {
        return requests.filter((r) => {
            if (selectedCompany && r.companyName !== selectedCompany) return false;
            if (selectedWorker && r.workerName !== selectedWorker) return false;
            if (selectedMonth && (!r.requestedAt || !r.requestedAt.startsWith(selectedMonth))) return false;
            if (selectedStatus && (r.status || "PENDING") !== selectedStatus) return false;
            return true;
        });
    }, [requests, selectedCompany, selectedWorker, selectedMonth, selectedStatus]);

    const handleApprove = async (request: MyPageAdvanceRequest) => {
        if (window.confirm("선정산 요청을 승인하시겠습니까?")) {
            setProcessingId(request.id);
            try {
                await approveRequest(request);
                // 테스트용: 직접 urlAxios로 POST 요청
                // await urlAxios.post(
                //     `/owner/companies/${request.companyId}/salary-targets/${request.salaryTargetId}/payouts/advance-requests/${request.requestId}/pay`,
                //     {},
                //     {
                //         headers: {
                //             "Content-Type": "application/json",
                //             Authorization: `Bearer ${getAuthToken()}`,
                //         },
                //     }
                // );
                //window.location.reload();
            } catch (err: unknown) {
                const message =
                    err && typeof err === "object" && "response" in err
                        ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "승인 처리에 실패했습니다.")
                        : "승인 처리에 실패했습니다.";
                alert(message);
            } finally {
                setProcessingId(null);
            }
        }
    };

    const handleReject = async (request: MyPageAdvanceRequest) => {
        if (window.confirm("선정산 요청을 거절하시겠습니까?")) {
            setProcessingId(request.id);
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
                <PageTitle>선정산 요청 목록</PageTitle>
                <ContentWrapper>
                    <LoadingText>로딩 중...</LoadingText>
                </ContentWrapper>
            </Container>
        );
    }

    return (
        <Container>
            <PageTitle>선정산 요청 목록</PageTitle>
            <ContentWrapper>
                <FilterRow>
                    {companyNames.length > 0 && (
                        <FilterSelect
                            value={selectedCompany}
                            options={[{ value: "", label: "전체 업장" }, ...companyNames.map((name) => ({ value: name, label: name }))]}
                            onChange={(value) => { setSelectedCompany(value); setSelectedWorker(""); }}
                        />
                    )}
                    {workerNames.length > 0 && (
                        <FilterSelect
                            value={selectedWorker}
                            options={[{ value: "", label: "전체 직원" }, ...workerNames.map((name) => ({ value: name, label: name }))]}
                            onChange={setSelectedWorker}
                        />
                    )}
                    {availableMonths.length > 0 && (
                        <FilterSelect
                            value={selectedMonth}
                            options={[{ value: "", label: "전체 월" }, ...availableMonths.map((month) => ({ value: month, label: month }))]}
                            onChange={setSelectedMonth}
                        />
                    )}
                    <FilterSelect
                        value={selectedStatus}
                        options={[
                            { value: "", label: "전체 상태" },
                            { value: "PENDING", label: "대기중" },
                            { value: "APPROVED", label: "승인" },
                            { value: "REJECTED", label: "거절" },
                            { value: "PAID", label: "결제완료" },
                        ]}
                        onChange={setSelectedStatus}
                    />
                </FilterRow>
                {filteredRequests.length === 0 ? (
                    <EmptyState>선정산 요청이 없습니다.</EmptyState>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell>업장</TableHeaderCell>
                                <TableHeaderCell>직원명</TableHeaderCell>
                                <TableHeaderCell>요청일</TableHeaderCell>
                                <TableHeaderCell>금액</TableHeaderCell>
                                <TableHeaderCell>수수료</TableHeaderCell>
                                <TableHeaderCell>상태</TableHeaderCell>
                                <TableHeaderCell>작업</TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {filteredRequests.map((request) => (
                                <TableRow key={`${request.companyId}-${request.salaryTargetId}-${request.id}`}>
                                    <TableCell>{request.companyName || "-"}</TableCell>
                                    <TableCell>{request.workerName || "-"}</TableCell>
                                    <TableCell>{request.requestedAt ? request.requestedAt.slice(0, 10) : "-"}</TableCell>
                                    <TableCell>{`${(request.amount ?? 0).toLocaleString()}원`}</TableCell>
                                    <TableCell>{`${(request.feeAmount ?? 0).toLocaleString()}원`}</TableCell>
                                    <TableCell>
                                        <StatusBadge $status={request.status || "PENDING"}>{getStatusLabel(request.status)}</StatusBadge>
                                    </TableCell>
                                    <TableCell>
                                        {request.status === "PENDING" && (
                                            <ActionButtons>
                                                <ApproveButton onClick={() => handleApprove(request)} disabled={processingId === request.id}>
                                                    {processingId === request.id ? "처리중..." : "승인"}
                                                </ApproveButton>
                                                <RejectButton onClick={() => handleReject(request)} disabled={processingId === request.id}>
                                                    {processingId === request.id ? "처리중..." : "거절"}
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
    ${mypageTitle}
    font-weight: 700;
    color: #00ccc7;
    margin: 0 0 30px 0;
    align-self: flex-start;
`;

const ContentWrapper = styled.div`
    width: 922px; /* 1152px * 0.8 = 921.6px */
    max-width: 100%;
`;

const FilterRow = styled.div`
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;

    ${media.mobile} {
        margin-bottom: 14px;
        gap: 8px;
    }
`;

const FilterSelect = styled(CustomSelect)`
    .custom-select-button {
        ${mypageContent}
        padding: 10px 32px 10px 16px;
        font-weight: 600;
        border: 1.5px solid #00ccc7;
        border-radius: 10px;
        background: #ffffff;
        color: #000;
        cursor: pointer;
    }

    .custom-select-button:focus {
        outline: none;
        border-color: #00ccc7;
        box-shadow: 0 0 0 3px rgba(0, 204, 199, 0.18);
    }

    ${media.mobile} {
        .custom-select-button {
            padding: 8px 28px 8px 12px;
        }
    }
`;

const Table = styled.table`
    width: 100%;
    background: transparent;
    border-radius: 12px;
    overflow: hidden;
    border-collapse: collapse;
    border: 1.5px solid #00ccc7;
`;

const TableHeader = styled.thead`
    background-color: #ffffff;
`;

const TableRow = styled.tr`
    border-bottom: 1px solid #e0e0e0;

    &:hover {
        background-color: #ffffff;
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
`;

const TableCell = styled.td`
    ${mypageContent}
    padding: 16px;
    color: #000;
`;

const StatusBadge = styled.span<{ $status: string }>`
    ${mypageContent}
    padding: 4px 12px;
    border-radius: 12px;
    font-weight: 500;
    background-color: ${(props) => (props.$status === "APPROVED" || props.$status === "PAID" ? "#00ccc7" : "#000")};
    color: #fff;
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 8px;
`;

const ApproveButton = styled.button`
    ${mypageContent}
    padding: 6px 16px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: #00ccc7;
    color: white;
    font-weight: 600;

    &:hover:not(:disabled) {
        background-color: #00ccc7;
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;

const RejectButton = styled.button`
    ${mypageContent}
    padding: 6px 16px;
    border: none;
    border-radius: 8px;
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
    ${mypageContent}
    text-align: center;
    padding: 60px 20px;
    color: #000;
`;

const LoadingText = styled.div`
    ${mypageContent}
    text-align: center;
    padding: 60px 20px;
    color: #000;
`;

