import urlAxios from "./urlAxios";

export interface SalaryPayRequest {
    extraPay: number;
    extraMemo: string;
}

/**
 * POST /owner/companies/{companyId}/salary-targets/{salaryTargetId}/payouts/salary/pay
 * Query: from, to (yyyy-MM-dd)
 * Body: extraPay, extraMemo (추가지급액 관련)
 */
export const postSalaryPay = async (companyId: number, salaryTargetId: number, from: string, to: string, body: SalaryPayRequest) => {
    const response = await urlAxios.post(`/owner/companies/${companyId}/salary-targets/${salaryTargetId}/payouts/salary/pay?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, body);
    return response.data;
};
