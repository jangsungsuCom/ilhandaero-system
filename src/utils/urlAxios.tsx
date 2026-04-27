import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { getAuthToken, getLoginMethod, removeAuthToken } from "./auth";

const urlAxios: AxiosInstance = axios.create({
    baseURL: "https://ilhandaero.com/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
});

urlAxios.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const loginMethod = getLoginMethod();

        if (loginMethod === "email") {
            const token = getAuthToken();
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

urlAxios.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message;

        if (typeof message === "string" && message.includes("블랙리스트에 등록된 급여 대상자입니다")) {
            error.response.data.originalMessage = message;
            error.response.data.message = "다시 시도해주세요.";
        }

        if (error.response?.status === 401) {
            removeAuthToken();
            window.location.href = "/login?session_expired=1";
        }

        return Promise.reject(error);
    }
);

export default urlAxios;
