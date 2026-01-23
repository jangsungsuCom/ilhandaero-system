import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getSalaryTargets } from "../../utils/salaryTarget";
import type { SalaryTarget } from "../../types/salaryTarget";

interface SalaryTargetState {
    salaryTargetsByCompany: Record<number, SalaryTarget[]>;
    isLoading: boolean;
    error: string | null;
}

const initialState: SalaryTargetState = {
    salaryTargetsByCompany: {},
    isLoading: false,
    error: null,
};

export const fetchSalaryTargets = createAsyncThunk("salaryTarget/fetchSalaryTargets", async (companyId: number, { rejectWithValue }) => {
    try {
        const response = await getSalaryTargets(companyId);
        return { companyId, salaryTargets: response.data };
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || "직원 목록을 불러오는데 실패했습니다.");
    }
});

const salaryTargetSlice = createSlice({
    name: "salaryTarget",
    initialState,
    reducers: {
        clearSalaryTargets: (state) => {
            state.salaryTargetsByCompany = {};
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSalaryTargets.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchSalaryTargets.fulfilled, (state, action) => {
                state.isLoading = false;
                state.salaryTargetsByCompany[action.payload.companyId] = action.payload.salaryTargets;
            })
            .addCase(fetchSalaryTargets.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearSalaryTargets } = salaryTargetSlice.actions;
export default salaryTargetSlice.reducer;
