import { useState, useEffect } from "react";
import styled from "styled-components";
import { getWorkLogs, getWorkAmount } from "../../utils/workLog";
import { getAccessCode, getLoginMethod } from "../../utils/auth";
import { format } from "date-fns";

export default function WorkHistoryPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [workLogs, setWorkLogs] = useState<any[]>([]);
    const [workAmount, setWorkAmount] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

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

            const [workLogsResponse, workAmountResponse] = await Promise.all([
                getWorkLogs(currentYear, currentMonth, accessCode),
                getWorkAmount(accessCode),
            ]);

            setWorkLogs(workLogsResponse.data || []);
            setWorkAmount(workAmountResponse.data || null);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatWorkTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (mins === 0) {
            return `${hours}시간`;
        }
        return `${hours}시간 ${mins}분`;
    };

    const formatDate = (dateString: string): string => {
        return format(new Date(dateString), "yyyy.MM.dd");
    };

    const handleMonthChange = (direction: "prev" | "next") => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev);
            if (direction === "prev") {
                newDate.setMonth(prev.getMonth() - 1);
            } else {
                newDate.setMonth(prev.getMonth() + 1);
            }
            return newDate;
        });
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
                    <SummaryTitle>급여 정보</SummaryTitle>
                    <SummaryGrid>
                        <SummaryItem>
                            <SummaryLabel>누적 임금</SummaryLabel>
                            <SummaryValue>{workAmount?.totalEarnedAmount?.toLocaleString() || 0}원</SummaryValue>
                        </SummaryItem>
                        <SummaryItem>
                            <SummaryLabel>선지급액</SummaryLabel>
                            <SummaryValue>{workAmount?.totalAdvancedAmount?.toLocaleString() || 0}원</SummaryValue>
                        </SummaryItem>
                        <SummaryItem>
                            <SummaryLabel>가용 임금</SummaryLabel>
                            <SummaryValue>{workAmount?.availableAmount?.toLocaleString() || 0}원</SummaryValue>
                        </SummaryItem>
                        <SummaryItem>
                            <SummaryLabel>최대 선지급 가능액</SummaryLabel>
                            <SummaryValue>{workAmount?.maxAdvanceAmount?.toLocaleString() || 0}원</SummaryValue>
                        </SummaryItem>
                    </SummaryGrid>
                </SummaryCard>

                <MonthSelector>
                    <MonthButton onClick={() => handleMonthChange("prev")}>‹</MonthButton>
                    <MonthText>
                        {currentYear}년 {currentMonth + 1}월
                    </MonthText>
                    <MonthButton onClick={() => handleMonthChange("next")}>›</MonthButton>
                </MonthSelector>

                {workLogs.length === 0 ? (
                    <EmptyState>해당 기간의 근무 기록이 없습니다.</EmptyState>
                ) : (
                    <WorkLogSection>
                        <WorkLogTitle>근무내역</WorkLogTitle>
                        <WorkLogTable>
                            <TableHeader>
                                <TableRow>
                                    <TableHeaderCell>날짜</TableHeaderCell>
                                    <TableHeaderCell>근무시간</TableHeaderCell>
                                    <TableHeaderCell>수령액</TableHeaderCell>
                                </TableRow>
                            </TableHeader>
                        <tbody>
                            {workLogs.map((log) => (
                                <TableRow key={log.workLogId}>
                                    <TableCell>{formatDate(log.workDate)}</TableCell>
                                    <TableCell>{formatWorkTime(log.workedMinutes)}</TableCell>
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
`;

const ContentWrapper = styled.div`
    width: 922px; /* 1152px * 0.8 = 921.6px */
    max-width: 100%;
`;

const SummaryCard = styled.div`
    background: white;
    border-radius: 12px;
    padding: 30px;
    margin-bottom: 30px;
    border: 1.5px solid #00ccc7;
`;

const SummaryTitle = styled.h2`
    font-size: 24px;
    font-weight: 700;
    color: #00a8a5;
    margin: 0 0 20px 0;
`;

const SummaryGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
`;

const SummaryItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const SummaryLabel = styled.div`
    font-size: 14px;
    color: #666;
    font-weight: 500;
`;

const SummaryValue = styled.div`
    font-size: 20px;
    font-weight: 700;
    color: #2c3e50;
`;

const MonthSelector = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 30px;
`;

const MonthButton = styled.button`
    width: 40px;
    height: 40px;
    border: 1.5px solid #00ccc7;
    border-radius: 8px;
    background: white;
    color: #00a8a5;
    font-size: 24px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: #f0f9f8;
    }
`;

const MonthText = styled.div`
    font-size: 20px;
    font-weight: 600;
    color: #2c3e50;
    min-width: 120px;
    text-align: center;
`;

const WorkLogSection = styled.div`
    width: 100%;
`;

const WorkLogTitle = styled.h2`
    font-size: 24px;
    font-weight: 700;
    color: #00a8a5;
    margin: 0 0 20px 0;
`;

const WorkLogTable = styled.table`
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
