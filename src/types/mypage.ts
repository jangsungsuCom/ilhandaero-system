export interface MyPageCompany {
    companyId: number;
    name: string;
}

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
