import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import BackgroundImage from "../assets/images/home/main_photo.svg";
//import Bg2 from "../assets/images/home/bg2.png";
import LogoImg from "../assets/images/layout/logo1.svg";
import PaymentButton from "../assets/images/home/PaymentLink.png";
import DownloadButton from "../assets/images/home/download.png";
import Kakao from "../assets/images/home/kakao_logo.png";
import HeaderBg from "../assets/images/layout/header.png";
import { getLoginMethod, removeAuthToken } from "../utils/auth";
import Footer from "../components/specific/home/Footer";
import { media } from "../styles/breakpoints";

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
                    <IntroTop>
                        <div className="subTitle">사장님은 계산할 필요 없이</div>
                        <div className="title">간편 송금</div>
                    </IntroTop>
                    <IntroBottom>
                        <div className="subTitle">알바생은 기다릴 필요 없이</div>
                        <div className="title">선정산 요청</div>
                        <div style={{ height: "48px" }} />
                        <div className="more">{`더 알아보기 >`}</div>
                    </IntroBottom>
                    <KakaoButtonContainer>
                        <img src={Kakao} style={{ cursor: "pointer" }} />
                    </KakaoButtonContainer>
                    <RightBotTriangle>
                        <AppStoreText>앱스토어 오픈예정</AppStoreText>
                        <img src={DownloadButton} alt="download" />
                    </RightBotTriangle>
                </Content>
            </PageWrapper>

            {/* <img src={Bg2} alt="x" width={"100%"} style={{ marginBottom: 0 }} /> */}
            <Footer />
        </>
    );
};

export default HomePage;

const TopNavBar = () => {
    const navigate = useNavigate();
    const loginMethod = getLoginMethod();
    const isAuthenticated = !!loginMethod;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks = [
        { path: "/work-log", name: "기록하기", requiresAuth: true },
        { path: "/payment", name: "결제하기", requiresAuth: true },
        { path: "/advance-payment", name: "선정산 요청", requiresAuth: true },
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
            removeAuthToken();
            navigate("/login");
            return;
        }

        navigate(link.path);
        setIsMenuOpen(false);
    };

    return (
        <>
            <NavContainer>
                <Logo src={LogoImg} alt="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }} />
                <HamburgerButton onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    <span />
                    <span />
                    <span />
                </HamburgerButton>
                <NavLinksContainer $isOpen={isMenuOpen}>
                    {navLinks.map((link) => (
                        <NavLink key={link.path} onClick={() => handleNavClick(link)}>
                            {link.name}
                        </NavLink>
                    ))}
                </NavLinksContainer>
            </NavContainer>
            {isMenuOpen && <Overlay onClick={() => setIsMenuOpen(false)} />}
        </>
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

    ${media.desktop} {
        min-height: 800px;
    }

    ${media.tablet} {
        min-height: 600px;
    }

    ${media.mobile} {
        min-height: 500px;
    }
`;

const BackgroundOverlay = styled.div`
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.1);
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
    border-top: 285px solid white;
    border-right: 1071px solid transparent;

    ${media.desktop} {
        border-top: 230px solid white;
        border-right: 850px solid transparent;
    }

    ${media.tablet} {
        border-top: 170px solid white;
        border-right: 600px solid transparent;
    }

    ${media.mobile} {
        border-top: 130px solid white;
        border-right: 400px solid transparent;
    }
`;

const RightBotTriangle = styled.div`
    position: absolute;
    bottom: 0;
    right: 0;
    width: 971px;
    height: 235px;
    background: #00ccc7;
    clip-path: polygon(100% 100%, 0 100%, 100% 0);
    display: flex;
    flex-direction: column;
    color: white;
    justify-content: flex-end;
    align-items: flex-end;
    padding: 80px 50px 35px 20px;
    gap: 0.75em;

    ${media.desktop} {
        width: 750px;
        height: 180px;
        padding: 64px 40px 28px 16px;
    }

    ${media.tablet} {
        width: 500px;
        height: 120px;
        padding: 49px 30px 21px 16px;
    }

    ${media.mobile} {
        display: none;
    }

    img {
        ${media.tablet} {
            width: 50px;
            height: 50px;
        }

        ${media.mobile} {
            width: 40px;
            height: 40px;
        }
    }
`;

const AppStoreText = styled.div`
    transform: translate(-10px, 0px);
    font-size: 130%;

    ${media.desktop} {
        transform: translate(-8px, 4px);
    }

    ${media.tablet} {
        transform: translate(-6px, 8px);
    }

    ${media.mobile} {
        transform: translate(-4px, 12px);
    }
`;

const Logo = styled.img`
    width: 435px;
    margin-right: 100px;
    flex-shrink: 0;
    object-fit: contain;
    position: relative;
    left: -40px;
    top: -20px;

    ${media.desktop} {
        width: 325px;
        margin-right: 60px;
        left: -32px;
        top: -16px;
    }

    ${media.tablet} {
        width: 245px;
        margin-right: 30px;
        left: -24px;
        top: -12px;
    }

    ${media.mobile} {
        width: 196px;
        margin-right: 0;
        left: -16px;
        top: -8px;
    }
`;

const PaymentBtnContainer = styled.img`
    position: absolute;
    top: 514px;
    right: 70px;
    width: auto;
    max-width: 300px;

    ${media.desktop} {
        top: 396px;
        right: 36px;
        max-width: 240px;
    }

    ${media.tablet} {
        top: 292px;
        right: 22px;
        max-width: 180px;
    }

    ${media.mobile} {
        top: 77%;
        left: 16px;
        // right: 50%;
        // transform: translate(calc(50% - 110px), -50%);
        max-width: 154px;
    }
`;

const NavContainer = styled.div`
    position: absolute;
    top: 50px;
    left: 0px;
    width: 100%;
    height: 235px;
    padding: 0 85px;
    color: white;
    font-size: 21px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 100px;

    ${media.desktop} {
        height: 180px;
        padding: 0 50px;
        font-size: 18px;
        gap: 60px;
    }

    ${media.tablet} {
        top: 40px;
        height: 120px;
        padding: 0 30px;
        font-size: 14px;
        gap: 40px;
    }

    ${media.mobile} {
        top: 30px;
        height: 80px;
        padding: 0 16px;
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
    gap: 100px;

    ${media.desktop} {
        gap: 60px;
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

const NavLink = styled.div`
    cursor: pointer;
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

        &:hover {
            background: rgba(255, 255, 255, 0.15);
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

const KakaoButtonContainer = styled.div`
    z-index: 3;
    position: absolute;
    bottom: 193px;
    right: 40px;

    img {
        width: 90%;
        height: 90%;
    }

    ${media.mobile} {
        display: none;
    }
`;

const introBase = `
    position: absolute;
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

    .more {
        font-size: 25px;
        line-height: 25px;
        letter-spacing: 1px;
        color: #00ccc7;
        font-weight: 500;
        cursor: pointer;
        position: relative;
        left: 8px;
    }
`;

const IntroTop = styled.div`
    ${introBase}
    top: 33%;

    ${media.desktop} {
        top: 33%;
        left: 50px;
        .title {
            font-size: 56px;
            line-height: 56px;
        }
        .subTitle {
            font-size: 36px;
            line-height: 36px;
            margin-bottom: 16px;
        }
    }

    ${media.tablet} {
        top: 33%;
        left: 30px;
        .title {
            font-size: 40px;
            line-height: 40px;
            letter-spacing: 2px;
        }
        .subTitle {
            font-size: 26px;
            line-height: 26px;
            margin-bottom: 12px;
        }
    }

    ${media.mobile} {
        top: 33%;
        left: 16px;
        .title {
            font-size: 28px;
            line-height: 28px;
            letter-spacing: 1px;
        }
        .subTitle {
            font-size: 18px;
            line-height: 18px;
            margin-bottom: 10px;
        }
    }
`;

const IntroBottom = styled.div`
    ${introBase}
    top: 50%;

    ${media.desktop} {
        top: 50%;
        left: 50px;
        .title {
            font-size: 56px;
            line-height: 56px;
        }
        .subTitle {
            font-size: 36px;
            line-height: 36px;
            margin-bottom: 16px;
        }
        .more {
            font-size: 20px;
        }
    }

    ${media.tablet} {
        top: 50%;
        left: 30px;
        .title {
            font-size: 40px;
            line-height: 40px;
            letter-spacing: 2px;
        }
        .subTitle {
            font-size: 26px;
            line-height: 26px;
            margin-bottom: 12px;
        }
        .more {
            font-size: 16px;
        }
    }

    ${media.mobile} {
        top: 50%;
        left: 16px;
        .title {
            font-size: 28px;
            line-height: 28px;
            letter-spacing: 1px;
        }
        .subTitle {
            font-size: 18px;
            line-height: 18px;
            margin-bottom: 10px;
        }
        .more {
            display: none;
        }
    }
`;
