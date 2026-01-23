import LogoImg from "../../assets/images/layout/logo.png";
import HeaderBg from "../../assets/images/layout/header.png";
import KakaoLogo from "../../assets/images/layout/kakao_logo.png";
import styled from "styled-components";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getLoginMethod, removeAuthToken } from "../../utils/auth";

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
            navigate("/");
            return;
        }

        navigate(link.path);
    };

    return (
        <BarContainer>
            {navLinks.map((link) => (
                <NavMenu
                    key={link.path}
                    isActive={location.pathname === link.path}
                    onClick={() => handleNavClick(link)}
                >
                    {link.name}
                </NavMenu>
            ))}
        </BarContainer>
    );
};

export default PageLayout;


const LayoutContainer = styled.div`
    min-width: 1600px;
    display: flex;
    flex-direction: column;
    align-items: center; // 핵심
    width: 100%;
    position: relative;
    min-height: 100vh;
`;

const Header = styled.div`
    width: 100%;
    height: 542px;
    margin: 0 auto;
    padding: 54px 98px 0 84px;
    background-image: url(${HeaderBg});
    background-size: cover;
    background-position: center;
`;

const HeaderRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const Logo = styled.img`
    width: 310px;
    object-fit: contain;
`;

const BarContainer = styled.div`
    width: 948px;
    //height: 20px;
    font-size: 21px;

    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const NavMenu = styled.div<{ isActive?: boolean }>`
    cursor: pointer;
    color: ${({ isActive }) => (isActive ? "#000000" : "#ffffff")};
`;

const PageWrapper = styled.div`
    width: auto; // auto면 내부 컨텐츠 따라감
    padding: 80px 70px;
    border-radius: 40px 40px 0 0;
    filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.11));
    background-color: #ffffff;
    margin-top: -300px; // Header 하단 겹치는 효과
    flex: 1;
    min-height: calc(100vh - 242px); // 100vh - (Header 542px - 겹치는 부분 300px)
`;

const KakaoButton = styled.div`
    position: fixed;
    top: 640px;
    right: 70px;
    cursor: pointer;
    > img {
        width: 82px;
        height: 82px;
    }
`;
