import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import styled from "styled-components";
import { getLoginMethod } from "../../utils/auth";

interface SidebarItem {
    path: string;
    name: string;
    icon?: string;
}

export default function MypageLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const loginMethod = getLoginMethod();

    // 로그인하지 않았으면 접근 불가
    if (!loginMethod) {
        return null;
    }

    // accessCode 로그인인 경우 근무내역만 표시
    const sidebarItems: SidebarItem[] =
        loginMethod === "accessCode"
            ? [{ path: "/mypage/work-history", name: "근무내역" }]
            : [
                  { path: "/mypage/dashboard", name: "업장 관리" },
                  { path: "/mypage/advance-requests", name: "선지급 요청" },
              ];

    // 로그인 방법에 따라 접근 불가한 경로로 가면 리다이렉트
    useEffect(() => {
        const currentPath = location.pathname;
        
        if (loginMethod === "accessCode") {
            // accessCode는 work-history만 접근 가능
            if (currentPath !== "/mypage/work-history" && currentPath.startsWith("/mypage/")) {
                navigate("/mypage/work-history", { replace: true });
            }
        } else if (loginMethod === "email") {
            // email은 work-history 접근 불가
            if (currentPath === "/mypage/work-history") {
                navigate("/mypage/dashboard", { replace: true });
            }
        }
    }, [location.pathname, loginMethod, navigate]);

    return (
        <Container>
            <Sidebar>
                <SidebarHeader>
                    <SidebarTitle>마이페이지</SidebarTitle>
                </SidebarHeader>
                <SidebarMenu>
                    {sidebarItems.map((item) => {
                        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
                        return (
                            <SidebarMenuItem key={item.path} $isActive={isActive} onClick={() => navigate(item.path)}>
                                {item.name}
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </Sidebar>
            <MainContent>
                <Outlet />
            </MainContent>
        </Container>
    );
}

const Container = styled.div`
    display: flex;
    width: 100%;
    min-height: 100vh;
    gap: 0;
`;

const Sidebar = styled.div`
    width: 280px;
    background: #f9fbfc;
    padding: 40px 0;
    flex-shrink: 0;
    height: 100%;
    min-height: 100vh;
    filter: drop-shadow(2px 0 8px rgba(0, 0, 0, 0.08));
`;

const SidebarHeader = styled.div`
    padding: 0 24px 30px 24px;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 20px;
`;

const SidebarTitle = styled.h2`
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #00a8a5;
`;

const SidebarMenu = styled.nav`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 16px;
`;

const SidebarMenuItem = styled.div<{ $isActive: boolean }>`
    padding: 16px 20px;
    font-size: 18px;
    font-weight: 600;
    color: ${({ $isActive }) => ($isActive ? "#00a8a5" : "#666")};
    background: ${({ $isActive }) => ($isActive ? "#e0f7f6" : "transparent")};
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background: ${({ $isActive }) => ($isActive ? "#e0f7f6" : "#f0f9f8")};
        color: #00a8a5;
    }
`;

const MainContent = styled.div`
    flex: 1;
    padding: 40px;
    background: #ffffff;
    min-width: 912px;
    width: 100%;
`;
