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
