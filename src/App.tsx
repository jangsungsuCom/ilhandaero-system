import "./App.css";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import styled from "styled-components";
import { getLoginMethod } from "./utils/auth";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PageLayout from "./components/layouts/PageLayout";
import WorkLogPage from "./pages/WorkLogPage";
import AdvancePaymentPage from "./pages/AdvancePaymentPage";
import PaymentPage from "./pages/PaymentPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import MypageLayout from "./components/layouts/MypageLayout";
import DashboardPage from "./pages/mypage/DashboardPage";
import StoreFormPage from "./pages/mypage/StoreFormPage";
import WorkerListPage from "./pages/mypage/WorkerListPage";
import WorkerFormPage from "./pages/mypage/WorkerFormPage";
import AdvanceRequestPage from "./pages/mypage/AdvanceRequestPage";
import WorkHistoryPage from "./pages/mypage/WorkHistoryPage";
import FAQPage from "./pages/FAQPage";

function App() {
    const location = useLocation();
    const isHome = location.pathname === "/";
    const routeKey = isHome ? "home" : "layout";

    return (
        <AppContainer>
            <AnimatePresence>
                <Routes location={location} key={routeKey}>
                <Route
                    path="/"
                    element={
                        <motion.div
                            key="home"
                            initial={{ x: "-100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "-100%", opacity: 0 }}
                            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                            style={{ 
                                width: "100%", 
                                minHeight: "100vh", 
                                position: "absolute", 
                                top: 0, 
                                left: 0,
                                backgroundColor: "#ffffff",
                                zIndex: 1
                            }}
                        >
                            <HomePage />
                        </motion.div>
                    }
                />
                <Route
                    element={
                        <motion.div
                            key="layout"
                            initial={{ x: "100%", opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: "100%", opacity: 0 }}
                            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                            style={{ 
                                width: "100%", 
                                minHeight: "100vh", 
                                position: "absolute", 
                                top: 0, 
                                left: 0,
                                backgroundColor: "#ffffff",
                                zIndex: 1
                            }}
                        >
                            <PageLayout />
                        </motion.div>
                    }
                >
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route
                        path="/work-log"
                        element={
                            <ProtectedRoute allowedMethods={["email", "accessCode"]}>
                                <WorkLogPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/advance-payment"
                        element={
                            <ProtectedRoute allowedMethods={["accessCode"]}>
                                <AdvancePaymentPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/payment"
                        element={
                            <ProtectedRoute allowedMethods={["email"]}>
                                <PaymentPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/mypage"
                        element={
                            <ProtectedRoute allowedMethods={["email", "accessCode"]}>
                                <MypageLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route
                            index
                            element={
                                <Navigate
                                    to={
                                        getLoginMethod() === "accessCode"
                                            ? "/mypage/work-history"
                                            : "/mypage/dashboard"
                                    }
                                    replace
                                />
                            }
                        />
                        <Route path="dashboard" element={<DashboardPage />} />
                        <Route path="stores/new" element={<StoreFormPage />} />
                        <Route path="stores/:id/edit" element={<StoreFormPage />} />
                        <Route path="stores/:storeId/workers" element={<WorkerListPage />} />
                        <Route path="stores/:storeId/workers/new" element={<WorkerFormPage />} />
                        <Route path="stores/:storeId/workers/:workerId/edit" element={<WorkerFormPage />} />
                        <Route
                            path="advance-requests"
                            element={
                                <ProtectedRoute allowedMethods={["email"]}>
                                    <AdvanceRequestPage />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="work-history"
                            element={
                                <ProtectedRoute allowedMethods={["accessCode"]}>
                                    <WorkHistoryPage />
                                </ProtectedRoute>
                            }
                        />
                    </Route>
                </Route>
            </Routes>
        </AnimatePresence>
        </AppContainer>
    );
}

const AppContainer = styled.div`
    width: 100%;
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    overflow-y: auto;
    background-color: #ffffff;
`;

export default App;
