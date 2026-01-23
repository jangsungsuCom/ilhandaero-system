// src/components/Calendar.tsx
import React, { useState, type JSX } from "react";
import styled from "styled-components";
import AddModal from "./AddModal";
import EditModal from "./EditModal";
import AddBtnImg from "../../../assets/images/workLog/add_log.png";
import type { WorkLog } from "../../../types/workLog";
import type { SalaryTarget } from "../../../types/salaryTarget";
import { format } from "date-fns";
import type { LoginMethod } from "../../../types/auth";

interface CalendarProps {
    workLogsByAccessCode?: Record<string, WorkLog[]>;
    salaryTargets?: SalaryTarget[];
    currentYear: number;
    currentMonth: number;
    onMonthChange: (year: number, month: number) => void;
    onWorkLogCreated?: () => void;
    loginMethod?: LoginMethod;
    accessCode?: string;
}

const Calendar: React.FC<CalendarProps> = ({ workLogsByAccessCode = {}, salaryTargets = [], currentYear, currentMonth, onMonthChange, onWorkLogCreated, loginMethod, accessCode }) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | null>(null);
    const [editingSalaryTarget, setEditingSalaryTarget] = useState<SalaryTarget | undefined>(undefined);

    const daysOfWeek = ["일", "월", "화", "수", "목", "금", "토"];
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

    const handleSelectMonthYear = (year: number, month: number) => {
        onMonthChange(year, month);
        setPickerOpen(false);
        setSelectedDate(null);
    };

    const getWorkLogsForDate = (date: Date): Array<{ workLog: WorkLog; salaryTarget?: SalaryTarget }> => {
        const dateStr = format(date, "yyyy-MM-dd");
        const result: Array<{ workLog: WorkLog; salaryTarget?: SalaryTarget }> = [];

        // 이메일 로그인인 경우: salaryTargets와 workLogsByAccessCode 매칭
        if (loginMethod === "email") {
            salaryTargets.forEach((target) => {
                const workLogs = workLogsByAccessCode[target.accessCode] || [];
                const workLog = workLogs.find((log) => log.workDate === dateStr);
                if (workLog) {
                    result.push({ workLog, salaryTarget: target });
                }
            });
        }
        // accessCode 로그인인 경우: 해당 accessCode의 workLogs만 표시
        else if (loginMethod === "accessCode" && accessCode) {
            const workLogs = workLogsByAccessCode[accessCode] || [];
            const workLog = workLogs.find((log) => log.workDate === dateStr);
            if (workLog) {
                result.push({ workLog });
            }
        }

        return result;
    };

    const formatWorkTime = (minutes: number): string => {
        const totalHours = minutes / 60;
        // 소수점 첫째 자리까지 표시 (0.5 단위)
        const formattedHours = Math.round(totalHours * 2) / 2;
        return `${formattedHours}h`;
    };

    const generateCalendar = () => {
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const daysInPrev = getDaysInMonth(currentYear, currentMonth - 1);
        const cells: JSX.Element[] = [];

        for (let i = firstDay - 1; i >= 0; i--) {
            const d = daysInPrev - i;
            cells.push(
                <DayCell key={`prev-${d}`} className="other-month">
                    <DateNumber>{d}</DateNumber>
                </DayCell>
            );
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth && selectedDate.getFullYear() === currentYear;
            const workLogsForDate = getWorkLogsForDate(date);

            cells.push(
                <DayCell key={`curr-${day}`} className={isSelected ? "selected" : ""} onClick={() => setSelectedDate(date)}>
                    {isSelected && (
                        <AddButton onClick={() => setIsAddModalOpen(true)}>
                            <img src={AddBtnImg} alt="add" />
                        </AddButton>
                    )}
                    <DateNumber>{day}</DateNumber>
                    {workLogsForDate.map(({ workLog, salaryTarget }) => (
                        <WorkTimeBadge
                            key={workLog.workLogId}
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingWorkLog(workLog);
                                setEditingSalaryTarget(salaryTarget);
                                setIsEditModalOpen(true);
                            }}
                        >
                            {loginMethod === "email" && salaryTarget
                                ? `${salaryTarget.workerName}, ${formatWorkTime(workLog.workedMinutes)}`
                                : formatWorkTime(workLog.workedMinutes)}
                        </WorkTimeBadge>
                    ))}
                </DayCell>
            );
        }

        const total = cells.length;
        const remain = total <= 35 ? 35 - total : 42 - total;

        for (let d = 1; d <= remain; d++) {
            cells.push(
                <DayCell key={`next-${d}`} className="other-month">
                    <DateNumber>{d}</DateNumber>
                </DayCell>
            );
        }
        return cells;
    };

    return (
        <>
            <Container>
                <TopBar>
                    <PickerButton onClick={() => setPickerOpen(!pickerOpen)}>
                        {currentYear}년 {currentMonth + 1}월 ▼
                    </PickerButton>
                </TopBar>

                {pickerOpen && (
                    <PickerBox>
                        <YearSection>
                            {Array.from({ length: 21 }, (_, i) => currentYear - 10 + i).map((y) => (
                                <YearItem key={y} className={y === currentYear ? "active" : ""} onClick={() => handleSelectMonthYear(y, currentMonth)}>
                                    {y}년
                                </YearItem>
                            ))}
                        </YearSection>

                        <MonthSection>
                            {Array.from({ length: 12 }, (_, i) => i).map((m) => (
                                <MonthItem key={m} className={m === currentMonth ? "active" : ""} onClick={() => handleSelectMonthYear(currentYear, m)}>
                                    {m + 1}월
                                </MonthItem>
                            ))}
                        </MonthSection>
                    </PickerBox>
                )}

                <WeekDays>
                    {daysOfWeek.map((d) => (
                        <DayHeader key={d}>{d}</DayHeader>
                    ))}
                </WeekDays>

                <Grid>{generateCalendar()}</Grid>
            </Container>
            {isAddModalOpen && selectedDate && (
                <AddModal
                    isModalOpen={isAddModalOpen}
                    setIsModalOpen={setIsAddModalOpen}
                    selectedDate={selectedDate}
                    onWorkLogCreated={() => {
                        setIsAddModalOpen(false);
                        setSelectedDate(null);
                        onWorkLogCreated?.();
                    }}
                    salaryTargets={loginMethod === "email" ? salaryTargets : undefined}
                />
            )}
            {isEditModalOpen && editingWorkLog && (
                <EditModal
                    isModalOpen={isEditModalOpen}
                    setIsModalOpen={setIsEditModalOpen}
                    editingWorkLog={editingWorkLog}
                    salaryTarget={editingSalaryTarget}
                    onWorkLogUpdated={() => {
                        setIsEditModalOpen(false);
                        setEditingWorkLog(null);
                        setEditingSalaryTarget(undefined);
                        onWorkLogCreated?.();
                    }}
                />
            )}
        </>
    );
};

// --- Styled ------------------------------------

const Container = styled.div`
    width: 100%;
    max-width: 1152px;
    margin: 0 auto;
    padding: 8px;
`;

const TopBar = styled.div`
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
`;

const PickerButton = styled.div`
    width: 301px;
    height: 88px;
    background: #11d0c9;
    border-radius: 44px;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 600;
    cursor: pointer;
`;

const PickerBox = styled.div`
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 16px;
`;

const YearSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 300px;
    overflow-y: auto;
`;

const MonthSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const YearItem = styled.div`
    padding: 6px 14px;
    cursor: pointer;
    border-radius: 6px;
    &.active {
        background: #11d0c9;
        color: white;
        font-weight: 600;
    }
`;

const MonthItem = styled.div`
    padding: 6px 14px;
    cursor: pointer;
    border-radius: 6px;
    &.active {
        background: #11d0c9;
        color: white;
        font-weight: 600;
    }
`;

const WeekDays = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    border-bottom: 1px solid #bbb;
    font-weight: 700;
`;

const DayHeader = styled.div`
    padding: 10px 0;
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px 0;
    background: #e1e1e1;
`;

const DayCell = styled.div`
    min-height: 177px;
    background: white;
    padding: 6px;
    position: relative;
    cursor: pointer;

    &.other-month {
        color: #aaa;
        background: #fafafa;
    }

    &.selected {
        background: #e5f4ff;
    }
`;

const DateNumber = styled.div`
    font-size: 20px;
    font-weight: 700;
`;

const AddButton = styled.button`
    position: absolute;
    width: 166px;
    top: -80px;
    transform: translateX(-30%);
    background: none;
    border: none;
    cursor: pointer;
`;

const WorkTimeBadge = styled.div`
    width: 164px;
    height: 36px;
    border-radius: 18px;
    background-color: #ffc8c8;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    margin-top: 8px;
    color: #333;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;

    &:hover {
        background-color: #ffb0b0;
        transform: scale(1.05);
    }
`;

export default Calendar;
