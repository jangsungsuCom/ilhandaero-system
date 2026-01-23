import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import companyReducer from "./slices/companySlice";
import salaryTargetReducer from "./slices/salaryTargetSlice";
import workLogReducer from "./slices/workLogSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        company: companyReducer,
        salaryTarget: salaryTargetReducer,
        workLog: workLogReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
