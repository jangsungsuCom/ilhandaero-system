/** 서버 공제 세부 (3.3% 또는 4대보험 등) - 플랫 표시용 */
export interface DeductionDetail {
    [key: string]: number;
}

/** 3.3% 공제 세부 (API WorkAmountResponse.threePointThree) */
export interface ThreePointThreeDetail {
    businessIncomeTax?: number;
    localIncomeTax?: number;
}

/** 4대보험 공제 세부 (API WorkAmountResponse.fourInsurance) */
export interface FourInsuranceDetail {
    pensionBase?: number;
    pension?: number;
    healthBase?: number;
    health?: number;
    longTermCare?: number;
    employment?: number;
}

export interface WorkAmountData {
    totalWorkedMinutes: number;
    basePay: number;
    weeklyAllowance: number;
    grossAmount: number;
    /** 전체 공제액 (서버) */
    deduction?: number;
    /** 공제 방식 */
    deductionType?: "FOUR_INSURANCE" | "THREE_POINT_THREE";
    /** 3.3% 공제 세부 (서버) */
    threePointThree?: ThreePointThreeDetail;
    /** 4대보험 공제 세부 (서버) */
    fourInsurance?: FourInsuranceDetail;
    /** 공제 후 금액 (서버) = gross - deduction */
    netAfterDeduction?: number;
    /** 기간 내 선지급액 (서버) */
    totalAdvancedInPeriod?: number;
    /** 선정산 누적 (서버에서 totalAdvanced 또는 totalAdvancedInPeriod로 올 수 있음) */
    totalAdvanced?: number;
    available: number;
    maxAdvance: number;
}

export interface WorkAmountResponse {
    status: number;
    message: string;
    data: WorkAmountData;
}
