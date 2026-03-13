import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { getAuthToken, getLoginMethod, removeAuthToken } from "./auth";

const urlAxios: AxiosInstance = axios.create({
    baseURL: "https://ilhandaero.com/api/v1",
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to add auth token
urlAxios.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const loginMethod = getLoginMethod();
        // accessCode 로그인인 경우 token을 사용하지 않음
        if (loginMethod === "email") {
            const token = getAuthToken();
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
urlAxios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            removeAuthToken();
            window.location.href = "/login?session_expired=1";
        }
        return Promise.reject(error);
    }
);

export default urlAxios;
