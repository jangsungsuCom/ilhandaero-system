export interface WorkLog {
    workLogId: number;
    salaryTargetId: number;
    companyName:string;
    workDate: string; // "2025-01-10"
    workedMinutes: number; // 30분 단위
    earnedAmount: number;
}

export interface WorkLogResponse {
    status: number;
    message: string;
    data: WorkLog[];
}

export interface CreateWorkLogRequest {
    workDate: string; // "yyyy-MM-dd"
    workedMinutes: number; // ≥ 30, 30분 단위
}
