import urlAxios from "./urlAxios";
import type { WorkLogResponse, CreateWorkLogRequest } from "../types/workLog";
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

export const getWorkerInfo = async (accessCodeParam?: string): Promise<WorkerInfoResponse> => {
    const accessCode = accessCodeParam || getAccessCode();
    if (!accessCode) {
        throw new Error("Access code not found");
    }

    const response = await urlAxios.get<WorkerInfoResponse>(`/pud/${accessCode}`);
    return response.data;
};

export const updateWorkLog = async (workLogId: number, workDate: string, workedMinutes: number, accessCodeParam?: string): Promise<void> => {
    const accessCode = accessCodeParam || getAccessCode();
    if (!accessCode) {
        throw new Error("Access code not found");
    }

    await urlAxios.put(`/pud/${accessCode}/work-logs/${workLogId}`, {
        workDate,
        workedMinutes,
    });
};
