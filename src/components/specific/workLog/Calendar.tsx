// src/components/Calendar.tsx
import React, { useState, type JSX } from "react";
import styled from "styled-components";
import AddModal from "./AddModal";
import EditModal from "./EditModal";
import SummaryModal, { type SummaryRow, type SummaryMode } from "./SummaryModal";
import type { WorkLog } from "../../../types/workLog";
import type { SalaryTarget } from "../../../types/salaryTarget";
import { format } from "date-fns";
import type { LoginMethod } from "../../../types/auth";
import type { CalendarStartDay, WorkTimeDisplayFormat } from "../../../utils/calendarSettings";
import { media } from "../../../styles/breakpoints";

export interface CompanyOption {
    companyId: number;
    name: string;
}

interface CalendarProps {
    workLogsByAccessCode?: Record<string, WorkLog[]>;
    salaryTargets?: SalaryTarget[];
    currentYear: number;
    currentMonth: number;
    onWorkLogCreated?: () => void;
    loginMethod?: LoginMethod;
    accessCode?: string;
    /** 이메일 로그인 시 업장 선택용 (TopBar에 표시) */
    companies?: CompanyOption[];
    selectedCompanyId?: number | null;
    onCompanyChange?: (companyId: number | null) => void;
    /** 페이지 제목 (WorkLogPage에서 계산해 전달) */
    pageTitle?: string;
    /** accessCode 로그인 시 해당 월 work-amount (총 급여/선정산액 표시용) */
    workAmountData?: { grossAmount: number; totalAdvanced: number } | null;
    /** 이메일 로그인 시 근무자별 work-amount (SummaryModal용) */
    workAmountRows?: { workerName: string; grossAmount: number; totalAdvanced: number }[];
    /** 달력 시작 요일: 0=일, 1=월, 2=화 (localStorage 연동) */
    calendarStartDay?: CalendarStartDay;
    /** 근무시간 표시: "hours" = nn h, "range" = hh:mm~hh:mm */
    workTimeDisplayFormat?: WorkTimeDisplayFormat;
    /** accessCode 로그인 시 근무자 색상 (배지 색상용) */
    workerColorHex?: string;
}

const Calendar: React.FC<CalendarProps> = ({
    workLogsByAccessCode = {},
    salaryTargets = [],
    currentYear,
    currentMonth,
    onWorkLogCreated,
    loginMethod,
    accessCode,
    companies = [],
    selectedCompanyId = null,
    onCompanyChange,
    pageTitle,
    workAmountData = null,
    workAmountRows,
    calendarStartDay = 0,
    workTimeDisplayFormat = "hours",
    workerColorHex,
}) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | null>(null);
    const [editingSalaryTarget, setEditingSalaryTarget] = useState<SalaryTarget | undefined>(undefined);
    const [summaryModalMode, setSummaryModalMode] = useState<SummaryMode | null>(null);

    const DAYS_ORDER = ["일", "월", "화", "수", "목", "금", "토"];
    const daysOfWeek = DAYS_ORDER.slice(calendarStartDay).concat(DAYS_ORDER.slice(0, calendarStartDay));
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

    const getWorkLogsForDate = (date: Date): Array<{ workLog: WorkLog; salaryTarget?: SalaryTarget }> => {
        const dateStr = format(date, "yyyy-MM-dd");
        const result: Array<{ workLog: WorkLog; salaryTarget?: SalaryTarget }> = [];

        // 이메일 로그인인 경우: salaryTargets와 workLogsByAccessCode 매칭
        if (loginMethod === "email") {
            salaryTargets.forEach((target) => {
                const workLogs = workLogsByAccessCode[target.accessCode] || [];
                // 같은 날짜의 모든 workLog를 가져옴
                const matchingLogs = workLogs.filter((log) => log.workDate === dateStr);
                matchingLogs.forEach((workLog) => {
                    result.push({ workLog, salaryTarget: target });
                });
            });
        }
        // accessCode 로그인인 경우: 해당 accessCode의 workLogs만 표시
        else if (loginMethod === "accessCode" && accessCode) {
            const workLogs = workLogsByAccessCode[accessCode] || [];
            // 같은 날짜의 모든 workLog를 가져옴
            const matchingLogs = workLogs.filter((log) => log.workDate === dateStr);
            matchingLogs.forEach((workLog) => {
                result.push({ workLog });
            });
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
        if (loginMethod === "email" && workAmountRows && workAmountRows.length > 0) {
            return workAmountRows.map((r) => ({ workerName: r.workerName, totalAmount: r.grossAmount, totalAdvanced: r.totalAdvanced }));
        }
        const yearStr = String(currentYear);
        const monthStr = String(currentMonth + 1).padStart(2, "0");
        const prefix = `${yearStr}-${monthStr}`;

        if (loginMethod === "email") {
            return salaryTargets.map((target) => {
                const logs = workLogsByAccessCode[target.accessCode] || [];
                const totalAmount = logs.filter((log) => log.workDate.startsWith(prefix)).reduce((sum, log) => sum + log.earnedAmount, 0);
                return { workerName: target.workerName, totalAmount };
            });
        }
        if (loginMethod === "accessCode" && accessCode) {
            const logs = workLogsByAccessCode[accessCode] || [];
            const totalAmount = logs.filter((log) => log.workDate.startsWith(prefix)).reduce((sum, log) => sum + log.earnedAmount, 0);
            const workerName = pageTitle != null && pageTitle !== "" ? pageTitle.replace(/님의 근무 기록$/, "").trim() || "근무자" : "근무자";
            return [{ workerName, totalAmount }];
        }
        return [];
    };

    const formatWorkTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) {
            return `${hours}시간 ${mins}분`;
        } else if (hours > 0) {
            return `${hours}시간`;
        } else {
            return `${mins}분`;
        }
    };

    /** 시간 문자열을 HH:mm 형태로 (초 제거) */
    const toHHmm = (timeStr: string): string => {
        const part = timeStr.trim().split(":");
        if (part.length >= 2) return `${part[0].padStart(2, "0")}:${part[1].padStart(2, "0")}`;
        return timeStr;
    };

    const formatWorkTimeDisplay = (workLog: WorkLog): string => {
        if (workTimeDisplayFormat === "range" && workLog.startTime && workLog.endTime) {
            return `${toHHmm(workLog.startTime)}~${toHHmm(workLog.endTime)}`;
        }
        return formatWorkTime(workLog.workedMinutes);
    };

    const generateCalendar = () => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun .. 6=Sat
        const prevMonthCells = (firstDayOfMonth - calendarStartDay + 7) % 7;
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const cells: JSX.Element[] = [];

        for (let i = 0; i < prevMonthCells; i++) {
            cells.push(<DayCell key={`prev-${i}`} className="other-month" />);
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
                        // email 로그인: salaryTarget.colorHex 사용, accessCode 로그인: workerColorHex 사용
                        const colorHex = salaryTarget?.colorHex || workerColorHex;
                        const badgeColor = colorHex && /^#[0-9A-Fa-f]{6}$/.test(colorHex) ? colorHex : "#00ccc7";
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
                                {loginMethod === "email" && salaryTarget ? `${salaryTarget.workerName}, ${formatWorkTimeDisplay(workLog)}` : formatWorkTimeDisplay(workLog)}
                            </WorkTimeBadge>
                        );
                    })}
                </DayCell>
            );
        }

        const total = cells.length;
        const remain = total % 7 === 0 ? 0 : 7 - (total % 7);

        for (let d = 1; d <= remain; d++) {
            cells.push(<DayCell key={`next-${d}`} className="other-month" />);
        }
        return cells;
    };

    const monthlyTotalAmount = getMonthlyTotalAmount();
    const monthlyLabel = "총 급여";
    const displayGross = workAmountData != null ? workAmountData.grossAmount : monthlyTotalAmount;
    const displayTotalAdvanced = workAmountData ? workAmountData.totalAdvanced : 0;

    return (
        <>
            <Container>
                <TopBar>
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
                    <SummaryCardsWrapper>
                        <SummaryCard onClick={() => setSummaryModalMode("gross")} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSummaryModalMode("gross")}>
                            <SummaryLabel>{monthlyLabel}</SummaryLabel>
                            <SummaryValue>{displayGross.toLocaleString()} 원</SummaryValue>
                            <div>˅</div>
                        </SummaryCard>
                        <SummaryCard onClick={() => setSummaryModalMode("advanced")} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSummaryModalMode("advanced")}>
                            <SummaryLabel>선정산금</SummaryLabel>
                            <SummaryValue>{(displayTotalAdvanced ?? 0).toLocaleString()} 원</SummaryValue>
                            <div>˅</div>
                        </SummaryCard>
                    </SummaryCardsWrapper>
                </TopBar>

                <WeekDays>
                    {daysOfWeek.map((d, index) => {
                        const dayOfWeek = (calendarStartDay + index) % 7;
                        return (
                            <DayHeader key={d} isSunday={dayOfWeek === 0} isSaturday={dayOfWeek === 6}>
                                {d}
                            </DayHeader>
                        );
                    })}
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
                open={summaryModalMode !== null}
                onClose={() => setSummaryModalMode(null)}
                year={currentYear}
                month={currentMonth + 1}
                rows={getSummaryRows()}
                mode={summaryModalMode ?? "gross"}
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

    ${media.tablet} {
        padding: 4px;
    }
`;

const TopBar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;

    ${media.tablet} {
        flex-wrap: wrap;
        gap: 12px;
    }

    ${media.mobile} {
        gap: 8px;
    }
`;

const TopBarTitleBlock = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-width: 0;
    font-size: 31px;
    font-weight: bold;

    ${media.desktop} {
        font-size: 24px;
    }

    ${media.tablet} {
        font-size: 18px;
        gap: 8px;
        order: 3;
        flex-basis: 100%;
    }

    ${media.mobile} {
        font-size: 14px;
    }
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

    ${media.desktop} {
        font-size: 24px;
        min-width: 150px;
    }

    ${media.tablet} {
        font-size: 18px;
        min-width: 120px;
        padding: 6px 28px 6px 10px;
    }

    ${media.mobile} {
        font-size: 14px;
        min-width: 100px;
        padding: 4px 24px 4px 8px;
    }
`;

const SummaryCardsWrapper = styled.div`
    display: flex;
    flex: 1;
    gap: 16px;

    ${media.tablet} {
        gap: 12px;
    }

    ${media.mobile} {
        gap: 8px;
    }
`;

const SummaryCard = styled.div`
    flex: 1;
    min-width: 200px;
    height: 72px;
    background: #11d0c9;
    border-radius: 36px;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    font-size: 20px;
    cursor: pointer;
    user-select: none;
    gap: 12px;

    &:hover {
        opacity: 0.95;
    }

    ${media.desktop} {
        min-width: 180px;
        height: 60px;
        font-size: 18px;
        padding: 0 20px;
    }

    ${media.tablet} {
        min-width: 140px;
        height: 48px;
        font-size: 14px;
        padding: 0 16px;
        border-radius: 24px;
        gap: 8px;
    }

    ${media.mobile} {
        min-width: 110px;
        height: 40px;
        font-size: 11px;
        padding: 0 12px;
        border-radius: 20px;
        gap: 6px;
    }
`;

const SummaryLabel = styled.div`
    font-weight: 700;
    color: #ffffff;
`;

const SummaryValue = styled.div`
    flex: 1;
    padding-right: 12px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: 2px;
    font-weight: 700;
    color: #ffffff;

    ${media.mobile} {
        padding-right: 8px;
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
    gap: 1px;
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

    ${media.desktop} {
        min-height: 140px;
        padding: 4px;
    }

    ${media.tablet} {
        min-height: 100px;
        padding: 3px;
    }

    ${media.mobile} {
        min-height: 70px;
        padding: 2px;
    }
`;

const DateNumber = styled.div<{ dayOfWeek?: number }>`
    font-size: 20px;
    font-weight: 700;
    color: ${({ dayOfWeek }) => (dayOfWeek === 0 ? "#35d63b" : dayOfWeek === 6 ? "#11d0c9" : "#000")};

    ${media.desktop} {
        font-size: 16px;
    }

    ${media.tablet} {
        font-size: 14px;
    }

    ${media.mobile} {
        font-size: 12px;
    }
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

    ${media.desktop} {
        width: 120px;
        height: 30px;
        font-size: 12px;
        margin-top: 6px;
    }

    ${media.tablet} {
        width: 100%;
        max-width: 100px;
        height: 26px;
        font-size: 10px;
        margin-top: 4px;
        border-radius: 13px;
    }

    ${media.mobile} {
        width: 100%;
        max-width: 80px;
        height: 20px;
        font-size: 8px;
        margin-top: 2px;
        border-radius: 10px;
    }
`;

export default Calendar;
