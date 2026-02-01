export interface MyPageCompany {
    companyId: number;
    name: string;
}

export type DeductionType = "FOUR_INSURANCE" | "THREE_POINT_THREE";

export interface MyPageWorker {
    id: number;
    workerName: string;
    phoneNumber: string;
    hourlyWage: number;
    payDay: number;
    bankName: string;
    accountNumber: string;
    accessCode: string;
    codeStatus: "ACTIVE" | "INACTIVE";
    /** GET 미구현: 없으면 default 사용 */
    weeklyAllowanceEnabled?: boolean;
    deductionType?: DeductionType;
    /** 표시 색상 #RRGGBB */
    colorHex?: string;
}

export interface MyPageAdvanceRequest {
    requestId: number;
    companyId: number;
    salaryTargetId: number;
    workerName: string;
    companyName: string;
    amount?: number;
    requestDate?: string;
    status?: "PENDING" | "APPROVED" | "REJECTED" | "PAID";
    [key: string]: any;
}

export interface CreateWorkerRequest {
    workerName: string;
    phoneNumber: string;
    hourlyWage: number;
    payDay: number;
    bankName: string;
    accountNumber: string;
    weeklyAllowanceEnabled: boolean;
    deductionType: DeductionType;
    /** 표시 색상 #RRGGBB (^#[0-9A-Fa-f]{6}$) */
    colorHex: string;
}

export function getStatusLabel(status?: string): string {
    switch (status) {
        case "PENDING":
            return "대기중";
        case "APPROVED":
            return "승인";
        case "REJECTED":
            return "거절";
        case "PAID":
            return "결제완료";
        default:
            return "대기중";
    }
}
