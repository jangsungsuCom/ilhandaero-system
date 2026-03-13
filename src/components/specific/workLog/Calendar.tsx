// src/components/Calendar.tsx
import React, { useState, type JSX } from "react";
import styled from "styled-components";
import AddModal from "./AddModal";
import EditModal from "./EditModal";
import BulkEditModal from "./BulkEditModal";
import SummaryModal, { type SummaryRow, type SummaryMode, type AdvanceDetailRow } from "./SummaryModal";
import type { WorkLog } from "../../../types/workLog";
import type { SalaryTarget } from "../../../types/salaryTarget";
import { format } from "date-fns";
import type { LoginMethod } from "../../../types/auth";
import type { CalendarStartDay, WorkTimeDisplayFormat } from "../../../utils/calendarSettings";
import { deleteWorkLogByAccessCode } from "../../../utils/workLog";
import { getAccessCode } from "../../../utils/auth";
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
    /** accessCode 로그인 시 선정산 요청 상세 (날짜+금액+상태) */
    advanceDetails?: AdvanceDetailRow[];
    /** accessCode 로그인 시 근무자 색상 (배지 색상용) */
    workerColorHex?: string;
    /** TopBar 좌측에 렌더링할 요소 (년월 선택 등) */
    headerLeft?: React.ReactNode;
    /** TopBar 우측에 렌더링할 요소 (아이콘 등) */
    headerRight?: React.ReactNode;
    /** 날짜 선택과 총급여 사이에 렌더링할 피커 */
    pickerSlot?: React.ReactNode;
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
    advanceDetails,
    workerColorHex,
    headerLeft,
    headerRight,
    pickerSlot,
}) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | null>(null);
    const [editingSalaryTarget, setEditingSalaryTarget] = useState<SalaryTarget | undefined>(undefined);
    const [summaryModalMode, setSummaryModalMode] = useState<SummaryMode | null>(null);
    const [bulkEditMode, setBulkEditMode] = useState(false);
    const [selectedWorkLogIds, setSelectedWorkLogIds] = useState<Set<number>>(new Set());
    const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
    const [bulkEditTargets, setBulkEditTargets] = useState<{ workLog: WorkLog; salaryTarget?: SalaryTarget }[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    const toggleBulkEditMode = () => {
        if (bulkEditMode) {
            setSelectedWorkLogIds(new Set());
        }
        setBulkEditMode(!bulkEditMode);
    };

    const toggleWorkLogSelection = (workLogId: number) => {
        setSelectedWorkLogIds((prev) => {
            const next = new Set(prev);
            if (next.has(workLogId)) {
                next.delete(workLogId);
            } else {
                next.add(workLogId);
            }
            return next;
        });
    };

    const handleBulkEdit = () => {
        if (selectedWorkLogIds.size === 0) return;
        const targets: { workLog: WorkLog; salaryTarget?: SalaryTarget }[] = [];
        for (const [ac, logs] of Object.entries(workLogsByAccessCode)) {
            const target = salaryTargets.find((t) => t.accessCode === ac);
            for (const log of logs) {
                if (selectedWorkLogIds.has(log.workLogId)) {
                    targets.push({ workLog: log, salaryTarget: target });
                }
            }
        }
        if (targets.length === 0) return;
        setBulkEditTargets(targets);
        setBulkEditModalOpen(true);
    };

    const handleBulkDelete = async () => {
        if (selectedWorkLogIds.size === 0) return;
        if (!window.confirm(`선택한 ${selectedWorkLogIds.size}개의 근무 기록을 삭제하시겠습니까?`)) return;

        setIsBulkDeleting(true);
        try {
            const promises: Promise<void>[] = [];
            for (const [ac, logs] of Object.entries(workLogsByAccessCode)) {
                const target = salaryTargets.find((t) => t.accessCode === ac);
                for (const log of logs) {
                    if (selectedWorkLogIds.has(log.workLogId)) {
                        const code = target?.accessCode || (loginMethod === "accessCode" ? getAccessCode() : undefined);
                        promises.push(deleteWorkLogByAccessCode(log.workLogId, code || undefined));
                    }
                }
            }
            await Promise.all(promises);
            setSelectedWorkLogIds(new Set());
            setBulkEditMode(false);
            onWorkLogCreated?.();
        } catch {
            alert("일부 삭제에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsBulkDeleting(false);
        }
    };

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
        const yearStr = String(currentYear);
        const monthStr = String(currentMonth + 1).padStart(2, "0");
        const prefix = `${yearStr}-${monthStr}`;

        const advancedMap = new Map<string, number>();
        if (workAmountRows) {
            workAmountRows.forEach((r) => advancedMap.set(r.workerName, r.totalAdvanced));
        }

        if (loginMethod === "email") {
            return salaryTargets.map((target) => {
                const logs = workLogsByAccessCode[target.accessCode] || [];
                const totalAmount = logs.filter((log) => log.workDate.startsWith(prefix)).reduce((sum, log) => sum + log.earnedAmount, 0);
                return { workerName: target.workerName, totalAmount, totalAdvanced: advancedMap.get(target.workerName) ?? 0 };
            });
        }
        if (loginMethod === "accessCode" && accessCode) {
            const logs = workLogsByAccessCode[accessCode] || [];
            const totalAmount = logs.filter((log) => log.workDate.startsWith(prefix)).reduce((sum, log) => sum + log.earnedAmount, 0);
            const workerName = pageTitle != null && pageTitle !== "" ? pageTitle.replace(/님의 근무 기록$/, "").trim() || "근무자" : "근무자";
            return [{ workerName, totalAmount, totalAdvanced: workAmountData?.totalAdvanced ?? 0 }];
        }
        return [];
    };

    const formatWorkTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) {
            return `${hours}h${mins}m`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else {
            return `${mins}m`;
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
                        if (!bulkEditMode) {
                            setSelectedDate(date);
                            setIsAddModalOpen(true);
                        }
                    }}
                >
                    <DateNumber $dayOfWeek={dayOfWeek}>{day}</DateNumber>
                    {workLogsForDate.map(({ workLog, salaryTarget }) => {
                        const colorHex = salaryTarget?.colorHex || workerColorHex;
                        const badgeColor = colorHex && /^#[0-9A-Fa-f]{6}$/.test(colorHex) ? colorHex : "#00ccc7";
                        const isChecked = selectedWorkLogIds.has(workLog.workLogId);
                        return (
                            <WorkTimeBadge
                                key={workLog.workLogId}
                                $color={badgeColor}
                                $bulkMode={bulkEditMode}
                                $checked={isChecked}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (bulkEditMode) {
                                        toggleWorkLogSelection(workLog.workLogId);
                                    } else {
                                        setEditingWorkLog(workLog);
                                        setEditingSalaryTarget(salaryTarget);
                                        setIsEditModalOpen(true);
                                    }
                                }}
                            >
                                {bulkEditMode && <BulkCheckbox $checked={isChecked} />}
                                {loginMethod === "email" && salaryTarget ? `${salaryTarget.workerName} ${formatWorkTimeDisplay(workLog)}` : formatWorkTimeDisplay(workLog)}
                            </WorkTimeBadge>
                        );
                    })}
                </DayCell>,
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
    const monthlyLabel = "누적급여";
    const displayGross = monthlyTotalAmount;
    const displayTotalAdvanced = workAmountData ? workAmountData.totalAdvanced : 0;

    return (
        <>
            <Container>
                <Row1>
                    <HeaderRightArea>
                        {bulkEditMode ? (
                            <BulkEditActions>
                                <BulkEditInfo>{selectedWorkLogIds.size}개 선택됨</BulkEditInfo>
                                <BulkEditButton onClick={handleBulkEdit} disabled={selectedWorkLogIds.size === 0}>
                                    수정
                                </BulkEditButton>
                                <BulkDeleteButton onClick={handleBulkDelete} disabled={selectedWorkLogIds.size === 0 || isBulkDeleting}>
                                    {isBulkDeleting ? "삭제 중..." : "삭제"}
                                </BulkDeleteButton>
                                <BulkCancelButton onClick={toggleBulkEditMode}>취소</BulkCancelButton>
                            </BulkEditActions>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                                {headerRight}
                                <BulkEditToggle onClick={toggleBulkEditMode}>선택 수정</BulkEditToggle>
                            </div>
                        )}
                    </HeaderRightArea>
                </Row1>
                <CardsGrid>
                    <CardsGridCell>{headerLeft}</CardsGridCell>
                    <CardsGridCell>
                        {loginMethod === "email" && companies.length > 0 && onCompanyChange ? (
                            <CompanySelectWrapper>
                                <CompanySelect value={selectedCompanyId ?? ""} onChange={(e) => onCompanyChange(e.target.value ? Number(e.target.value) : null)}>
                                    <option value="">업장을 선택하세요</option>
                                    {companies.map((c) => (
                                        <option key={c.companyId} value={c.companyId}>
                                            {c.name}
                                        </option>
                                    ))}
                                </CompanySelect>
                                <SelectArrow>˅</SelectArrow>
                            </CompanySelectWrapper>
                        ) : loginMethod === "accessCode" && pageTitle != null && pageTitle !== "" ? (
                            <TitleTextWrap>
                                <TitleText>{pageTitle}</TitleText>
                            </TitleTextWrap>
                        ) : null}
                    </CardsGridCell>
                    {pickerSlot ? <CardsGridFullWidth>{pickerSlot}</CardsGridFullWidth> : null}
                    <SummaryLabelText>{monthlyLabel}</SummaryLabelText>
                    <SummaryLabelText>지급된 선정산액</SummaryLabelText>
                    <SummaryCard onClick={() => setSummaryModalMode("gross")} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSummaryModalMode("gross")}>
                        <SummaryValue>{displayGross.toLocaleString()} 원</SummaryValue>
                        <div>˅</div>
                    </SummaryCard>
                    <SummaryCard onClick={() => setSummaryModalMode("advanced")} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setSummaryModalMode("advanced")}>
                        <SummaryValue>{(displayTotalAdvanced ?? 0).toLocaleString()} 원</SummaryValue>
                        <div>˅</div>
                    </SummaryCard>
                </CardsGrid>

                <WeekDays>
                    {daysOfWeek.map((d, index) => {
                        const dayOfWeek = (calendarStartDay + index) % 7;
                        return (
                            <DayHeader key={d} $isSunday={dayOfWeek === 0} $isSaturday={dayOfWeek === 6}>
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
            <BulkEditModal
                open={bulkEditModalOpen}
                onClose={() => setBulkEditModalOpen(false)}
                workLogs={bulkEditTargets}
                onComplete={() => {
                    setBulkEditModalOpen(false);
                    setBulkEditTargets([]);
                    setSelectedWorkLogIds(new Set());
                    setBulkEditMode(false);
                    onWorkLogCreated?.();
                }}
            />
            <SummaryModal
                open={summaryModalMode !== null}
                onClose={() => setSummaryModalMode(null)}
                year={currentYear}
                month={currentMonth + 1}
                rows={getSummaryRows()}
                mode={summaryModalMode ?? "gross"}
                advanceDetails={advanceDetails}
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

const Row1 = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 8px;

    ${media.mobile} {
        margin-bottom: 6px;
    }
`;

const CardsGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;

    ${media.tablet} {
        gap: 12px;
        margin-bottom: 12px;
    }

    ${media.mobile} {
        gap: 8px;
        margin-bottom: 12px;
    }
`;

const CardsGridCell = styled.div`
    min-width: 0;
`;

const CardsGridFullWidth = styled.div`
    grid-column: 1 / -1;
`;

const TitleTextWrap = styled.div`
    width: 100%;
    height: 72px;
    border-radius: 36px;
    background: #00ccc7;
    color: #ffffff;
    display: flex;
    align-items: center;
    padding: 0 24px;
    font-size: 24px;
    font-weight: 700;

    ${media.desktop} {
        height: 60px;
        font-size: 22px;
        padding: 0 20px;
    }

    ${media.tablet} {
        height: 48px;
        font-size: 17px;
        padding: 0 16px;
        border-radius: 24px;
    }

    ${media.mobile} {
        height: 40px;
        font-size: 13px;
        padding: 0 12px;
        border-radius: 20px;
    }
`;

const TitleText = styled.span`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const CompanySelectWrapper = styled.div`
    position: relative;
    width: 100%;
    height: 72px;
    border-radius: 36px;
    background: #00ccc7;
    cursor: pointer;
    display: flex;
    align-items: center;

    &:hover {
        opacity: 0.95;
    }

    ${media.desktop} {
        height: 60px;
    }

    ${media.tablet} {
        height: 48px;
        border-radius: 24px;
    }

    ${media.mobile} {
        height: 40px;
        border-radius: 20px;
    }
`;

const CompanySelect = styled.select`
    height: 100%;
    width: 100%;
    padding: 0 40px 0 24px;
    font-size: 24px;
    font-weight: 700;
    border: none;
    border-radius: inherit;
    background: transparent;
    color: #ffffff;
    cursor: pointer;
    appearance: none;

    &:focus {
        outline: none;
    }

    option {
        background: white;
        color: #000;
    }

    ${media.desktop} {
        font-size: 22px;
        padding: 0 36px 0 20px;
    }

    ${media.tablet} {
        font-size: 17px;
        padding: 0 32px 0 16px;
    }

    ${media.mobile} {
        font-size: 13px;
        padding: 0 28px 0 12px;
    }
`;

const SelectArrow = styled.span`
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    color: #ffffff;
    font-size: 18px;
    pointer-events: none;

    ${media.tablet} {
        right: 12px;
        font-size: 14px;
    }

    ${media.mobile} {
        right: 10px;
        font-size: 12px;
    }
`;

const SummaryLabelText = styled.div`
    font-size: 19px;
    font-weight: 700;
    color: #00ccc7;
    padding-left: 4px;
    min-width: 0;

    ${media.desktop} {
        font-size: 18px;
    }

    ${media.tablet} {
        font-size: 16px;
    }

    ${media.mobile} {
        font-size: 13px;
    }
`;

const SummaryCard = styled.div`
    min-width: 0;
    height: 72px;
    background: #00ccc7;
    border-radius: 36px;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    font-size: 24px;
    cursor: pointer;
    user-select: none;
    gap: 12px;

    &:hover {
        opacity: 0.95;
    }

    ${media.desktop} {
        height: 60px;
        font-size: 22px;
        padding: 0 20px;
    }

    ${media.tablet} {
        height: 48px;
        font-size: 17px;
        padding: 0 16px;
        border-radius: 24px;
        gap: 8px;
    }

    ${media.mobile} {
        height: 40px;
        font-size: 13px;
        padding: 0 12px;
        border-radius: 20px;
        gap: 6px;
    }
`;

const SummaryValue = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
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
    border-bottom: 1px solid #000;
    font-weight: 700;
`;

const DayHeader = styled.div<{ $isSunday?: boolean; $isSaturday?: boolean }>`
    padding: 10px 0;
    font-size: 20px;
    color: ${({ $isSunday, $isSaturday }) => ($isSunday || $isSaturday ? "#00ccc7" : "#000")};

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

const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
    background: rgba(0, 0, 0, 0.1);
`;

const DayCell = styled.div`
    min-height: 177px;
    background: white;
    padding: 6px;
    position: relative;
    cursor: pointer;

    &.other-month {
        background: #fff;
    }

    &.selected {
        background: rgba(0, 204, 199, 0.1);
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

const DateNumber = styled.div<{ $dayOfWeek?: number }>`
    font-size: 20px;
    font-weight: 700;
    color: ${({ $dayOfWeek }) => ($dayOfWeek === 0 || $dayOfWeek === 6 ? "#00ccc7" : "#000")};

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

const WorkTimeBadge = styled.div<{ $color?: string; $bulkMode?: boolean; $checked?: boolean }>`
    width: 144px;
    height: 36px;
    border-radius: 18px;
    background-color: ${({ $color }) => $color ?? "#00ccc7"};
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 14px;
    font-weight: 600;
    margin-top: 8px;
    color: #000;
    cursor: pointer;
    transition:
        background-color 0.2s,
        transform 0.1s,
        filter 0.2s,
        opacity 0.2s;
    opacity: ${({ $bulkMode, $checked }) => ($bulkMode && !$checked ? 0.6 : 1)};

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

const BulkCheckbox = styled.span<{ $checked: boolean }>`
    width: 14px;
    height: 14px;
    border-radius: 3px;
    border: 2px solid #fff;
    background: ${({ $checked }) => ($checked ? "#fff" : "transparent")};
    flex-shrink: 0;
    position: relative;

    &::after {
        content: "${({ $checked }) => ($checked ? "✓" : "")}";
        position: absolute;
        top: -2px;
        left: 1px;
        font-size: 12px;
        color: #00ccc7;
        font-weight: bold;
    }

    ${media.tablet} {
        width: 10px;
        height: 10px;
        &::after {
            font-size: 8px;
            top: -2px;
            left: 0;
        }
    }

    ${media.mobile} {
        width: 8px;
        height: 8px;
        border-width: 1px;
        &::after {
            font-size: 6px;
            top: -2px;
            left: 0;
        }
    }
`;

const HeaderRightArea = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;

    ${media.mobile} {
        gap: 6px;
    }
`;

const BulkEditToggle = styled.button`
    padding: 0;
    font-size: 19px;
    font-weight: 700;
    color: #00ccc7;
    background: none;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s;
    white-space: nowrap;

    &:hover {
        opacity: 0.7;
    }

    ${media.desktop} {
        font-size: 18px;
    }

    ${media.tablet} {
        font-size: 16px;
    }

    ${media.mobile} {
        font-size: 13px;
    }
`;

const BulkEditInfo = styled.span`
    font-size: 19px;
    font-weight: 700;
    color: #00ccc7;
    white-space: nowrap;

    ${media.desktop} {
        font-size: 18px;
    }

    ${media.tablet} {
        font-size: 16px;
    }

    ${media.mobile} {
        font-size: 13px;
    }
`;

const BulkEditActions = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;

    ${media.mobile} {
        gap: 5px;
    }
`;

const BulkEditButton = styled.button`
    padding: 0;
    font-size: 19px;
    font-weight: 700;
    color: #00ccc7;
    background: none;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s;
    white-space: nowrap;

    &:hover:not(:disabled) {
        opacity: 0.7;
    }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    ${media.desktop} {
        font-size: 18px;
    }

    ${media.tablet} {
        font-size: 16px;
    }

    ${media.mobile} {
        font-size: 13px;
    }
`;

const BulkDeleteButton = styled.button`
    padding: 0;
    font-size: 19px;
    font-weight: 700;
    color: #000;
    background: none;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s;
    white-space: nowrap;

    &:hover:not(:disabled) {
        opacity: 0.7;
    }

    &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    ${media.desktop} {
        font-size: 18px;
    }

    ${media.tablet} {
        font-size: 16px;
    }

    ${media.mobile} {
        font-size: 13px;
    }
`;

const BulkCancelButton = styled.button`
    padding: 0;
    font-size: 19px;
    font-weight: 700;
    color: #000;
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.2s;
    white-space: nowrap;

    &:hover {
        color: #000;
    }

    ${media.desktop} {
        font-size: 18px;
    }

    ${media.tablet} {
        font-size: 16px;
    }

    ${media.mobile} {
        font-size: 13px;
    }
`;

export default Calendar;
