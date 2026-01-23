export interface WorkAmountData {
    totalEarnedAmount: number;
    totalAdvancedAmount: number;
    availableAmount: number;
    maxAdvanceAmount: number;
}

export interface WorkAmountResponse {
    status: number;
    message: string;
    data: WorkAmountData;
}
