import urlAxios from "./urlAxios";
import type { WorkLogActivity, NotificationItem } from "../types/notification";
import type { Company } from "../types/company";
import type { SalaryTarget } from "../types/salaryTarget";
import { getAccessCode } from "./auth";

interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}

type RawActivity = {
    id?: number;
    activityId?: number;
    workLogId: number;
    actionType: WorkLogActivity["actionType"];
    actorType: WorkLogActivity["actorType"];
    actorLabel: string;
    occurredAt?: string;
    createdAt?: string;
    isRead?: boolean;
    read?: boolean;
    readAt: string | null;
    beforeStartAt: string | null;
    beforeEndAt: string | null;
    beforeWorkedMinutes: number | null;
    afterStartAt: string | null;
    afterEndAt: string | null;
    afterWorkedMinutes: number | null;
};

function normalizeActivity(raw: RawActivity): WorkLogActivity {
    return {
        id: raw.id ?? raw.activityId ?? 0,
        workLogId: raw.workLogId,
        actionType: raw.actionType,
        actorType: raw.actorType,
        actorLabel: raw.actorLabel,
        occurredAt: raw.occurredAt ?? raw.createdAt ?? "",
        isRead: typeof raw.isRead === "boolean" ? raw.isRead : !!raw.read,
        readAt: raw.readAt,
        beforeStartAt: raw.beforeStartAt,
        beforeEndAt: raw.beforeEndAt,
        beforeWorkedMinutes: raw.beforeWorkedMinutes,
        afterStartAt: raw.afterStartAt,
        afterEndAt: raw.afterEndAt,
        afterWorkedMinutes: raw.afterWorkedMinutes,
    };
}

export async function getWorklogActivities(
    companyId: number,
    salaryTargetId: number
): Promise<WorkLogActivity[]> {
    const res = await urlAxios.get<ApiResponse<RawActivity[]>>(
        `/mypage/companies/${companyId}/salary-targets/${salaryTargetId}/worklog-activities`
    );
    return (res.data.data ?? []).map(normalizeActivity);
}

export async function markActivityAsRead(
    companyId: number,
    salaryTargetId: number,
    activityId: number
): Promise<boolean> {
    try {
        await urlAxios.post(
            `/mypage/companies/${companyId}/salary-targets/${salaryTargetId}/worklog-activities/${activityId}/read`
        );
        return true;
    } catch {
        return false;
    }
}

export async function markAllActivitiesAsRead(
    companyId: number,
    salaryTargetId: number
): Promise<boolean> {
    try {
        await urlAxios.post(
            `/mypage/companies/${companyId}/salary-targets/${salaryTargetId}/worklog-activities/read-all`
        );
        return true;
    } catch {
        return false;
    }
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function getAllNotifications(
    companies: Company[],
    salaryTargetsByCompany: Record<number, SalaryTarget[]>
): Promise<NotificationItem[]> {
    const cutoff = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
    const requests: Promise<NotificationItem[]>[] = [];

    for (const company of companies) {
        const targets = salaryTargetsByCompany[company.companyId] ?? [];
        for (const target of targets) {
            requests.push(
                getWorklogActivities(company.companyId, target.id)
                    .then((activities) =>
                        activities
                            .filter((a) => a.occurredAt >= cutoff)
                            .map((a) => ({
                                ...a,
                                companyId: company.companyId,
                                companyName: company.name,
                                salaryTargetId: target.id,
                                workerName: target.workerName,
                            }))
                    )
                    .catch(() => [] as NotificationItem[])
            );
        }
    }

    const results = await Promise.all(requests);
    const all = results.flat();
    all.sort(
        (a, b) =>
            new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
    return all;
}

export async function getAccessCodeNotifications(): Promise<NotificationItem[]> {
    const accessCode = getAccessCode();
    if (!accessCode) return [];

    const res = await urlAxios.get<ApiResponse<RawActivity[]>>(`/pud/${encodeURIComponent(accessCode)}/worklog-activities`);
    const activities = (res.data.data ?? []).map(normalizeActivity);
    const cutoff = Date.now() - THIRTY_DAYS_MS;

    return activities
        .filter((a) => {
            const t = new Date(a.occurredAt).getTime();
            return Number.isFinite(t) && t >= cutoff;
        })
        .map((a) => ({
            ...a,
            companyId: 0,
            companyName: "내 근무지",
            salaryTargetId: 0,
            workerName: a.actorType === "OWNER" ? "사장" : "근로자",
        }))
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
}

export async function markAccessCodeActivityAsRead(activityId: number): Promise<boolean> {
    const accessCode = getAccessCode();
    if (!accessCode) return false;
    try {
        await urlAxios.post(`/pud/${encodeURIComponent(accessCode)}/worklog-activities/${activityId}/read`);
        return true;
    } catch {
        return false;
    }
}

export async function markAllAccessCodeActivitiesAsRead(): Promise<boolean> {
    const accessCode = getAccessCode();
    if (!accessCode) return false;
    try {
        await urlAxios.post(`/pud/${encodeURIComponent(accessCode)}/worklog-activities/read-all`);
        return true;
    } catch {
        return false;
    }
}
