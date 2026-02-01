export interface WorkAmountData {
    totalWorkedMinutes: number;
    basePay: number;
    weeklyAllowance: number;
    grossAmount: number;
    totalAdvanced: number;
    available: number;
    maxAdvance: number;
}

export interface WorkAmountResponse {
    status: number;
    message: string;
    data: WorkAmountData;
}
