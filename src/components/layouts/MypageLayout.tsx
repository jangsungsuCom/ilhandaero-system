import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import styled from "styled-components";
import { getLoginMethod } from "../../utils/auth";
import { media } from "../../styles/breakpoints";
import { mypageTitle } from "../../styles/mypageTypography";

interface MenuItem {
    path: string;
    name: string;
}

export default function MypageLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const loginMethod = getLoginMethod();

    if (!loginMethod) {
        return null;
    }

    const menuItems: MenuItem[] =
        loginMethod === "accessCode"
            ? [{ path: "/mypage/work-history", name: "근무내역" }]
            : [
                  { path: "/mypage/dashboard", name: "업장 관리" },
                  { path: "/mypage/advance-requests", name: "선정산 요청" },
                  { path: "/mypage/profile", name: "회원 정보 수정" },
              ];

    useEffect(() => {
        const currentPath = location.pathname;

        if (loginMethod === "accessCode") {
            if (currentPath !== "/mypage/work-history" && currentPath.startsWith("/mypage/")) {
                navigate("/mypage/work-history", { replace: true });
            }
        } else if (loginMethod === "email") {
            if (currentPath === "/mypage/work-history") {
                navigate("/mypage/dashboard", { replace: true });
            }
        }
    }, [location.pathname, loginMethod, navigate]);

    return (
        <Container>
            <TopHeader>
                <TopTitle>마이페이지</TopTitle>
                <MenuBar>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
                        return (
                            <MenuTab key={item.path} $isActive={isActive} onClick={() => navigate(item.path)}>
                                {item.name}
                            </MenuTab>
                        );
                    })}
                </MenuBar>
            </TopHeader>
            <MainContent>
                <Outlet />
            </MainContent>
        </Container>
    );
}

const Container = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
`;

const TopHeader = styled.div`
    background: #ffffff;
    border-bottom: 1px solid #e0e0e0;
    padding: 30px 40px 0;

    ${media.desktop} {
        padding: 24px 30px 0;
    }

    ${media.tablet} {
        padding: 20px 20px 0;
    }

    ${media.mobile} {
        padding: 16px 16px 0;
    }
`;

const TopTitle = styled.h2`
    ${mypageTitle}
    margin: 0 0 20px;
    font-weight: 700;
    color: #00ccc7;

    ${media.desktop} {
        margin-bottom: 16px;
    }

    ${media.mobile} {
        margin-bottom: 12px;
    }
`;

const MenuBar = styled.nav`
    display: flex;
    justify-content: center;
    gap: 0;
`;

const MenuTab = styled.div<{ $isActive: boolean }>`
    padding: 12px 24px;
    font-size: 18px;
    font-weight: 600;
    color: ${({ $isActive }) => ($isActive ? "#00ccc7" : "#888")};
    background: transparent;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;

    &:hover {
        color: #00ccc7;
    }

    ${media.desktop} {
        padding: 10px 20px;
    }

    ${media.mobile} {
        padding: 10px 14px;
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
