import urlAxios from "./urlAxios";
import type { EmailLoginRequest, EmailLoginResponse, RegisterRequest, RegisterResponse } from "../types/auth";
import { format, startOfMonth, endOfMonth } from "date-fns";
import type { WorkLogResponse } from "../types/workLog";

export const loginWithEmail = async (credentials: EmailLoginRequest): Promise<EmailLoginResponse> => {
    const response = await urlAxios.post<EmailLoginResponse>("/auth/login", credentials);
    return response.data;
};

export const registerWithEmail = async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await urlAxios.post<RegisterResponse>("/auth/signup", data);
    return response.data;
};
/**
 * accessCode 유효성 검증 (로그인 시 사용)
 * 현재 달의 첫 날과 끝 날로 API 호출하여 유효성 확인
 */
export const validateAccessCode = async (accessCode: string): Promise<void> => {
    const now = new Date();
    const startDate = startOfMonth(now);
    const endDate = endOfMonth(now);
    const from = format(startDate, "yyyy-MM-dd");
    const to = format(endDate, "yyyy-MM-dd");

    await urlAxios.get<WorkLogResponse>(`/pud/${accessCode}/work-logs`, {
        params: { from, to },
    });
};

export const saveAuthToken = (token: string | undefined, loginMethod: "email" | "accessCode"): void => {
    if (token) {
        localStorage.setItem("accessToken", token);
    }
    localStorage.setItem("loginMethod", loginMethod);
};

export const getAuthToken = (): string | null => {
    return localStorage.getItem("accessToken");
};

export const getLoginMethod = (): "email" | "accessCode" | null => {
    return localStorage.getItem("loginMethod") as "email" | "accessCode" | null;
};

export const getAccessCode = (): string | null => {
    return localStorage.getItem("accessCode");
};

export const saveAccessCode = (accessCode: string): void => {
    localStorage.setItem("accessCode", accessCode);
};

export const removeAuthToken = (): void => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("loginMethod");
    localStorage.removeItem("accessCode");
};
