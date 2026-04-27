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
import CustomSelect from "../../components/common/CustomSelect";

const DAYS_OPTIONS = [30, 90, 365];

interface SalaryRow {
    salary: SalaryPayout;
    advances: SalaryPayout[];
    totalAdvance: number;
    companyId: number;
    companyName: string;
    salaryTargetId: number;
    workerName: string;
}

export default function PaymentLogPage() {
    const dispatch = useAppDispatch();
    const { stores, loading: storesLoading } = useMypageStores();

    const { salaryTargetsByCompany } = useAppSelector((state: RootState) => state.salaryTarget);

    const [selectedCompanyId, setSelectedCompanyId] = useState<number | "">("");
    const [selectedSalaryTargetId, setSelectedSalaryTargetId] = useState<number | "">("");
    const [days, setDays] = useState<number>(365);

    const [loading, setLoading] = useState(false);
    const [salaryRows, setSalaryRows] = useState<SalaryRow[]>([]);
    const [error, setError] = useState<string | null>(null);

    const salaryTargets = useMemo(() => {
        if (selectedCompanyId === "") {
            return stores.flatMap((s) => salaryTargetsByCompany[s.companyId] || []);
        }
        return salaryTargetsByCompany[selectedCompanyId] || [];
    }, [salaryTargetsByCompany, selectedCompanyId, stores]);

    useEffect(() => {
        setSelectedSalaryTargetId("");
        setSalaryRows([]);
        if (selectedCompanyId !== "") {
            dispatch(fetchSalaryTargets(selectedCompanyId));
        }
    }, [selectedCompanyId, dispatch]);

    // 전체 업장 선택 시에도 직원 목록 구성을 위해 salaryTargets를 미리 로드
    useEffect(() => {
        if (storesLoading) return;
        if (selectedCompanyId !== "") return;
        stores.forEach((s) => {
            if (!salaryTargetsByCompany[s.companyId]) {
                dispatch(fetchSalaryTargets(s.companyId));
            }
        });
    }, [storesLoading, selectedCompanyId, stores, salaryTargetsByCompany, dispatch]);

    useEffect(() => {
        const companyCandidates = selectedCompanyId === "" ? stores : stores.filter((s) => s.companyId === selectedCompanyId);
        const requestTargets = companyCandidates.flatMap((company) => {
            const targets = salaryTargetsByCompany[company.companyId] || [];
            return targets
                .filter((t) => selectedSalaryTargetId === "" || t.id === selectedSalaryTargetId)
                .map((t) => ({
                    companyId: company.companyId,
                    companyName: company.name,
                    salaryTargetId: t.id,
                    workerName: t.workerName,
                }));
        });

        if (requestTargets.length === 0) {
            setSalaryRows([]);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        Promise.all(
            requestTargets.map((target) =>
                getSalaryPayouts(target.companyId, target.salaryTargetId, days).then((res) => ({
                    target,
                    payouts: res || [],
                }))
            )
        )
            .then((results) => {
                const mergedRows: SalaryRow[] = [];

                results.forEach(({ target, payouts }) => {
                    const sorted = [...payouts].sort((a, b) => a.paymentId - b.paymentId);
                    const salaries = sorted.filter((p) => p.type === "SALARY");
                    const advances = sorted.filter((p) => p.type === "ADVANCE");

                    const advanceMap = new Map<number, SalaryPayout[]>();
                    for (const adv of advances) {
                        const parent = salaries.find((s) => s.paymentId > adv.paymentId);
                        if (parent) {
                            const list = advanceMap.get(parent.paymentId) || [];
                            list.push(adv);
                            advanceMap.set(parent.paymentId, list);
                        }
                    }

                    salaries.forEach((salary) => {
                        const childAdvances = advanceMap.get(salary.paymentId) || [];
                        mergedRows.push({
                            salary,
                            advances: childAdvances,
                            totalAdvance: childAdvances.reduce((sum, a) => sum + (a.amount || 0), 0),
                            companyId: target.companyId,
                            companyName: target.companyName,
                            salaryTargetId: target.salaryTargetId,
                            workerName: target.workerName,
                        });
                    });
                });

                mergedRows.sort((a, b) => {
                    const aTime = a.salary.paidAt ? new Date(a.salary.paidAt).getTime() : 0;
                    const bTime = b.salary.paidAt ? new Date(b.salary.paidAt).getTime() : 0;
                    if (aTime !== bTime) return bTime - aTime;
                    return b.salary.paymentId - a.salary.paymentId;
                });
                setSalaryRows(mergedRows);
            })
            .catch((e) => {
                console.error(e);
                setError("결제 내역을 불러오지 못했습니다.");
                setSalaryRows([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [selectedCompanyId, selectedSalaryTargetId, days, stores, salaryTargetsByCompany]);

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
                    <FilterSelect
                        value={selectedCompanyId}
                        options={[{ value: "", label: "전체 업장" }, ...stores.map((store) => ({ value: store.companyId, label: store.name }))]}
                        onChange={(value) => setSelectedCompanyId(Number(value) || "")}
                    />

                    <FilterSelect
                        value={selectedSalaryTargetId}
                        options={[{ value: "", label: "전체 직원" }, ...salaryTargets.map((target) => ({ value: target.id, label: target.workerName }))]}
                        onChange={(value) => setSelectedSalaryTargetId(Number(value) || "")}
                    />

                    <FilterSelect
                        value={days}
                        options={DAYS_OPTIONS.map((option) => ({ value: option, label: `최근 ${option}일` }))}
                        onChange={(value) => setDays(Number(value))}
                    />
                </FilterRow>

                {error ? <ErrorText>{error}</ErrorText> : null}

                {loading ? (
                    <LoadingText>결제 내역 불러오는 중...</LoadingText>
                ) : salaryRows.length === 0 ? (
                    <EmptyState>조회된 결제 내역이 없습니다.</EmptyState>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell>업장</TableHeaderCell>
                                <TableHeaderCell>직원</TableHeaderCell>
                                <TableHeaderCell>지급일</TableHeaderCell>
                                <TableHeaderCell>근무기간</TableHeaderCell>
                                <TableHeaderCell>결제금액</TableHeaderCell>
                                <TableHeaderCell>선정산금액</TableHeaderCell>
                                <TableHeaderCell>명세서</TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {salaryRows.map((row) => (
                                <TableRow key={`${row.companyId}-${row.salaryTargetId}-${row.salary.paymentId}`}>
                                    <TableCell>{row.companyName || "-"}</TableCell>
                                    <TableCell>{row.workerName || "-"}</TableCell>
                                    <TableCell>{row.salary.paidAt ? format(new Date(row.salary.paidAt), "yyyy.MM.dd") : "-"}</TableCell>
                                    <TableCell>
                                        {row.salary.periodFrom && row.salary.periodTo
                                            ? `${row.salary.periodFrom} ~ ${row.salary.periodTo}`
                                            : "-"}
                                    </TableCell>
                                    <TableCell>{`${(row.salary.amount ?? 0).toLocaleString()}원`}</TableCell>
                                    <TableCell>{row.totalAdvance > 0 ? `${row.totalAdvance.toLocaleString()}원` : "-"}</TableCell>
                                    <TableCell>
                                        <DetailButton
                                            type="button"
                                            onClick={() => {
                                                const target = (salaryTargetsByCompany[row.companyId] || []).find((t) => t.id === row.salaryTargetId);
                                                const params = new URLSearchParams({
                                                    companyId: String(row.companyId),
                                                    companyName: row.companyName || "",
                                                    salaryTargetId: String(row.salaryTargetId),
                                                    paymentId: String(row.salary.paymentId),
                                                    advanceAmount: String(row.totalAdvance),
                                                    accessCode: target?.accessCode || "",
                                                });
                                                window.open(
                                                    `/payslip?${params.toString()}`,
                                                    "_blank",
                                                    "width=460,height=640,scrollbars=yes,resizable=yes"
                                                );
                                            }}
                                        >
                                            명세서 보기
                                        </DetailButton>
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

    .custom-select-button:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
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

const DetailButton = styled.button`
    ${mypageContent}
    padding: 6px 14px;
    border: none;
    border-radius: 8px;
    background: #00ccc7;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: opacity 0.2s ease;

    &:hover {
        opacity: 0.85;
    }

    ${media.mobile} {
        padding: 4px 10px;
    }
`;

