export interface WorkerInfo {
    workerName: string;
    hourlyWage: number;
    payDay: number;
    paidTotal?: number;
    colorHex?: string;
    bankName?: string;
    accountNumber?: string;
    maskedAccountNumber?: string;
}

export interface WorkerInfoResponse {
    status: number;
    message: string;
    data: WorkerInfo;
}
