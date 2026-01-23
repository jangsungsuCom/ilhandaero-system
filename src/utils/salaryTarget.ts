import urlAxios from "./urlAxios";
import type { SalaryTargetResponse } from "../types/salaryTarget";

export const getSalaryTargets = async (companyId: number): Promise<SalaryTargetResponse> => {
    const response = await urlAxios.get<SalaryTargetResponse>(`/mypage/companies/${companyId}/salary-targets`);
    return response.data;
};
