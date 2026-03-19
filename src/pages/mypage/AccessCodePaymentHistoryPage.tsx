import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import styled from "styled-components";
import { IosWheelPicker, type WheelOption } from "../../components/common/IosWheelPicker";
import { getAccessCode } from "../../utils/auth";
import { getAccessCodePayments, type AccessCodePayment } from "../../utils/paymentApi";
import { media } from "../../styles/breakpoints";
import { mypageTitle, mypageContent } from "../../styles/mypageTypography";

const YEAR_OPTIONS = (centerYear: number): WheelOption<number>[] => Array.from({ length: 21 }, (_, i) => centerYear - 10 + i).map((y) => ({ value: y, label: `${y}년` }));
const MONTH_OPTIONS: WheelOption<number>[] = Array.from({ length: 12 }, (_, i) => ({ value: i, label: `${i + 1}월` }));

interface PaymentRow {
    salary: AccessCodePayment;
    totalAdvance: number;
}

export default function AccessCodePaymentHistoryPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pendingYear, setPendingYear] = useState(new Date().getFullYear());
    const [pendingMonth, setPendingMonth] = useState(new Date().getMonth());

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [payments, setPayments] = useState<AccessCodePayment[]>([]);

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    useEffect(() => {
        if (pickerOpen) {
            setPendingYear(currentYear);
            setPendingMonth(currentMonth);
        }
    }, [pickerOpen, currentYear, currentMonth]);

    useEffect(() => {
        const accessCode = getAccessCode();
        if (!accessCode) {
            setError("접근 코드가 없습니다.");
            setLoading(false);
            return;
        }

        const startDate = new Date(currentYear, currentMonth, 1);
        const endDate = new Date(currentYear, currentMonth + 1, 0);
        const from = format(startDate, "yyyy-MM-dd");
        const to = format(endDate, "yyyy-MM-dd");

        setLoading(true);
        setError(null);
        getAccessCodePayments(accessCode, from, to)
            .then((res) => setPayments(res || []))
            .catch((e) => {
                console.error(e);
                setError("지급 내역을 불러오지 못했습니다.");
                setPayments([]);
            })
            .finally(() => setLoading(false));
    }, [currentYear, currentMonth]);

    const rows = useMemo((): PaymentRow[] => {
        if (payments.length === 0) return [];

        const sorted = [...payments].sort((a, b) => a.paymentId - b.paymentId);
        const salaries = sorted.filter((p) => p.type === "SALARY");
        const advances = sorted.filter((p) => p.type === "ADVANCE");
        const advanceMap = new Map<number, AccessCodePayment[]>();

        for (const adv of advances) {
            const parent = salaries.find((s) => s.paymentId > adv.paymentId);
            if (parent) {
                const list = advanceMap.get(parent.paymentId) || [];
                list.push(adv);
                advanceMap.set(parent.paymentId, list);
            }
        }

        return salaries
            .map((salary) => {
                const childAdvances = advanceMap.get(salary.paymentId) || [];
                return {
                    salary,
                    totalAdvance: childAdvances.reduce((sum, a) => sum + (a.amount || 0), 0),
                };
            })
            .sort((a, b) => {
                const aTime = a.salary.paidAt ? new Date(a.salary.paidAt).getTime() : 0;
                const bTime = b.salary.paidAt ? new Date(b.salary.paidAt).getTime() : 0;
                if (aTime !== bTime) return bTime - aTime;
                return b.salary.paymentId - a.salary.paymentId;
            });
    }, [payments]);

    const handleSelectMonthYear = (year: number, month: number) => {
        setCurrentDate(new Date(year, month, 1));
        setPickerOpen(false);
    };

    return (
        <Container>
            <PageTitle>지급내역</PageTitle>
            <ContentWrapper>
                <MonthSelector>
                    <MonthPickerButton onClick={() => setPickerOpen((v) => !v)}>
                        {currentYear}년 {currentMonth + 1}월 ˅
                    </MonthPickerButton>
                </MonthSelector>

                {pickerOpen && (
                    <PickerBox>
                        <WheelPickerRow>
                            <IosWheelPicker options={YEAR_OPTIONS(currentYear)} value={pendingYear} onChange={(y: number) => setPendingYear(y)} centerInputMode centerInputSuffix="년" />
                            <IosWheelPicker options={MONTH_OPTIONS} value={pendingMonth} onChange={(m: number) => setPendingMonth(m)} centerInputMode centerInputSuffix="월" />
                        </WheelPickerRow>
                        <PickerConfirmRow>
                            <PickerConfirmButton type="button" onClick={() => handleSelectMonthYear(pendingYear, pendingMonth)}>
                                적용
                            </PickerConfirmButton>
                        </PickerConfirmRow>
                    </PickerBox>
                )}

                {error ? <ErrorText>{error}</ErrorText> : null}

                {loading ? (
                    <LoadingText>로딩 중...</LoadingText>
                ) : rows.length === 0 ? (
                    <EmptyState>해당 월의 지급 내역이 없습니다.</EmptyState>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHeaderCell>지급일</TableHeaderCell>
                                <TableHeaderCell>근무기간</TableHeaderCell>
                                <TableHeaderCell>결제금액</TableHeaderCell>
                                <TableHeaderCell>선정산금액</TableHeaderCell>
                                <TableHeaderCell>명세서</TableHeaderCell>
                            </TableRow>
                        </TableHeader>
                        <tbody>
                            {rows.map((row) => (
                                <TableRow key={row.salary.paymentId}>
                                    <TableCell>{row.salary.paidAt ? format(new Date(row.salary.paidAt), "yyyy.MM.dd") : "-"}</TableCell>
                                    <TableCell>{row.salary.periodFrom && row.salary.periodTo ? `${row.salary.periodFrom} ~ ${row.salary.periodTo}` : "-"}</TableCell>
                                    <TableCell>{`${(row.salary.amount ?? 0).toLocaleString()}원`}</TableCell>
                                    <TableCell>{row.totalAdvance > 0 ? `${row.totalAdvance.toLocaleString()}원` : "-"}</TableCell>
                                    <TableCell>
                                        <DetailButton
                                            type="button"
                                            onClick={() => {
                                                const params = new URLSearchParams({
                                                    mode: "accessCode",
                                                    paymentId: String(row.salary.paymentId),
                                                    advanceAmount: String(row.totalAdvance),
                                                });
                                                window.open(`/payslip?${params.toString()}`, "_blank", "width=460,height=640,scrollbars=yes,resizable=yes");
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
`;

const ContentWrapper = styled.div`
    width: 922px;
    max-width: 100%;

    ${media.desktop} {
        width: 100%;
    }
`;

const MonthSelector = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
`;

const MonthPickerButton = styled.button`
    ${mypageContent}
    padding: 12px 24px;
    background: #00ccc7;
    border: none;
    border-radius: 24px;
    color: #ffffff;
    font-weight: 700;
    cursor: pointer;
`;

const PickerBox = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
    gap: 20px;
`;

const WheelPickerRow = styled.div`
    display: flex;
    gap: 40px;
    align-items: flex-start;
`;

const PickerConfirmRow = styled.div`
    margin-left: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const PickerConfirmButton = styled.button`
    ${mypageContent}
    width: 80px;
    height: 32px;
    font-weight: 600;
    color: #fff;
    background: #00ccc7;
    border: none;
    border-radius: 24px;
    cursor: pointer;
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

const DetailButton = styled.button`
    ${mypageContent}
    padding: 6px 14px;
    border: none;
    border-radius: 8px;
    background: #00ccc7;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
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

const ErrorText = styled.div`
    ${mypageContent}
    color: #d32f2f;
    font-weight: 700;
    margin-bottom: 12px;
`;
