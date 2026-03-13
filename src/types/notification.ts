export type ActionType = "CREATED" | "UPDATED" | "DELETED";
export type ActorType = "WORKER" | "OWNER";

export interface WorkLogActivity {
    id: number;
    workLogId: number;
    actionType: ActionType;
    actorType: ActorType;
    actorLabel: string;
    occurredAt: string;
    isRead: boolean;
    readAt: string | null;
    beforeStartAt: string | null;
    beforeEndAt: string | null;
    beforeWorkedMinutes: number | null;
    afterStartAt: string | null;
    afterEndAt: string | null;
    afterWorkedMinutes: number | null;
}

export interface NotificationItem extends WorkLogActivity {
    companyId: number;
    companyName: string;
    salaryTargetId: number;
    workerName: string;
}
