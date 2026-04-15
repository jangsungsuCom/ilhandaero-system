export type DeductionType = "NONE" | "THREE_POINT_THREE" | "FOUR_INSURANCE";

export interface SalaryTarget {
    id: number;
    workerName: string;
    phoneNumber: string;
    hourlyWage: number;
    payDay: number;
    bankName: string;
    accountNumber: string;
    accessCode: string;
    codeStatus: "ACTIVE" | "REVOKED";
    blacklisted: boolean;
    weeklyAllowanceEnabled?: boolean;
    deductionType?: DeductionType;
    colorHex?: string;
}

export interface SalaryTargetResponse {
    status: number;
    message: string;
    data: SalaryTarget[];
}
