import type { DeductionType } from "../types/salaryTarget";

export const calculateDeduction = (totalBeforeDeduction: number, deductionType: DeductionType): Record<string, number> => {
    if (deductionType === "THREE_POINT_THREE") {
        return caculateThreePointThree(totalBeforeDeduction);
    } else if (deductionType === "FOUR_INSURANCE") {
        return caculateFourInsurance(totalBeforeDeduction);
    }
    return { total: 0 };
};

const caculateThreePointThree = (amount: number) => {
    const 사업소득세 = Math.floor((amount * 0.03) / 10) * 10;
    const 지방소득세 = Math.floor((amount * 0.003) / 10) * 10;
    return {
        total: 사업소득세 + 지방소득세,
        "사업소득세(3.0%)": 사업소득세,
        "지방소득세(0.3%)": 지방소득세,
    };
};

const caculateFourInsurance = (amount: number) => {
    const 국민연금상한 = 6370000;
    const 국민연금하한 = 400000;
    const 건강보험상한 = 127725730;
    const 건강보험하한 = 280383;

    const 국민연금소득 = Math.floor(Math.max(Math.min(amount, 국민연금상한), 국민연금하한) / 1000) * 1000;
    const 건강보험보수 = Math.max(Math.min(amount, 건강보험상한), 건강보험하한);

    const 국민연금 = Math.floor((국민연금소득 * 0.0475) / 10) * 10;
    const 건강보험 = Math.floor((건강보험보수 * 0.03595) / 10) * 10;
    const 장기요양보험 = Math.floor((건강보험보수 * 0.004724) / 10) * 10;
    const 고용보험 = Math.floor((amount * 0.009) / 10) * 10;

    return {
        total: 국민연금 + 건강보험 + 장기요양보험 + 고용보험,
        "국민연금(4.75%)": 국민연금,
        "건강보험(3.595%)": 건강보험,
        "장기요양보험(0.4724%)": 장기요양보험,
        "고용보험(0.9%)": 고용보험,
    };
};
