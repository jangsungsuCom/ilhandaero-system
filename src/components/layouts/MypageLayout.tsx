import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { getLoginMethod } from "../../utils/auth";
import { media } from "../../styles/breakpoints";

interface SidebarItem {
    path: string;
    name: string;
    icon?: string;
}

export default function MypageLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const loginMethod = getLoginMethod();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

    const handleMenuClick = (path: string) => {
        navigate(path);
        setIsSidebarOpen(false);
    };

    return (
        <Container>
            <MobileHeader>
                <MobileMenuButton onClick={() => setIsSidebarOpen(!isSidebarOpen)}>☰</MobileMenuButton>
                <MobileTitle>마이페이지</MobileTitle>
            </MobileHeader>
            <Sidebar $isOpen={isSidebarOpen}>
                <SidebarHeader>
                    <SidebarTitle>마이페이지</SidebarTitle>
                </SidebarHeader>
                <SidebarMenu>
                    {sidebarItems.map((item) => {
                        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
                        return (
                            <SidebarMenuItem key={item.path} $isActive={isActive} onClick={() => handleMenuClick(item.path)}>
                                {item.name}
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </Sidebar>
            {isSidebarOpen && <Overlay onClick={() => setIsSidebarOpen(false)} />}
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
    position: relative;

    ${media.tablet} {
        flex-direction: column;
    }
`;

const MobileHeader = styled.div`
    display: none;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: #f9fbfc;
    border-bottom: 1px solid #e0e0e0;

    ${media.tablet} {
        display: flex;
    }
`;

const MobileMenuButton = styled.button`
    width: 40px;
    height: 40px;
    border: none;
    background: #00a8a5;
    color: white;
    font-size: 20px;
    border-radius: 8px;
    cursor: pointer;
`;

const MobileTitle = styled.h2`
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: #00a8a5;
`;

const Sidebar = styled.div<{ $isOpen?: boolean }>`
    width: 280px;
    background: #f9fbfc;
    padding: 40px 0;
    flex-shrink: 0;
    height: 100%;
    min-height: 100vh;
    filter: drop-shadow(2px 0 8px rgba(0, 0, 0, 0.08));

    ${media.desktop} {
        width: 240px;
        padding: 30px 0;
    }

    ${media.tablet} {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 1000;
        width: 280px;
        transform: translateX(${({ $isOpen }) => ($isOpen ? "0" : "-100%")});
        transition: transform 0.3s ease;
    }
`;

const Overlay = styled.div`
    display: none;

    ${media.tablet} {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 999;
    }
`;

const SidebarHeader = styled.div`
    padding: 0 24px 30px 24px;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 20px;

    ${media.desktop} {
        padding: 0 20px 24px 20px;
    }
`;

const SidebarTitle = styled.h2`
    margin: 0;
    font-size: 24px;
    font-weight: 700;
    color: #00a8a5;

    ${media.desktop} {
        font-size: 20px;
    }
`;

const SidebarMenu = styled.nav`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 0 16px;

    ${media.desktop} {
        padding: 0 12px;
    }
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

    ${media.desktop} {
        padding: 14px 16px;
        font-size: 16px;
    }
`;

const MainContent = styled.div`
    flex: 1;
    padding: 40px;
    background: #ffffff;
    min-width: 0;
    width: 100%;
    overflow-x: auto;

    ${media.desktop} {
        padding: 30px;
    }

    ${media.tablet} {
        padding: 24px 20px;
    }

    ${media.mobile} {
        padding: 16px;
    }
`;
