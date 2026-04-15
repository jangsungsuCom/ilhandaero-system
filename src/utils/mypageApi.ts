import type { AxiosError } from "axios";
import type { CreateWorkerRequest, MyPageAdvanceRequest, MyPageCompany, MyPageWorker } from "../types/mypage";
import { getAuthToken } from "./auth";
import urlAxios from "./urlAxios";

export interface ApiErrorResponse {
    data: null;
    message: string;
    status: number;
}

export interface ApiSuccessResponse<T> {
    data: T;
    message: string;
    status: number;
}

export interface MypageWorkLogPayload {
    workDate: string;
    startTime: string;
    endTime: string;
}

export const mypageCompaniesApi = {
    getCompanies: async (): Promise<MyPageCompany[]> => {
        const res = await urlAxios.get<ApiSuccessResponse<MyPageCompany[]>>("/companies");
        return res.data.data;
    },

    createCompany: async (data: { name: string }): Promise<void> => {
        await urlAxios.post<ApiSuccessResponse<void>>("/companies", data);
    },

    updateCompany: async (companyId: number, data: { name: string }): Promise<MyPageCompany> => {
        const res = await urlAxios.put<ApiSuccessResponse<MyPageCompany>>(`/companies/${companyId}`, data);
        return res.data.data;
    },

    deleteCompany: async (companyId: number): Promise<void> => {
        await urlAxios.delete<ApiSuccessResponse<void>>(`/companies/${companyId}`);
    },
};

export const mypageWorkerApi = {
    getWorkers: async (companyId: number): Promise<MyPageWorker[]> => {
        const res = await urlAxios.get<ApiSuccessResponse<MyPageWorker[]>>(`/mypage/companies/${companyId}/salary-targets`);
        return res.data.data;
    },

    createWorker: async (companyId: number, data: CreateWorkerRequest): Promise<void> => {
        await urlAxios.post<ApiSuccessResponse<void>>(`/mypage/companies/${companyId}/salary-targets`, data);
    },

    updateWorker: async (companyId: number, salaryTargetId: number, data: CreateWorkerRequest): Promise<void> => {
        await urlAxios.put<ApiSuccessResponse<void>>(`/mypage/companies/${companyId}/salary-targets/${salaryTargetId}`, data);
    },

    blacklistWorker: async (companyId: number, salaryTargetId: number): Promise<void> => {
        await urlAxios.post<ApiSuccessResponse<void>>(`/mypage/companies/${companyId}/salary-targets/${salaryTargetId}/blacklist`);
    },

    unblacklistWorker: async (companyId: number, salaryTargetId: number): Promise<void> => {
        await urlAxios.delete<ApiSuccessResponse<void>>(`/mypage/companies/${companyId}/salary-targets/${salaryTargetId}/blacklist`);
    },

    deleteWorker: async (companyId: number, salaryTargetId: number): Promise<void> => {
        await urlAxios.delete<ApiSuccessResponse<void>>(`/mypage/companies/${companyId}/salary-targets/${salaryTargetId}`);
    },
};

export const createWorkLogForEmail = async (companyId: number, salaryTargetId: number, payload: MypageWorkLogPayload): Promise<void> => {
    await urlAxios.post<ApiSuccessResponse<void>>(`/mypage/companies/${companyId}/salary-targets/${salaryTargetId}/work-logs`, payload);
};

export const updateWorkLogForEmail = async (companyId: number, salaryTargetId: number, workLogId: number, payload: MypageWorkLogPayload): Promise<void> => {
    await urlAxios.put<ApiSuccessResponse<void>>(`/mypage/companies/${companyId}/salary-targets/${salaryTargetId}/work-logs/${workLogId}`, payload);
};

export const deleteWorkLog = async (companyId: number, salaryTargetId: number, workLogId: number): Promise<void> => {
    await urlAxios.delete<ApiSuccessResponse<void>>(`/mypage/companies/${companyId}/salary-targets/${salaryTargetId}/work-logs/${workLogId}`);
};

export const mypageAdvanceRequestApi = {
    getAdvanceRequests: async (companyId: number, salaryTargetId: number): Promise<MyPageAdvanceRequest[]> => {
        const res = await urlAxios.get<ApiSuccessResponse<MyPageAdvanceRequest[]>>(`/mypage/companies/${companyId}/salary-targets/${salaryTargetId}/advance-requests`);
        return res.data.data;
    },

    approveAdvanceRequest: async (companyId: number, salaryTargetId: number, requestId: number): Promise<void> => {
        const token = getAuthToken();
        const headers = { Authorization: `Bearer ${token}` };

        await urlAxios.post<ApiSuccessResponse<void>>(`/mypage/companies/${companyId}/salary-targets/${salaryTargetId}/advance-requests/${requestId}/approve`, {}, { headers });
        await urlAxios.post<ApiSuccessResponse<void>>(`/owner/companies/${companyId}/salary-targets/${salaryTargetId}/payouts/advance-requests/${requestId}/pay`, {}, { headers });
    },

    rejectAdvanceRequest: async (companyId: number, salaryTargetId: number, requestId: number): Promise<void> => {
        await urlAxios.post<ApiSuccessResponse<void>>(`/mypage/companies/${companyId}/salary-targets/${salaryTargetId}/advance-requests/${requestId}/reject`);
    },
};

export function extractErrorMessage(error: unknown): string {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    return axiosError.response?.data?.message || "오류가 발생했습니다.";
}
