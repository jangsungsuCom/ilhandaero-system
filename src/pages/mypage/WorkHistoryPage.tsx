import { useState, useEffect } from "react";
import styled from "styled-components";
import { getWorkLogs, getWorkAmount } from "../../utils/workLog";
import { getAccessCode, getLoginMethod } from "../../utils/auth";
import { format } from "date-fns";
import type { WorkAmountData } from "../../types/payment";
import { IosWheelPicker, type WheelOption } from "../../components/common/IosWheelPicker";
import { media } from "../../styles/breakpoints";

const YEAR_OPTIONS = (centerYear: number): WheelOption<number>[] => Array.from({ length: 21 }, (_, i) => centerYear - 10 + i).map((y) => ({ value: y, label: `${y}년` }));

const MONTH_OPTIONS: WheelOption<number>[] = Array.from({ length: 12 }, (_, i) => ({ value: i, label: `${i + 1}월` }));

export default function WorkHistoryPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [workLogs, setWorkLogs] = useState<any[]>([]);
    const [workAmount, setWorkAmount] = useState<WorkAmountData | null>(null);
    const [loading, setLoading] = useState(true);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pendingYear, setPendingYear] = useState(new Date().getFullYear());
    const [pendingMonth, setPendingMonth] = useState(new Date().getMonth());

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    useEffect(() => {
        if (pickerOpen) {
            setPendingYear(currentYear);
            setPendingMonth(currentMonth);
        }
    }, [pickerOpen, currentYear, currentMonth]);

    useEffect(() => {
        // accessCode 로그인이 아니면 데이터를 로드하지 않음
        const loginMethod = getLoginMethod();
        if (loginMethod !== "accessCode") {
            setWorkLogs([]);
            setWorkAmount(null);
            setLoading(false);
            return;
        }

        fetchData();
    }, [currentYear, currentMonth]);

    // 로그인 방법이 변경될 때 상태 초기화
    useEffect(() => {
        const loginMethod = getLoginMethod();
        if (loginMethod !== "accessCode") {
            setWorkLogs([]);
            setWorkAmount(null);
        }
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const accessCode = getAccessCode();
            if (!accessCode) return;

            const startDate = new Date(currentYear, currentMonth, 1);
            const endDate = new Date(currentYear, currentMonth + 1, 0);
            const from = format(startDate, "yyyy-MM-dd");
            const to = format(endDate, "yyyy-MM-dd");

            const [workLogsResponse, workAmountResponse] = await Promise.all([getWorkLogs(currentYear, currentMonth, accessCode), getWorkAmount(accessCode, from, to)]);

            setWorkLogs(workLogsResponse.data || []);
            // GET /pud/{accessCode}/work-amount?from=...&to=... → { status, message, data: { grossAmount, totalAdvanced, available, maxAdvance, ... } }
            setWorkAmount(workAmountResponse?.data ?? null);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    /** 시간 문자열을 HH:mm 형태로 (초 제거) */
    const toHHmm = (timeStr: string): string => {
        const part = String(timeStr || "")
            .trim()
            .split(":");
        if (part.length >= 2) return `${part[0].padStart(2, "0")}:${part[1].padStart(2, "0")}`;
        return String(timeStr || "");
    };

    const formatWorkTime = (log: { startTime?: string; endTime?: string; workedMinutes: number }): string => {
        const hours = Math.floor(log.workedMinutes / 60);
        const hoursLabel = `${hours}시간`;
        if (log.startTime && log.endTime) {
            return `${toHHmm(log.startTime)}~${toHHmm(log.endTime)} (${hoursLabel})`;
        }
        return hoursLabel;
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const days = ["일", "월", "화", "수", "목", "금", "토"];
        const dayOfWeek = days[date.getDay()];
        return `${format(date, "yyyy.MM.dd")} (${dayOfWeek})`;
    };

    const handleSelectMonthYear = (year: number, month: number) => {
        setCurrentDate(new Date(year, month, 1));
        setPickerOpen(false);
    };

    if (loading) {
        return (
            <Container>
                <PageTitle>근무내역</PageTitle>
                <ContentWrapper>
                    <LoadingText>로딩 중...</LoadingText>
                </ContentWrapper>
            </Container>
        );
    }

    return (
        <Container>
            <PageTitle>근무내역</PageTitle>
            <ContentWrapper>
                <SummaryCard>
                    <SummaryMainItem>
                        <SummaryMainLabel>총 급여</SummaryMainLabel>
                        <SummaryMainValue>{workAmount?.grossAmount?.toLocaleString() || 0}원</SummaryMainValue>
                    </SummaryMainItem>
                    <SummaryDivider />
                    <SummarySubItem>
                        <SummaryLabel>선지급액</SummaryLabel>
                        <SummaryValue>{workAmount?.totalAdvanced?.toLocaleString() || 0}원</SummaryValue>
                    </SummarySubItem>
                    <SummarySubItem>
                        <SummaryLabel>미결제 임금</SummaryLabel>
                        <SummaryValue>{workAmount?.available?.toLocaleString() || 0}원</SummaryValue>
                    </SummarySubItem>
                    <SummarySubItem>
                        <SummaryLabel>최대 선지급 가능액</SummaryLabel>
                        <SummaryValue>{workAmount?.maxAdvance?.toLocaleString() || 0}원</SummaryValue>
                    </SummarySubItem>
                </SummaryCard>

                <MonthSelector>
                    <MonthPickerButton onClick={() => setPickerOpen(!pickerOpen)}>
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

                {workLogs.length === 0 ? (
                    <EmptyState>해당 기간의 근무 기록이 없습니다.</EmptyState>
                ) : (
                    <WorkLogSection>
                        <WorkLogTable>
                            <TableHeader>
                                <TableRow>
                                    <TableHeaderCell>날짜</TableHeaderCell>
                                    <TableHeaderCell>근무시간</TableHeaderCell>
                                    <TableHeaderCell>급여</TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                            <tbody>
                                {[...workLogs].reverse().map((log) => (
                                    <TableRow key={log.workLogId}>
                                        <TableCell>{formatDate(log.workDate)}</TableCell>
                                        <TableCell>{formatWorkTime(log)}</TableCell>
                                        <TableCell>{log.earnedAmount?.toLocaleString() || 0}원</TableCell>
                                    </TableRow>
                                ))}
                            </tbody>
                        </WorkLogTable>
                    </WorkLogSection>
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

    ${media.tablet} {
        font-size: 24px;
        margin-bottom: 20px;
    }

    ${media.mobile} {
        font-size: 20px;
        margin-bottom: 16px;
    }
`;

const ContentWrapper = styled.div`
    width: 922px;
    max-width: 100%;

    ${media.desktop} {
        width: 100%;
    }
`;

const SummaryCard = styled.div`
    background: white;
    border-radius: 12px;
    padding: 24px 30px;
    margin-bottom: 30px;
    border: 1.5px solid #00ccc7;
    display: flex;
    flex-direction: column;

    ${media.tablet} {
        padding: 20px;
        margin-bottom: 20px;
    }

    ${media.mobile} {
        padding: 16px;
        margin-bottom: 16px;
        border-radius: 8px;
    }
`;

const SummaryMainItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
`;

const SummaryMainLabel = styled.div`
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;

    ${media.tablet} {
        font-size: 18px;
    }

    ${media.mobile} {
        font-size: 16px;
    }
`;

const SummaryMainValue = styled.div`
    font-size: 24px;
    font-weight: 700;
    color: #00a8a5;

    ${media.tablet} {
        font-size: 22px;
    }

    ${media.mobile} {
        font-size: 20px;
    }
`;

const SummaryDivider = styled.div`
    height: 1px;
    background: #e0e0e0;
    margin: 12px 0;
`;

const SummarySubItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
`;

const SummaryLabel = styled.div`
    font-size: 14px;
    color: #666;
    font-weight: 500;

    ${media.mobile} {
        font-size: 13px;
    }
`;

const SummaryValue = styled.div`
    font-size: 16px;
    font-weight: 600;
    color: #2c3e50;

    ${media.mobile} {
        font-size: 15px;
    }
`;

const MonthSelector = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
`;

const MonthPickerButton = styled.button`
    padding: 12px 24px;
    background: #11d0c9;
    border: none;
    border-radius: 24px;
    color: #ffffff;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.9;
    }

    ${media.tablet} {
        padding: 10px 20px;
        font-size: 16px;
    }

    ${media.mobile} {
        padding: 8px 16px;
        font-size: 14px;
    }
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
    width: 80px;
    height: 32px;
    font-size: 18px;
    font-weight: 600;
    color: #fff;
    background: #11d0c9;
    border: none;
    border-radius: 24px;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
        opacity: 0.85;
    }

    ${media.mobile} {
        font-size: 16px;
        min-width: 90px;
    }
`;

const WorkLogSection = styled.div`
    width: 100%;
    overflow-x: auto;
`;

const WorkLogTable = styled.table`
    width: 100%;
    min-width: 400px;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    border-collapse: collapse;
    border: 1.5px solid #00ccc7;

    ${media.mobile} {
        min-width: 320px;
        border-radius: 8px;
    }
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

    ${media.tablet} {
        padding: 12px;
        font-size: 13px;
    }

    ${media.mobile} {
        padding: 10px 8px;
        font-size: 12px;
    }
`;

const TableCell = styled.td`
    padding: 16px;
    color: #555;
    font-size: 14px;

    ${media.tablet} {
        padding: 12px;
        font-size: 13px;
    }

    ${media.mobile} {
        padding: 10px 8px;
        font-size: 12px;
    }
`;

const EmptyState = styled.div`
    text-align: center;
    padding: 60px 20px;
    color: #95a5a6;
    font-size: 16px;

    ${media.mobile} {
        padding: 40px 16px;
        font-size: 14px;
    }
`;

const LoadingText = styled.div`
    text-align: center;
    padding: 60px 20px;
    color: #95a5a6;
    font-size: 16px;

    ${media.mobile} {
        padding: 40px 16px;
        font-size: 14px;
    }
`;
