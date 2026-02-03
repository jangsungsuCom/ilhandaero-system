/** 달력 시작 요일: 0=일, 1=월, 2=화, 3=수, 4=목, 5=금, 6=토 */
export type CalendarStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** 근무시간 표시 형태 */
export type WorkTimeDisplayFormat = "hours" | "range";

export interface CalendarSettings {
    startDay: CalendarStartDay;
    workTimeFormat: WorkTimeDisplayFormat;
}

const STORAGE_KEY_START_DAY = "calendar_start_day";
const STORAGE_KEY_WORK_TIME_FORMAT = "calendar_work_time_format";

const DEFAULT_START_DAY: CalendarStartDay = 0;
const DEFAULT_WORK_TIME_FORMAT: WorkTimeDisplayFormat = "hours";

function parseStartDay(value: string | null): CalendarStartDay {
    if (value === null) return DEFAULT_START_DAY;
    const n = parseInt(value, 10);
    if (Number.isInteger(n) && n >= 0 && n <= 6) return n as CalendarStartDay;
    return DEFAULT_START_DAY;
}

function parseWorkTimeFormat(value: string | null): WorkTimeDisplayFormat {
    if (value === "hours" || value === "range") return value;
    return DEFAULT_WORK_TIME_FORMAT;
}

export function getCalendarSettings(): CalendarSettings {
    if (typeof window === "undefined") {
        return { startDay: DEFAULT_START_DAY, workTimeFormat: DEFAULT_WORK_TIME_FORMAT };
    }
    return {
        startDay: parseStartDay(localStorage.getItem(STORAGE_KEY_START_DAY)),
        workTimeFormat: parseWorkTimeFormat(localStorage.getItem(STORAGE_KEY_WORK_TIME_FORMAT)),
    };
}

export function setCalendarStartDay(startDay: CalendarStartDay): void {
    localStorage.setItem(STORAGE_KEY_START_DAY, String(startDay));
}

export function setCalendarWorkTimeFormat(format: WorkTimeDisplayFormat): void {
    localStorage.setItem(STORAGE_KEY_WORK_TIME_FORMAT, format);
}
