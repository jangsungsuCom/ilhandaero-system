import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { getCompanies } from "../../utils/company";
import type { Company } from "../../types/company";

interface CompanyState {
    companies: Company[];
    selectedCompanyId: number | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: CompanyState = {
    companies: [],
    selectedCompanyId: null,
    isLoading: false,
    error: null,
};

export const fetchCompanies = createAsyncThunk("company/fetchCompanies", async (_, { rejectWithValue }) => {
    try {
        const response = await getCompanies();
        return response.data;
    } catch (error: any) {
        return rejectWithValue(error.response?.data?.message || "업장 목록을 불러오는데 실패했습니다.");
    }
});

const companySlice = createSlice({
    name: "company",
    initialState,
    reducers: {
        setSelectedCompany: (state, action: PayloadAction<number | null>) => {
            state.selectedCompanyId = action.payload;
        },
        clearCompanies: (state) => {
            state.companies = [];
            state.selectedCompanyId = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCompanies.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchCompanies.fulfilled, (state, action) => {
                state.isLoading = false;
                state.companies = action.payload;
                // 첫 번째 업장을 자동 선택
                if (action.payload.length > 0 && !state.selectedCompanyId) {
                    state.selectedCompanyId = action.payload[0].companyId;
                }
            })
            .addCase(fetchCompanies.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { setSelectedCompany, clearCompanies } = companySlice.actions;
export default companySlice.reducer;
