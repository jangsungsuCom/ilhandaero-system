import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { saveAuthToken as saveToken, removeAuthToken, getLoginMethod, saveAccessCode } from "../../utils/auth";
import type { LoginMethod } from "../../types/auth";

interface AuthState {
    accessToken: string | null;
    loginMethod: LoginMethod | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    accessToken: getLoginMethod() === "email" ? localStorage.getItem("accessToken") : null,
    loginMethod: getLoginMethod(),
    isAuthenticated: !!localStorage.getItem("accessToken") || !!localStorage.getItem("accessCode"),
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setAccessToken: (state, action: PayloadAction<{ token: string; method: LoginMethod }>) => {
            state.accessToken = action.payload.token;
            state.loginMethod = action.payload.method;
            state.isAuthenticated = true;
            saveToken(action.payload.token, action.payload.method);
        },
        setAccessCode: (state, action: PayloadAction<string>) => {
            state.loginMethod = "accessCode";
            state.isAuthenticated = true;
            saveToken(undefined, "accessCode");
            saveAccessCode(action.payload);
        },
        logout: (state) => {
            state.accessToken = null;
            state.loginMethod = null;
            state.isAuthenticated = false;
            removeAuthToken();
        },
    },
});

export const { setAccessToken, setAccessCode, logout } = authSlice.actions;
export default authSlice.reducer;
