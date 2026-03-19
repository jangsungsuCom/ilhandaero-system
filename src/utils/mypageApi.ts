import urlAxios from "./urlAxios";
import type { AxiosError } from "axios";
import type { MyPageCompany, MyPageWorker, MyPageAdvanceRequest, CreateWorkerRequest } from "../types/mypage";
import { getAuthToken } from "./auth";

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
    workDate: string; // "yyyy-MM-dd"
    startTime: string; // "HH:mm"
    endTime: string; // "HH:mm"
}

// 업체(Company) 관련 API
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

// 직원(급여 대상자) 관련 API
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
};

// 근무 내역 (email 유저)
export const createWorkLogForEmail = async (companyId: number, salaryTargetId: number, payload: MypageWorkLogPayload): Promise<void> => {
    await urlAxios.post<ApiSuccessResponse<void>>(`/mypage/companies/${companyId}/salary-targets/${salaryTargetId}/work-logs`, payload);
};

export const updateWorkLogForEmail = async (companyId: number, salaryTargetId: number, workLogId: number, payload: MypageWorkLogPayload): Promise<void> => {
    await urlAxios.put<ApiSuccessResponse<void>>(`/mypage/companies/${companyId}/salary-targets/${salaryTargetId}/work-logs/${workLogId}`, payload);
};

export const deleteWorkLog = async (companyId: number, salaryTargetId: number, workLogId: number): Promise<void> => {
    await urlAxios.delete<ApiSuccessResponse<void>>(`/mypage/companies/${companyId}/salary-targets/${salaryTargetId}/work-logs/${workLogId}`);
};

// 선정산 요청 관련 API
export const mypageAdvanceRequestApi = {
    getAdvanceRequests: async (companyId: number, salaryTargetId: number): Promise<MyPageAdvanceRequest[]> => {
        const res = await urlAxios.get<ApiSuccessResponse<MyPageAdvanceRequest[]>>(`/mypage/companies/${companyId}/salary-targets/${salaryTargetId}/advance-requests`);
        return res.data.data;
    },

    approveAdvanceRequest: async (companyId: number, salaryTargetId: number, requestId: number): Promise<void> => {
        const token = getAuthToken();
        const headers = { Authorization: `Bearer ${token}` };

        // 1단계: approve 요청
        await urlAxios.post<ApiSuccessResponse<void>>(`/mypage/companies/${companyId}/salary-targets/${salaryTargetId}/advance-requests/${requestId}/approve`, {}, { headers });

        // 2단계: pay 요청 (1단계 성공 시)
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
