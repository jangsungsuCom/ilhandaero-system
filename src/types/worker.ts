export interface WorkerInfo {
    workerName: string;
    hourlyWage: number;
    payDay: number;
    paidTotal?: number;
    colorHex?: string;
}

export interface WorkerInfoResponse {
    status: number;
    message: string;
    data: WorkerInfo;
}
