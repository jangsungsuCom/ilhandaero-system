import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import BackgroundImage from "../assets/images/home/bg1.png";
import Bg2 from "../assets/images/home/bg2.png";
import LogoImg from "../assets/images/home/Logo.png";
import PaymentButton from "../assets/images/home/PaymentLink.png";
import DownloadButton from "../assets/images/home/download.png";
import Kakao from "../assets/images/home/kakao_logo.png";
import { getLoginMethod, removeAuthToken } from "../utils/auth";
import Footer from "../components/specific/home/Footer";

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <>
            <PageWrapper>
                <BackgroundOverlay />
                <Content>
                    <LeftTopTriangle />
                    <TopNavBar />
                    <PaymentBtnContainer src={PaymentButton} alt="payment" onClick={() => navigate("/work-log")} style={{ cursor: "pointer" }} />
                    <Introduction>
                        <div className="subTitle">사장님은 계산할 필요 없이</div>
                        <div className="title">간편송금</div>
                        <div style={{ height: "72px" }} />
                        <div className="subTitle">알바생은 기다릴 필요 없이</div>
                        <div className="title">선지급 요청</div>
                        <div style={{ height: "48px" }} />
                        <div className="more">{`더 알아보기 >`}</div>
                    </Introduction>
                    <BottomContentsContainer>
                        <div>앱스토어 오픈예정</div>
                        <img src={DownloadButton} alt="download" />
                    </BottomContentsContainer>
                    <RightBotTriangle>
                        <img src={Kakao} style={{ cursor: "pointer" }} />
                    </RightBotTriangle>
                </Content>
            </PageWrapper>

            <img src={Bg2} alt="x" width={"100%"} style={{ marginBottom: 0 }} />
            <Footer />
        </>
    );
};

export default HomePage;

const TopNavBar = () => {
    const navigate = useNavigate();
    const loginMethod = getLoginMethod();
    const isAuthenticated = !!loginMethod;

    const navLinks = [
        { path: "/work-log", name: "기록하기", requiresAuth: true },
        { path: "/payment", name: "결제하기", requiresAuth: true },
        { path: "/advance-payment", name: "선지급 요청", requiresAuth: true },
        { path: "/faq", name: "자주묻는 질문" },
        { path: "/mypage", name: "마이페이지", requiresAuth: true },
        { path: "/login", name: isAuthenticated ? "로그아웃" : "로그인" },
    ];

    const handleNavClick = (link: (typeof navLinks)[0]) => {
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
        <NavContainer>
            <Logo src={LogoImg} alt="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }} />
            {navLinks.map((link) => (
                <NavLink key={link.path} onClick={() => handleNavClick(link)}>
                    {link.name}
                </NavLink>
            ))}
        </NavContainer>
    );
};

const PageWrapper = styled.div`
    width: 100%;
    height: 100vh;
    min-height: 1080px;
    background-color: yellow;
    background-image: url(${BackgroundImage});
    background-size: cover;
    background-position: center;

    position: relative;
`;

const BackgroundOverlay = styled.div`
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.4);
    z-index: 1;
`;
const Content = styled.div`
    position: relative;
    z-index: 2;
    height: 100%;
`;

const LeftTopTriangle = styled.div`
    position: absolute;
    top: 0;
    left: 0;

    width: 0;
    height: 0;

    border-top: 235px solid white;
    border-right: 971px solid transparent;
`;

const RightBotTriangle = styled.div`
    position: absolute;
    bottom: 0;
    right: 0;

    width: 971px;
    height: 235px;

    background: linear-gradient(to right, #92f972, #00ccc7);
    clip-path: polygon(100% 100%, 0 100%, 100% 0);

    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    padding: 20px;
`;

const Logo = styled.img`
    width: 310px;
    margin-right: 358px;
`;

const PaymentBtnContainer = styled.img`
    position: absolute;
    top: 494px;
    left: 1496px;
`;

const NavContainer = styled.div`
    position: absolute;
    top: 0px;
    left: 0px;

    width: 100%;
    height: 235px;
    padding: 0 85px;

    color: white;
    font-size: 21px;

    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const NavLink = styled.div`
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:hover {
        opacity: 0.8;
    }
`;

const BottomContentsContainer = styled.div`
    height: 100%;
    padding: 0 85px 50px 0;
    font-size: 25px;
    font-weight: 500;
    color: white;

    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: end;
    gap: 20px;

    position: absolute;
    bottom: 0;
    left: 86px;
`;

const Introduction = styled.div`
    position: absolute;
    top: 351px;
    left: 94px;
    color: white;

    .title {
        font-size: 73px;
        letter-spacing: 4px;
        line-height: 73px;
        font-weight: bold;
    }
    .subTitle {
        font-size: 49px;
        letter-spacing: 2.45px;
        line-height: 49px;
        margin-bottom: 20px;
    }

    .line {
        width: 48px;
        height: 5px;
        background-color: white;
        margin-bottom: 26px;
    }

    .more {
        font-size: 25px;
        line-height: 25px;
        letter-spacing: 1px;
        color: #14cec5;
        font-weight: 500;
        cursor: pointer;
    }
`;
