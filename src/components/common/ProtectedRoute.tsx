import { Navigate } from "react-router-dom";
import { getLoginMethod } from "../../utils/auth";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedMethods?: ("email" | "accessCode")[];
}

export default function ProtectedRoute({ children, allowedMethods }: ProtectedRouteProps) {
    const loginMethod = getLoginMethod();

    if (!loginMethod) {
        return <Navigate to="/login" replace />;
    }

    if (allowedMethods && !allowedMethods.includes(loginMethod)) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", gap: "20px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#e57373" }}>권한이 없습니다</h2>
                <p style={{ fontSize: "16px", color: "#666" }}>이 페이지에 접근할 권한이 없습니다.</p>
            </div>
        );
    }

    return <>{children}</>;
}
