import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import type { RootState } from "../../store/store";
import { fetchSalaryTargets } from "../../store/slices/salaryTargetSlice";
import { useMypageStores } from "../../hooks/useMypageStores";
import { getSalaryPayouts, type SalaryPayout } from "../../utils/paymentApi";
import { media } from "../../styles/breakpoints";
import { mypageTitle, mypageContent } from "../../styles/mypageTypography";

const DAYS_OPTIONS = [30, 90, 365];

const getDeductionTypeLabel = (type?: string) => {
    switch (type) {
        case "FOUR_INSURANCE":
            return "4대보험";
        case "THREE_POINT_THREE":
            return "3.3%";
        case "NONE":
            return "미적용";
        default:
            return "-";
    }
};

export default function PaymentLogPage() {
    const dispatch = useAppDispatch();
    const { stores, loading: storesLoading } = useMypageStores();

    const { salaryTargetsByCompany } = useAppSelector((state: RootState) => state.salaryTarget);

    const [selectedCompanyId, setSelectedCompanyId] = useState<number | "">("");
    const [selectedSalaryTargetId, setSelectedSalaryTargetId] = useState<number | "">("");
    const [days, setDays] = useState<number>(365);

    const [loading, setLoading] = useState(false);
    const [payouts, setPayouts] = useState<SalaryPayout[]>([]);
    const [error, setError] = useState<string | null>(null);

    const salaryTargets = useMemo(() => {
        if (selectedCompanyId === "") return [];
        return salaryTargetsByCompany[selectedCompanyId] || [];
    }, [salaryTargetsByCompany, selectedCompanyId]);

    const selectedCompany = useMemo(() => {
        if (selectedCompanyId === "") return undefined;
        return stores.find((s) => s.companyId === selectedCompanyId);
    }, [stores, selectedCompanyId]);

    const selectedWorker = useMemo(() => {
        if (selectedSalaryTargetId === "") return undefined;
        return salaryTargets.find((t) => t.id === selectedSalaryTargetId);
    }, [salaryTargets, selectedSalaryTargetId]);

    useEffect(() => {
        if (selectedCompanyId === "") {
            setSelectedSalaryTargetId("");
            setPayouts([]);
            return;
        }

        setSelectedSalaryTargetId("");
        setPayouts([]);
        dispatch(fetchSalaryTargets(selectedCompanyId));
    }, [selectedCompanyId, dispatch]);

    // 업장/직원 자동 선택: "가장 첫 업체의 첫 직원"을 기본으로 둠
    useEffect(() => {
        if (storesLoading) return;
        if (selectedCompanyId !== "") return;
        if (stores.length === 0) return;

        setSelectedCompanyId(stores[0].companyId);
    }, [storesLoading, stores, selectedCompanyId]);

    useEffect(() => {
        if (selectedCompanyId === "") return;
        if (selectedSalaryTargetId !== "") return;
        if (salaryTargets.length === 0) return;

        setSelectedSalaryTargetId(salaryTargets[0].id);
    }, [selectedCompanyId, selectedSalaryTargetId, salaryTargets]);

    useEffect(() => {
        const companyId = typeof selectedCompanyId === "number" ? selectedCompanyId : null;
        const salaryTargetId = typeof selectedSalaryTargetId === "number" ? selectedSalaryTargetId : null;

        if (!companyId || !salaryTargetId) {
            setPayouts([]);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);
        getSalaryPayouts(companyId, salaryTargetId, days)
            .then((res) => {
                setPayouts(res || []);
            })
            .catch((e) => {
                console.error(e);
                setError("결제 내역을 불러오지 못했습니다.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [selectedCompanyId, selectedSalaryTargetId, days]);

    if (storesLoading) {
        return (
            <Container>
                <PageTitle>결제 내역</PageTitle>
                <ContentWrapper>
                    <LoadingText>로딩 중...</LoadingText>
                </ContentWrapper>
            </Container>
        );
    }

    return (
        <Container>
            <PageTitle>결제 내역</PageTitle>
            <ContentWrapper>
                <FilterRow>
                    <FilterSelect value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(Number(e.target.value) || "")}>
                        <option value="">전체 업장</option>
                        {stores.map((s) => (
                            <option key={s.companyId} value={s.companyId}>
                                {s.name}
                            </option>
                        ))}
                    </FilterSelect>

                    <FilterSelect value={selectedSalaryTargetId} onChange={(e) => setSelectedSalaryTargetId(Number(e.target.value) || "")} disabled={selectedCompanyId === ""}>
                        <option value="">전체 직원</option>
                        {salaryTargets.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.workerName}
                            </option>
                        ))}
                    </FilterSelect>

                    <FilterSelect value={days} onChange={(e) => setDays(Number(e.target.value))}>
                        {DAYS_OPTIONS.map((d) => (
                            <option key={d} value={d}>
                                최근 {d}일
                            </option>
                        ))}
                    </FilterSelect>
                </FilterRow>

                {error ? <ErrorText>{error}</ErrorText> : null}

                {loading ? (
                    <LoadingText>결제 내역 불러오는 중...</LoadingText>
                ) : payouts.length === 0 ? (
                    <EmptyState>업장과 직원을 선택하면 결제 내역이 표시됩니다.</EmptyState>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell>업장</TableHeaderCell>
                                <TableHeaderCell>직원</TableHeaderCell>
                                <TableHeaderCell>지급일</TableHeaderCell>
                                <TableHeaderCell>근무 기간</TableHeaderCell>
                                <TableHeaderCell>정산 금액</TableHeaderCell>
                                <TableHeaderCell>공제</TableHeaderCell>
                                <TableHeaderCell>공제타입</TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {payouts.map((p) => (
                                <TableRow key={p.paymentId}>
                                    <TableCell>{selectedCompany?.name || "-"}</TableCell>
                                    <TableCell>{selectedWorker?.workerName || "-"}</TableCell>
                                    <TableCell>{p.paidAt ? format(new Date(p.paidAt), "yyyy.MM.dd") : "-"}</TableCell>
                                    <TableCell>{p.periodFrom && p.periodTo ? `${p.periodFrom} ~ ${p.periodTo}` : "-"}</TableCell>
                                    <TableCell>{typeof p.amount === "number" ? `${p.amount.toLocaleString()}원` : "-"}</TableCell>
                                    <TableCell>{typeof p.deduction === "number" ? `${p.deduction.toLocaleString()}원` : "-"}</TableCell>
                                    <TableCell>{getDeductionTypeLabel(p.deductionDetail?.appliedType)}</TableCell>
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

    ${media.desktop} {
        width: 100%;
    }
`;

const FilterRow = styled.div`
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;

    ${media.mobile} {
        gap: 8px;
        margin-bottom: 14px;
    }
`;

const FilterSelect = styled.select`
    ${mypageContent}
    padding: 10px 16px;
    padding-right: 32px;
    font-weight: 600;
    border: 1.5px solid #00ccc7;
    border-radius: 10px;
    background: #ffffff;
    color: #000;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%2300ccc7%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 10px;
    padding-right: 32px;

    &:focus {
        outline: none;
        border-color: #00ccc7;
        box-shadow: 0 0 0 3px rgba(0, 204, 199, 0.18);
    }

    &:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
    }

    ${media.mobile} {
        padding: 8px 12px;
        padding-right: 28px;
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
    white-space: nowrap;

    ${media.mobile} {
        padding: 12px 8px;
        font-size: 14px;
    }
`;

const TableCell = styled.td`
    ${mypageContent}
    padding: 16px;
    color: #000;
    white-space: nowrap;

    ${media.mobile} {
        padding: 12px 8px;
        font-size: 14px;
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

const EmptyState = styled.div`
    ${mypageContent}
    text-align: center;
    padding: 60px 20px;
    color: #000;

    ${media.mobile} {
        padding: 40px 16px;
    }
`;

const ErrorText = styled.div`
    ${mypageContent}
    color: #d32f2f;
    font-weight: 700;
    margin-bottom: 12px;
`;
