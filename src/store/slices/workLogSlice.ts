import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getWorkLogs } from "../../utils/workLog";
import type { WorkLog } from "../../types/workLog";

interface WorkLogState {
    workLogsByAccessCode: Record<string, WorkLog[]>;
    isLoading: boolean;
    error: string | null;
}

const initialState: WorkLogState = {
    workLogsByAccessCode: {},
    isLoading: false,
    error: null,
};

export const fetchWorkLogsByAccessCode = createAsyncThunk(
    "workLog/fetchWorkLogsByAccessCode",
    async ({ accessCode, year, month }: { accessCode: string; year: number; month: number }, { rejectWithValue }) => {
        try {
            const response = await getWorkLogs(year, month, accessCode);
            return { accessCode, workLogs: response.data || [] };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "근무기록을 불러오는데 실패했습니다.");
        }
    }
);

const workLogSlice = createSlice({
    name: "workLog",
    initialState,
    reducers: {
        clearWorkLogs: (state) => {
            state.workLogsByAccessCode = {};
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWorkLogsByAccessCode.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchWorkLogsByAccessCode.fulfilled, (state, action) => {
                state.isLoading = false;
                state.workLogsByAccessCode[action.payload.accessCode] = action.payload.workLogs;
            })
            .addCase(fetchWorkLogsByAccessCode.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearWorkLogs } = workLogSlice.actions;
export default workLogSlice.reducer;
