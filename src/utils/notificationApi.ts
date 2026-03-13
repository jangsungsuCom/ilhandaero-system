import urlAxios from "./urlAxios";
import type { WorkLogActivity, NotificationItem } from "../types/notification";
import type { Company } from "../types/company";
import type { SalaryTarget } from "../types/salaryTarget";

interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}

export async function getWorklogActivities(
    companyId: number,
    salaryTargetId: number
): Promise<WorkLogActivity[]> {
    const res = await urlAxios.get<ApiResponse<WorkLogActivity[]>>(
        `/mypage/companies/${companyId}/salary-targets/${salaryTargetId}/worklog-activities`
    );
    return res.data.data ?? [];
}

export async function markActivityAsRead(
    companyId: number,
    salaryTargetId: number,
    activityId: number
): Promise<boolean> {
    try {
        await urlAxios.put(
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
        await urlAxios.put(
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
                            .filter(
                                (a) =>
                                    a.actorType === "WORKER" &&
                                    a.occurredAt >= cutoff
                            )
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
