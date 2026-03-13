import { useNavigate, useParams } from "react-router-dom";
import styled from "styled-components";
import { useMypageWorkers } from "../../hooks/useMypageWorkers";
import { useMypageStores } from "../../hooks/useMypageStores";
import type { DeductionType } from "../../types/mypage";
import { media } from "../../styles/breakpoints";
import { mypageTitle, mypageSubtitle, mypageContent } from "../../styles/mypageTypography";

function getDeductionLabel(type?: DeductionType): string {
    switch (type) {
        case "FOUR_INSURANCE":
            return "4대보험";
        case "THREE_POINT_THREE":
            return "3.3%";
        default:
            return "-";
    }
}

const DEFAULT_COLOR = "#00ccc7";

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
                        <TextButton onClick={() => navigate(`/mypage/stores/${storeId}/workers/new`)}>+ 직원 등록</TextButton>
                        <BackButton onClick={() => navigate("/mypage")}>뒤로가기</BackButton>
                    </ButtonGroup>
                </Header>

                {workers.length === 0 ? (
                    <EmptyState>등록된 직원이 없습니다. 직원을 등록해주세요.</EmptyState>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell>작업</TableHeaderCell>
                                <TableHeaderCell>이름</TableHeaderCell>
                                <TableHeaderCell>전화번호</TableHeaderCell>
                                <TableHeaderCell>시급</TableHeaderCell>
                                <TableHeaderCell>지급일</TableHeaderCell>
                                <TableHeaderCell>은행</TableHeaderCell>
                                <TableHeaderCell>계좌번호</TableHeaderCell>
                                <TableHeaderCell>주휴수당</TableHeaderCell>
                                <TableHeaderCell>고용형태</TableHeaderCell>
                                <TableHeaderCell>접근코드</TableHeaderCell>
                                <TableHeaderCell>색상</TableHeaderCell>
                                {/* <TableHeaderCell>상태</TableHeaderCell> */}
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {workers.map((worker) => (
                                <TableRow key={worker.id}>
                                    <TableCell>
                                        <ActionButton onClick={() => navigate(`/mypage/stores/${storeId}/workers/${worker.id}/edit`)}>수정</ActionButton>
                                    </TableCell>
                                    <TableCell>{worker.workerName}</TableCell>
                                    <TableCell>{worker.phoneNumber}</TableCell>
                                    <TableCell>{worker.hourlyWage.toLocaleString()}원</TableCell>
                                    <TableCell>{worker.payDay}일</TableCell>
                                    <TableCell>{worker.bankName}</TableCell>
                                    <TableCell>{worker.accountNumber}</TableCell>
                                    <TableCell>{worker.weeklyAllowanceEnabled ? "적용" : "미적용"}</TableCell>
                                    <TableCell>{getDeductionLabel(worker.deductionType)}</TableCell>
                                    <TableCell>
                                        <AccessCode>{worker.accessCode}</AccessCode>
                                    </TableCell>
                                    <TableCell>
                                        <ColorDot $color={worker.colorHex && /^#[0-9A-Fa-f]{6}$/.test(worker.colorHex) ? worker.colorHex : DEFAULT_COLOR} title={worker.colorHex || DEFAULT_COLOR} />
                                    </TableCell>
                                    {/* <TableCell>
                                        <StatusBadge $status={worker.codeStatus}>{worker.codeStatus === "ACTIVE" ? "활성" : "비활성"}</StatusBadge>
                                    </TableCell> */}
                                </TableRow>
                            ))}
                        </tbody>
                    </Table>
                )}
            </ContentWrapper>
        </Container>
    );
}

export function WorkerListInline({ storeId }: { storeId: number }) {
    const { workers, loading } = useMypageWorkers(storeId);
    const navigate = useNavigate();

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
                <EmptyState>등록된 직원이 없습니다. 직원을 등록해주세요.</EmptyState>
            ) : (
                <InlineTableWrapper>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell>작업</TableHeaderCell>
                                <TableHeaderCell>이름</TableHeaderCell>
                                <TableHeaderCell>전화번호</TableHeaderCell>
                                <TableHeaderCell>시급</TableHeaderCell>
                                <TableHeaderCell>지급일</TableHeaderCell>
                                <TableHeaderCell>은행</TableHeaderCell>
                                <TableHeaderCell>계좌번호</TableHeaderCell>
                                <TableHeaderCell>주휴수당</TableHeaderCell>
                                <TableHeaderCell>고용형태</TableHeaderCell>
                                <TableHeaderCell>접근코드</TableHeaderCell>
                                <TableHeaderCell>색상</TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {workers.map((worker) => (
                                <TableRow key={worker.id}>
                                    <TableCell>
                                        <ActionButton onClick={() => navigate(`/mypage/stores/${storeId}/workers/${worker.id}/edit`)}>수정</ActionButton>
                                    </TableCell>
                                    <TableCell>{worker.workerName}</TableCell>
                                    <TableCell>{worker.phoneNumber}</TableCell>
                                    <TableCell>{worker.hourlyWage.toLocaleString()}원</TableCell>
                                    <TableCell>{worker.payDay}일</TableCell>
                                    <TableCell>{worker.bankName}</TableCell>
                                    <TableCell>{worker.accountNumber}</TableCell>
                                    <TableCell>{worker.weeklyAllowanceEnabled ? "적용" : "미적용"}</TableCell>
                                    <TableCell>{getDeductionLabel(worker.deductionType)}</TableCell>
                                    <TableCell>
                                        <AccessCode>{worker.accessCode}</AccessCode>
                                    </TableCell>
                                    <TableCell>
                                        <ColorDot $color={worker.colorHex && /^#[0-9A-Fa-f]{6}$/.test(worker.colorHex) ? worker.colorHex : DEFAULT_COLOR} title={worker.colorHex || DEFAULT_COLOR} />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </tbody>
                    </Table>
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
        color: #00ccc7;
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
        color: #000;
    }
`;

const Table = styled.table`
    width: 100%;
    min-width: 900px;
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

const AccessCode = styled.code`
    ${mypageContent}
    background-color: #f0f0f0;
    padding: 4px 8px;
    border-radius: 6px;
    font-family: monospace;
    color: #000;

    ${media.tablet} {
        padding: 3px 6px;
    }
`;

// const StatusBadge = styled.span<{ $status: "ACTIVE" | "INACTIVE" }>`
//     padding: 4px 12px;
//     border-radius: 12px;
//     font-size: 13px;
//     font-weight: 500;
//     background-color: ${(props) => (props.$status === "ACTIVE" ? "#d4edda" : "#f8d7da")};
//     color: ${(props) => (props.$status === "ACTIVE" ? "#155724" : "#721c24")};
// `;

const ActionButton = styled.button`
    ${mypageContent}
    padding: 4px 8px;
    width: 48px;
    border: none;
    border-radius: 8px;
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
