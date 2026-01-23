export interface SalaryTarget {
    id: number;
    workerName: string;
    phoneNumber: string;
    hourlyWage: number;
    payDay: number;
    bankName: string;
    accountNumber: string;
    accessCode: string;
    codeStatus: "ACTIVE" | "INACTIVE";
}

export interface SalaryTargetResponse {
    status: number;
    message: string;
    data: SalaryTarget[];
}
