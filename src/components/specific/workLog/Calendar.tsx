// src/components/Calendar.tsx
import React, { useState, type JSX } from "react";
import styled from "styled-components";
import AddModal from "./AddModal";
import EditModal from "./EditModal";
import SummaryModal, { type SummaryRow } from "./SummaryModal";
import AddBtnImg from "../../../assets/images/workLog/add_log.png";
import type { WorkLog } from "../../../types/workLog";
import type { SalaryTarget } from "../../../types/salaryTarget";
import { format } from "date-fns";
import type { LoginMethod } from "../../../types/auth";

export interface CompanyOption {
    companyId: number;
    name: string;
}

interface CalendarProps {
    workLogsByAccessCode?: Record<string, WorkLog[]>;
    salaryTargets?: SalaryTarget[];
    currentYear: number;
    currentMonth: number;
    onMonthChange: (year: number, month: number) => void;
    onWorkLogCreated?: () => void;
    loginMethod?: LoginMethod;
    accessCode?: string;
    /** 이메일 로그인 시 업장 선택용 (TopBar에 표시) */
    companies?: CompanyOption[];
    selectedCompanyId?: number | null;
    onCompanyChange?: (companyId: number | null) => void;
    /** 페이지 제목 (WorkLogPage에서 계산해 전달) */
    pageTitle?: string;
}

const Calendar: React.FC<CalendarProps> = ({
    workLogsByAccessCode = {},
    salaryTargets = [],
    currentYear,
    currentMonth,
    onMonthChange,
    onWorkLogCreated,
    loginMethod,
    accessCode,
    companies = [],
    selectedCompanyId = null,
    onCompanyChange,
    pageTitle,
}) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | null>(null);
    const [editingSalaryTarget, setEditingSalaryTarget] = useState<SalaryTarget | undefined>(undefined);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

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

    const getMonthlyTotalAmount = (): number => {
        const yearStr = String(currentYear);
        const monthStr = String(currentMonth + 1).padStart(2, "0");
        const prefix = `${yearStr}-${monthStr}`;

        let total = 0;

        if (loginMethod === "email") {
            Object.values(workLogsByAccessCode).forEach((logs) => {
                logs.forEach((log) => {
                    if (log.workDate.startsWith(prefix)) {
                        total += log.earnedAmount;
                    }
                });
            });
        } else if (loginMethod === "accessCode" && accessCode) {
            const logs = workLogsByAccessCode[accessCode] || [];
            logs.forEach((log) => {
                if (log.workDate.startsWith(prefix)) {
                    total += log.earnedAmount;
                }
            });
        }

        return total;
    };

    /** 근무자별 해당 월 임금 집계 (SummaryModal용) */
    const getSummaryRows = (): SummaryRow[] => {
        const yearStr = String(currentYear);
        const monthStr = String(currentMonth + 1).padStart(2, "0");
        const prefix = `${yearStr}-${monthStr}`;

        if (loginMethod === "email") {
            return salaryTargets.map((target) => {
                const logs = workLogsByAccessCode[target.accessCode] || [];
                const totalAmount = logs
                    .filter((log) => log.workDate.startsWith(prefix))
                    .reduce((sum, log) => sum + log.earnedAmount, 0);
                return { workerName: target.workerName, totalAmount };
            });
        }
        if (loginMethod === "accessCode" && accessCode) {
            const logs = workLogsByAccessCode[accessCode] || [];
            const totalAmount = logs
                .filter((log) => log.workDate.startsWith(prefix))
                .reduce((sum, log) => sum + log.earnedAmount, 0);
            const workerName = pageTitle != null && pageTitle !== "" ? pageTitle.replace(/님의 근무 기록$/, "").trim() || "근무자" : "근무자";
            return [{ workerName, totalAmount }];
        }
        return [];
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
            const prevDate = new Date(currentYear, currentMonth - 1, d);
            const prevDayOfWeek = prevDate.getDay();
            cells.push(
                <DayCell key={`prev-${d}`} className="other-month">
                    <DateNumber dayOfWeek={prevDayOfWeek}>{d}</DateNumber>
                </DayCell>
            );
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dayOfWeek = date.getDay();
            const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth && selectedDate.getFullYear() === currentYear;
            const workLogsForDate = getWorkLogsForDate(date);

            cells.push(
                <DayCell
                    key={`curr-${day}`}
                    className={isSelected ? "selected" : ""}
                    onClick={() => {
                        setSelectedDate(date);
                        setIsAddModalOpen(true);
                    }}
                >
                    {/* {isSelected && (
                        <AddButton onClick={() => setIsAddModalOpen(true)}>
                            <img src={AddBtnImg} alt="add" />
                        </AddButton>
                    )} */}
                    <DateNumber dayOfWeek={dayOfWeek}>{day}</DateNumber>
                    {workLogsForDate.map(({ workLog, salaryTarget }) => {
                        const badgeColor =
                            salaryTarget?.colorHex && /^#[0-9A-Fa-f]{6}$/.test(salaryTarget.colorHex) ? salaryTarget.colorHex : "#00ccc7";
                        return (
                            <WorkTimeBadge
                                key={workLog.workLogId}
                                $color={badgeColor}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingWorkLog(workLog);
                                    setEditingSalaryTarget(salaryTarget);
                                    setIsEditModalOpen(true);
                                }}
                            >
                                {loginMethod === "email" && salaryTarget ? `${salaryTarget.workerName}, ${formatWorkTime(workLog.workedMinutes)}` : formatWorkTime(workLog.workedMinutes)}
                            </WorkTimeBadge>
                        );
                    })}
                </DayCell>
            );
        }

        const total = cells.length;
        const remain = total <= 35 ? 35 - total : 42 - total;

        for (let d = 1; d <= remain; d++) {
            const nextDate = new Date(currentYear, currentMonth + 1, d);
            const nextDayOfWeek = nextDate.getDay();
            cells.push(
                <DayCell key={`next-${d}`} className="other-month">
                    <DateNumber dayOfWeek={nextDayOfWeek}>{d}</DateNumber>
                </DayCell>
            );
        }
        return cells;
    };

    const monthlyTotalAmount = getMonthlyTotalAmount();
    const monthlyLabel = "총 급여";

    return (
        <>
            <Container>
                <TopBar>
                    <PickerButton onClick={() => setPickerOpen(!pickerOpen)}>
                        {currentYear}년 {currentMonth + 1}월 ˅
                    </PickerButton>
                    <TopBarTitleBlock>
                        {loginMethod === "accessCode" && pageTitle != null && pageTitle !== "" ? (
                            <TitleText>{pageTitle}</TitleText>
                        ) : loginMethod === "email" && companies.length > 0 && onCompanyChange ? (
                            <>
                                <CompanySelect value={selectedCompanyId ?? ""} onChange={(e) => onCompanyChange(e.target.value ? Number(e.target.value) : null)}>
                                    <option value="">업장을 선택하세요</option>
                                    {companies.map((c) => (
                                        <option key={c.companyId} value={c.companyId}>
                                            {c.name}
                                        </option>
                                    ))}
                                </CompanySelect>
                                <TitleSuffix>근무</TitleSuffix>
                            </>
                        ) : null}
                    </TopBarTitleBlock>
                    <SummaryCard onClick={() => setIsSummaryModalOpen(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setIsSummaryModalOpen(true)}>
                        <SummaryLabel>{monthlyLabel}</SummaryLabel>
                        <SummaryValue>{monthlyTotalAmount.toLocaleString()} 원 ˅</SummaryValue>
                    </SummaryCard>
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
                    {daysOfWeek.map((d, index) => (
                        <DayHeader key={d} isSunday={index === 0} isSaturday={index === 6}>
                            {d}
                        </DayHeader>
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
            <SummaryModal
                open={isSummaryModalOpen}
                onClose={() => setIsSummaryModalOpen(false)}
                title="근무자 별 임금 확인"
                year={currentYear}
                month={currentMonth + 1}
                rows={getSummaryRows()}
            />
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
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
`;

const PickerButton = styled.div`
    width: 240px;
    height: 72px;
    background: #11d0c9;
    border-radius: 36px;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    font-weight: 700;
    cursor: pointer;
`;

const TopBarTitleBlock = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-width: 0;
    font-size: 31px;
    font-weight: bold;
`;

const TitleText = styled.span`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const TitleSuffix = styled.span`
    white-space: nowrap;
`;

const CompanySelect = styled.select`
    padding: 8px 36px 8px 12px;
    font-size: 31px;
    font-weight: bold;
    border: 1.5px solid #00ccc7;
    border-radius: 12px;
    background: white;
    cursor: pointer;
    min-width: 180px;
    max-width: 100%;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%20viewBox%3D%220%200%20292.4%20292.4%22%3E%3Cpath%20fill%3D%22%2300a8a5%22%20d%3D%22M287%20197.9L159.3%2069.2c-3.7-3.7-9.7-3.7-13.4%200L5.4%20197.9c-3.7%203.7-3.7%209.7%200%2013.4l13.4%2013.4c3.7%203.7%209.7%203.7%2013.4%200l110.7-110.7c3.7-3.7%209.7-3.7%2013.4%200l110.7%20110.7c3.7%203.7%209.7%203.7%2013.4%200l13.4-13.4c3.7-3.7%203.7-9.7%200-13.4z%22%2F%3E%3C%2Fsvg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 16px;

    &:focus {
        outline: none;
        border-color: #00a8a5;
    }

    option[value=""] {
        display: none;
    }
`;

const SummaryCard = styled.div`
    width: 400px;
    height: 72px;
    background: #11d0c9;
    border-radius: 36px;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    font-size: 26px;
    cursor: pointer;
    user-select: none;

    &:hover {
        opacity: 0.95;
    }
`;

const SummaryLabel = styled.div`
    font-weight: 700;
    color: #ffffff;
`;

const SummaryValue = styled.div`
    font-weight: 700;
    color: #ffffff;
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

const DayHeader = styled.div<{ isSunday?: boolean; isSaturday?: boolean }>`
    padding: 10px 0;
    color: ${({ isSunday, isSaturday }) => (isSunday ? "#35d63b" : isSaturday ? "#11d0c9" : "#000")};
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
        background: #fafafa;
    }

    &.selected {
        background: #e5f4ff;
    }
`;

const DateNumber = styled.div<{ dayOfWeek?: number }>`
    font-size: 20px;
    font-weight: 700;
    color: ${({ dayOfWeek }) => (dayOfWeek === 0 ? "#35d63b" : dayOfWeek === 6 ? "#11d0c9" : "#000")};
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

const WorkTimeBadge = styled.div<{ $color?: string }>`
    width: 144px;
    height: 36px;
    border-radius: 18px;
    background-color: ${({ $color }) => $color ?? "#00ccc7"};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 600;
    margin-top: 8px;
    color: #333;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s, filter 0.2s;

    &:hover {
        filter: brightness(0.9);
        transform: scale(1.05);
    }
`;

export default Calendar;
