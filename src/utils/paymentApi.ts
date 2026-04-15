import urlAxios from "./urlAxios";
import { getAuthToken } from "./auth";
import type { ApiSuccessResponse } from "./mypageApi";

export interface SalaryPayRequest {
    extraPay: number;
    extraMemo: string;
}

export interface SalaryPayoutThreePointThreeDetail {
    businessIncomeTax: number;
    localIncomeTax: number;
}

export interface SalaryPayoutFourInsuranceDetail {
    pensionBase: number;
    pension: number;
    healthBase: number;
    health: number;
    longTermCare: number;
    employment: number;
}

export interface SalaryPayoutDeductionDetail {
    configuredType: string;
    appliedType: string;
    baseAmount: number;
    totalDeduction: number;
    overridden: boolean;
    overrideReason: string;
    threePointThreeDetail?: SalaryPayoutThreePointThreeDetail;
    fourInsuranceDetail?: SalaryPayoutFourInsuranceDetail;
}

export interface SalaryPayout {
    paymentId: number;
    type: string;
    amount: number;
    basePay: number;
    weeklyAllowance: number;
    extraPay: number;
    extraMemo: string;
    deduction: number;
    deductionDetail: SalaryPayoutDeductionDetail;
    periodFrom: string; // yyyy-MM-dd
    periodTo: string; // yyyy-MM-dd
    advanceRequestId: number;
    paidAt: string; // ISO
    workerName?: string;
    birthDate?: string;
    companyName?: string;
}

export interface AccessCodePayment {
    paymentId: number;
    type: string;
    periodFrom: string | null;
    periodTo: string | null;
    amount: number;
    basePay: number;
    weeklyAllowance: number;
    extraPay: number;
    deduction: number;
    paidAt: string;
}

export interface AccessCodePaymentDetail {
    paymentId: number;
    workerName: string;
    birthDate: string;
    bankName: string;
    accountNumber: string;
    type: string;
    periodFrom: string | null;
    periodTo: string | null;
    advanceRequestId: number | null;
    basePay: number;
    weeklyAllowance: number;
    extraPay: number;
    extraMemo: string;
    deduction: number;
    configuredDeductionType?: string;
    appliedDeductionType?: string;
    deductionOverrideReason?: string;
    amount: number;
    paidAt: string;
}

/**
 * POST /owner/companies/{companyId}/salary-targets/{salaryTargetId}/payouts/salary/pay
 * Query: from, to (yyyy-MM-dd)
 * Body: extraPay, extraMemo (추가지급액 관련)
 */
export const postSalaryPay = async (companyId: number, salaryTargetId: number, from: string, to: string, body: SalaryPayRequest) => {
    console.log(body);
    const response = await urlAxios.post(`/owner/companies/${companyId}/salary-targets/${salaryTargetId}/payouts/salary/pay?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, body);
    return response.data;
};

/**
 * GET /owner/companies/{companyId}/salary-targets/{salaryTargetId}/payouts?days={days}
 */
export const getSalaryPayouts = async (companyId: number, salaryTargetId: number, days: number): Promise<SalaryPayout[]> => {
    const token = getAuthToken();
    if (!token) {
        throw new Error("인증 토큰이 없습니다.");
    }

    const headers = { Authorization: `Bearer ${token}` };
    const response = await urlAxios.get<ApiSuccessResponse<SalaryPayout[]>>(`/owner/companies/${companyId}/salary-targets/${salaryTargetId}/payouts?days=${encodeURIComponent(days)}`, { headers });
    console.log(response.data);

    return response.data.data;
};

/**
 * GET /owner/companies/{companyId}/salary-targets/{salaryTargetId}/payouts/{paymentId}/payslip
 */
export const getPayslip = async (companyId: number, salaryTargetId: number, paymentId: number): Promise<SalaryPayout> => {
    const token = getAuthToken();
    if (!token) {
        throw new Error("인증 토큰이 없습니다.");
    }

    const headers = { Authorization: `Bearer ${token}` };
    const response = await urlAxios.get<ApiSuccessResponse<SalaryPayout>>(
        `/owner/companies/${companyId}/salary-targets/${salaryTargetId}/payouts/${paymentId}/payslip`,
        { headers }
    );

    return response.data.data;
};

/**
 * GET /access-codes/{accessCode}/payments?startDate={yyyy-MM-dd}&endDate={yyyy-MM-dd}
 */
export const getAccessCodePayments = async (accessCode: string, startDate: string, endDate: string): Promise<AccessCodePayment[]> => {
    if (!accessCode) {
        throw new Error("접근 코드가 없습니다.");
    }

    const response = await urlAxios.get<ApiSuccessResponse<AccessCodePayment[]>>(
        `/access-codes/${encodeURIComponent(accessCode)}/payments?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`
    );
    return response.data.data || [];
};

/**
 * GET /access-codes/{accessCode}/payments/{paymentId}/payslip
 */
export const getAccessCodePayslip = async (accessCode: string, paymentId: number): Promise<SalaryPayout> => {
    if (!accessCode) {
        throw new Error("접근 코드가 없습니다.");
    }

    const response = await urlAxios.get<ApiSuccessResponse<SalaryPayout>>(
        `/access-codes/${encodeURIComponent(accessCode)}/payments/${paymentId}/payslip`
    );
    return response.data.data;
};

/**
 * GET /access-codes/{accessCode}/payments/{paymentId}
 */
export const getAccessCodePaymentDetail = async (accessCode: string, paymentId: number): Promise<AccessCodePaymentDetail> => {
    if (!accessCode) {
        throw new Error("접근 코드가 없습니다.");
    }

    const response = await urlAxios.get<ApiSuccessResponse<AccessCodePaymentDetail>>(
        `/access-codes/${encodeURIComponent(accessCode)}/payments/${encodeURIComponent(String(paymentId))}`
    );
    return response.data.data;
};
