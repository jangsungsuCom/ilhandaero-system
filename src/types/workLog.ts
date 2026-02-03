export interface WorkLog {
    workLogId: number;
    salaryTargetId: number;
    companyName: string;
    workDate: string; // "2025-01-10"
    startTime?: string; // "07:00"
    endTime?: string; // "16:00"
    workedMinutes: number;
    earnedAmount: number;
}

export interface WorkLogResponse {
    status: number;
    message: string;
    data: WorkLog[];
}

export interface CreateWorkLogRequest {
    workDate: string; // "yyyy-MM-dd"
    startTime: string; // "HH:mm"
    endTime: string; // "HH:mm"
}
