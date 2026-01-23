export interface WorkerInfo {
    workerName: string;
    hourlyWage: number;
    payDay: number;
}

export interface WorkerInfoResponse {
    status: number;
    message: string;
    data: WorkerInfo;
}
