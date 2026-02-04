import LogoImg from "../../assets/images/layout/logo2.svg";
import HeaderBg from "../../assets/images/layout/header.png";
import KakaoLogo from "../../assets/images/layout/kakao_logo.png";
import styled from "styled-components";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getLoginMethod, removeAuthToken } from "../../utils/auth";
import { media } from "../../styles/breakpoints";

interface NavLink {
    path: string;
    name: string;
    requiresAuth?: boolean;
}

const PageLayout = () => {
    const navigate = useNavigate();

    return (
        <LayoutContainer>
            <Header>
                <HeaderRow>
                    <Logo src={LogoImg} alt="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }} />
                    <NavBar />
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

    const navLinks: NavLink[] = [
        { path: "/work-log", name: "기록하기", requiresAuth: true },
        { path: "/payment", name: "결제하기", requiresAuth: true },
        { path: "/advance-payment", name: "선지급 요청", requiresAuth: true },
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
            // Handle logout
            removeAuthToken();
            navigate("/login");
            return;
        }

        navigate(link.path);
    };

    return (
        <BarContainer>
            {navLinks.map((link) => (
                <NavMenu key={link.path} isActive={location.pathname === link.path} onClick={() => handleNavClick(link)}>
                    {link.name}
                </NavMenu>
            ))}
        </BarContainer>
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
    padding: 54px 98px 0 84px;
    background-image: url(${HeaderBg});
    background-size: cover;
    background-position: center;

    ${media.desktop} {
        height: 420px;
        padding: 40px 60px 0 60px;
    }

    ${media.tablet} {
        height: 320px;
        padding: 30px 30px 0 30px;
    }

    ${media.mobile} {
        height: 240px;
        padding: 20px 16px 0 16px;
    }
`;

const HeaderRow = styled.div`
    margin-top: -5%;
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const Logo = styled.img`
    width: 310px;
    object-fit: contain;

    ${media.desktop} {
        width: 240px;
    }

    ${media.tablet} {
        width: 180px;
    }

    ${media.mobile} {
        width: 140px;
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

    ${media.desktop} {
        width: 720px;
        font-size: 18px;
    }

    ${media.tablet} {
        width: auto;
        font-size: 14px;
        gap: 12px;
    }

    ${media.mobile} {
        font-size: 12px;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
    }
`;

const NavMenu = styled.div<{ isActive?: boolean }>`
    cursor: pointer;
    color: ${({ isActive }) => (isActive ? "#000000" : "#ffffff")};
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
