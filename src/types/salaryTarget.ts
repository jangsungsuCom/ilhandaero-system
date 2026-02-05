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
    codeStatus: "ACTIVE" | "INACTIVE";
    /** 주휴수당 활성화 여부 */
    weeklyAllowanceEnabled?: boolean;
    /** 공제 유형 */
    deductionType?: DeductionType;
    /** 표시 색상 #RRGGBB */
    colorHex?: string;
}

export interface SalaryTargetResponse {
    status: number;
    message: string;
    data: SalaryTarget[];
}
