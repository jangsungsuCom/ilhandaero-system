import urlAxios from "./urlAxios";
import type { MyInfoResponse, MyInfoUpdateRequest } from "../types/user";
import type { ApiSuccessResponse } from "./mypageApi";

/** 응답에서 실제 데이터 추출 (백엔드가 { data } 래핑 또는 직접 객체 반환 모두 처리) */
function unwrapData<T>(res: { data: ApiSuccessResponse<T> | T }): T {
    const body = res.data as ApiSuccessResponse<T> & T;
    if (body && typeof body === "object" && "data" in body && body.data !== undefined) {
        return body.data as T;
    }
    return res.data as T;
}

/** 내 정보 조회/수정 API (이메일 로그인 전용) */
export const userApi = {
    getMyInfo: async (): Promise<MyInfoResponse> => {
        const res = await urlAxios.get<ApiSuccessResponse<MyInfoResponse> | MyInfoResponse>("/users/me");
        return unwrapData(res) as MyInfoResponse;
    },

    updateMyInfo: async (data: MyInfoUpdateRequest): Promise<MyInfoResponse> => {
        const res = await urlAxios.patch<ApiSuccessResponse<MyInfoResponse> | MyInfoResponse>("/users/me", data);
        return unwrapData(res) as MyInfoResponse;
    },
};

export interface AdminUser {
    userId: number;
    email: string;
    name?: string;
    phone?: string;
    role: "USER" | "ADMIN";
    status: "INIT" | "INFO_REGISTERED";
    active: boolean;
}

export const adminUserApi = {
    getUsers: async (): Promise<AdminUser[]> => {
        const res = await urlAxios.get<ApiSuccessResponse<AdminUser[]> | AdminUser[]>("/admin");
        return unwrapData(res) as AdminUser[];
    },

    updateUserActive: async (userId: number, active: boolean): Promise<void> => {
        await urlAxios.put(`/admin/users/${userId}`, { active });
    },
};
