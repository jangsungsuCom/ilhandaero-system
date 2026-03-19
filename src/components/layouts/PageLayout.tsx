import LogoImg from "../../assets/images/layout/logo2.svg";
import HeaderBg from "../../assets/images/layout/header.png";
import KakaoLogo from "../../assets/images/layout/kakao_logo.png";
import styled from "styled-components";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { getLoginMethod, removeAuthToken } from "../../utils/auth";
import { media } from "../../styles/breakpoints";
import NotificationBell from "../common/NotificationBell";

interface NavLink {
    path: string;
    name: string;
    requiresAuth?: boolean;
}

const PageLayout = () => {
    const navigate = useNavigate();
    const loginMethod = getLoginMethod();

    return (
        <LayoutContainer>
            <Header>
                <HeaderRow>
                    <Logo src={LogoImg} alt="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }} />
                    <RightSection>
                        {(loginMethod === "email" || loginMethod === "accessCode") && <NotificationBell />}
                        <NavBar />
                    </RightSection>
                </HeaderRow>
            </Header>
            <PageWrapper>
                <Outlet />
            </PageWrapper>
            <KakaoButton>
                <img src={KakaoLogo} alt="kakao" />
            </KakaoButton>
        </LayoutContainer>
    );
};

const NavBar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const loginMethod = getLoginMethod();
    const isAuthenticated = !!loginMethod;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks: NavLink[] = [
        { path: "/work-log", name: "기록하기", requiresAuth: true },
        { path: "/payment", name: "결제하기", requiresAuth: true },
        { path: "/advance-payment", name: "선정산 요청", requiresAuth: true },
        { path: "/faq", name: "자주묻는 질문" },
        { path: "/mypage", name: "마이페이지", requiresAuth: true },
        { path: "/login", name: isAuthenticated ? "로그아웃" : "로그인" },
    ];

    const handleNavClick = (link: NavLink) => {
        if (link.requiresAuth && !isAuthenticated) {
            navigate("/login");
            return;
        }

        if (link.path === "/login" && isAuthenticated) {
            removeAuthToken();
            navigate("/login");
            return;
        }

        navigate(link.path);
        setIsMenuOpen(false);
    };

    return (
        <>
            <BarContainer>
                <HamburgerButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <span />
                    <span />
                    <span />
                </HamburgerButton>
                <NavLinksContainer $isOpen={isMenuOpen}>
                    {navLinks.map((link) => (
                        <NavMenu key={link.path} isActive={location.pathname === link.path} onClick={() => handleNavClick(link)}>
                            {link.name}
                        </NavMenu>
                    ))}
                </NavLinksContainer>
            </BarContainer>
            {isMenuOpen && <Overlay onClick={() => setIsMenuOpen(false)} />}
        </>
    );
};

export default PageLayout;

const LayoutContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    position: relative;
    min-height: 100vh;
    min-width: 320px;
`;

const Header = styled.div`
    width: 100%;
    height: 542px;
    margin: 0 auto;
    padding: 4px 98px 0 84px;
    background-image: url(${HeaderBg});
    background-size: cover;
    background-position: center;

    ${media.desktop} {
        height: 420px;
        padding: 0 60px 0 60px;
    }

    ${media.tablet} {
        height: 320px;
        padding: 0 30px 0 30px;
    }

    ${media.mobile} {
        height: 240px;
        padding: 0 16px 0 16px;
    }
`;

const HeaderRow = styled.div`
    margin-top: -5%;
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const Logo = styled.img`
    width: 372px;
    object-fit: contain;

    ${media.desktop} {
        width: 288px;
    }

    ${media.tablet} {
        width: 216px;
    }

    ${media.mobile} {
        width: 168px;
    }
`;

const RightSection = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;

    ${media.mobile} {
        gap: 8px;
    }
`;

const BarContainer = styled.div`
    width: 948px;
    max-width: 100%;
    font-size: 21px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    position: relative;
    margin-right: 5px;

    ${media.desktop} {
        width: 720px;
        font-size: 18px;
    }

    ${media.tablet} {
        width: auto;
        font-size: 14px;
    }

    ${media.mobile} {
        font-size: 14px;
    }
`;

const HamburgerButton = styled.button`
    display: none;
    flex-direction: column;
    justify-content: space-around;
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
    z-index: 1001;

    span {
        width: 28px;
        height: 3px;
        background: white;
        border-radius: 2px;
        transition: all 0.3s linear;
    }

    ${media.tablet} {
        display: flex;
    }
`;

const NavLinksContainer = styled.div<{ $isOpen: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    width: 100%;

    ${media.desktop} {
        gap: 16px;
    }

    ${media.tablet} {
        position: fixed;
        top: 0;
        right: 0;
        height: 100vh;
        width: 280px;
        background-image: url(${HeaderBg});
        background-size: cover;
        background-position: center;
        flex-direction: column;
        justify-content: flex-start;
        padding-top: 100px;
        gap: 24px;
        transform: translateX(${({ $isOpen }) => ($isOpen ? "0" : "100%")});
        transition: transform 0.3s ease-in-out;
        z-index: 1000;
        box-shadow: -4px 0 20px rgba(0, 0, 0, 0.3);
    }

    ${media.mobile} {
        width: 250px;
        padding-top: 80px;
        gap: 20px;
    }
`;

const NavMenu = styled.div<{ isActive?: boolean }>`
    cursor: pointer;
    color: ${({ isActive }) => (isActive ? "#000000" : "#ffffff")};
    transition: opacity 0.2s ease;
    white-space: nowrap;

    &:hover {
        opacity: 0.8;
    }

    ${media.tablet} {
        font-size: 22px;
        padding: 14px 24px;
        width: 100%;
        text-align: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        color: ${({ isActive }) => (isActive ? "#ffffff" : "rgba(255, 255, 255, 0.85)")};

        &:hover {
            background: rgba(255, 255, 255, 0.15);
            color: #ffffff;
        }
    }

    ${media.mobile} {
        font-size: 19px;
        padding: 12px 20px;
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
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
    }
`;

const PageWrapper = styled.div`
    width: auto;
    max-width: 100%;
    padding: 80px 70px;
    border-radius: 40px 40px 0 0;
    filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.11));
    background-color: #ffffff;
    margin-top: -300px;
    flex: 1;
    min-height: calc(100vh - 242px);

    ${media.desktop} {
        padding: 60px 50px;
        margin-top: -200px;
        min-height: calc(100vh - 220px);
    }

    ${media.tablet} {
        padding: 40px 30px;
        margin-top: -140px;
        border-radius: 24px 24px 0 0;
        min-height: calc(100vh - 180px);
    }

    ${media.mobile} {
        width: 100%;
        box-sizing: border-box;
        overflow-x: hidden;
        padding: 24px 16px;
        margin-top: -100px;
        border-radius: 16px 16px 0 0;
        min-height: calc(100vh - 140px);
    }
`;

const KakaoButton = styled.div`
    position: fixed;
    bottom: 40px;
    right: 40px;
    cursor: pointer;
    z-index: 100;
    > img {
        width: 82px;
        height: 82px;
    }

    ${media.tablet} {
        bottom: 24px;
        right: 24px;
        > img {
            width: 64px;
            height: 64px;
        }
    }

    ${media.mobile} {
        bottom: 16px;
        right: 16px;
        > img {
            width: 52px;
            height: 52px;
        }
    }
`;
