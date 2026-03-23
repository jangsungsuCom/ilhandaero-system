import urlAxios from "./urlAxios";
import type { WorkLog, WorkLogResponse, CreateWorkLogRequest } from "../types/workLog";
import type { WorkAmountResponse } from "../types/payment";
import type { WorkerInfoResponse } from "../types/worker";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { getAccessCode } from "./auth";

export const getWorkLogs = async (year: number, month: number, accessCodeParam?: string): Promise<WorkLogResponse> => {
    const accessCode = accessCodeParam || getAccessCode();
    if (!accessCode) {
        throw new Error("Access code not found");
    }

    const startDate = startOfMonth(new Date(year, month, 1));
    const endDate = endOfMonth(new Date(year, month, 1));
    const from = format(startDate, "yyyy-MM-dd");
    const to = format(endDate, "yyyy-MM-dd");

    const response = await urlAxios.get<WorkLogResponse>(`/pud/${accessCode}/work-logs?from=${from}&to=${to}`);
    console.log(response.data);
    return response.data;
};

export const createWorkLog = async (workLog: CreateWorkLogRequest, accessCodeParam?: string): Promise<void> => {
    const accessCode = accessCodeParam || getAccessCode();
    if (!accessCode) {
        throw new Error("Access code not found");
    }

    await urlAxios.post(`/pud/${accessCode}/work-logs`, workLog);
};

export const getWorkAmount = async (accessCodeParam?: string, from?: string, to?: string): Promise<WorkAmountResponse> => {
    const accessCode = accessCodeParam || getAccessCode();
    if (!accessCode) {
        throw new Error("Access code not found");
    }

    const params = from && to ? `?from=${from}&to=${to}` : "";
    const response = await urlAxios.get<WorkAmountResponse>(`/pud/${accessCode}/work-amount${params}`);
    return response.data;
};

export const createAdvanceRequest = async (amount: number, accessCodeParam?: string): Promise<void> => {
    const accessCode = accessCodeParam || getAccessCode();
    if (!accessCode) {
        throw new Error("Access code not found");
    }

    await urlAxios.post(`/pud/${accessCode}/advance-requests`, { amount });
};

export interface AdvanceRequestItem {
    requestId: number;
    amount: number;
    status: string;
    requestDate?: string;
    createdAt?: string;
    requestedAt?: string;
    date?: string;
}

export const getAdvanceRequests = async (accessCodeParam?: string): Promise<AdvanceRequestItem[]> => {
    const accessCode = accessCodeParam || getAccessCode();
    if (!accessCode) {
        throw new Error("Access code not found");
    }

    const response = await urlAxios.get(`/pud/${accessCode}/advance-requests`);
    console.log("getAdvanceRequests raw response:", response.data);
    const raw = response.data;
    if (Array.isArray(raw)) return raw;
    if (raw?.data && Array.isArray(raw.data)) return raw.data;
    if (raw?.data?.content && Array.isArray(raw.data.content)) return raw.data.content;
    return [];
};

export const getWorkerInfo = async (accessCodeParam?: string): Promise<WorkerInfoResponse> => {
    const accessCode = accessCodeParam || getAccessCode();
    if (!accessCode) {
        throw new Error("Access code not found");
    }

    const response = await urlAxios.get<WorkerInfoResponse>(`/pud/${accessCode}`);
    return response.data;
};

export const updateWorkerBankAccount = async (
    bankName: string,
    accountNumber: string,
    accessCodeParam?: string
): Promise<void> => {
    const accessCode = accessCodeParam || getAccessCode();
    if (!accessCode) {
        throw new Error("Access code not found");
    }

    await urlAxios.patch(`/pud/${accessCode}/bank-account`, {
        bankName,
        accountNumber,
    });
};

export const updateWorkLog = async (workLogId: number, workDate: string, startTime: string, endTime: string, accessCodeParam?: string): Promise<void> => {
    const accessCode = accessCodeParam || getAccessCode();
    if (!accessCode) {
        throw new Error("Access code not found");
    }

    await urlAxios.put(`/pud/${accessCode}/work-logs/${workLogId}`, {
        workDate,
        startTime,
        endTime,
    });
};

export const getWorkLogsByDateRange = async (from: string, to: string, accessCodeParam?: string): Promise<WorkLog[]> => {
    const accessCode = accessCodeParam || getAccessCode();
    if (!accessCode) throw new Error("Access code not found");
    const response = await urlAxios.get<WorkLogResponse>(`/pud/${accessCode}/work-logs?from=${from}&to=${to}`);
    return response.data.data || [];
};

export const deleteWorkLogByAccessCode = async (workLogId: number, accessCodeParam?: string): Promise<void> => {
    const accessCode = accessCodeParam || getAccessCode();
    if (!accessCode) {
        throw new Error("Access code not found");
    }

    await urlAxios.delete(`/pud/${accessCode}/work-logs/${workLogId}`);
};
