import urlAxios from "./urlAxios";
import type { CompanyResponse } from "../types/company";

export const getCompanies = async (): Promise<CompanyResponse> => {
    const response = await urlAxios.get<CompanyResponse>("/companies");
    return response.data;
};
