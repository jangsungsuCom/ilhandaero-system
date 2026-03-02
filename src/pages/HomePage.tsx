import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import BackgroundImage from "../assets/images/home/bg1.png";
//import Bg2 from "../assets/images/home/bg2.png";
import LogoImg from "../assets/images/layout/logo1.svg";
import PaymentButton from "../assets/images/home/PaymentLink.png";
import DownloadButton from "../assets/images/home/download.png";
import Kakao from "../assets/images/home/kakao_logo.png";
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
                    <Introduction>
                        <div className="subTitle">사장님은 계산할 필요 없이</div>
                        <div className="title">간편송금</div>
                        <div style={{ height: "72px" }} />
                        <div className="subTitle">알바생은 기다릴 필요 없이</div>
                        <div className="title">선지급 요청</div>
                        <div style={{ height: "48px" }} />
                        <div className="more">{`더 알아보기 >`}</div>
                    </Introduction>
                    <KakaoButtonContainer>
                        <img src={Kakao} style={{ cursor: "pointer" }} />
                    </KakaoButtonContainer>
                    <RightBotTriangle>
                        <div>앱스토어 오픈예정</div>
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
            navigate("/login");
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

    ${media.desktop} {
        border-top: 180px solid white;
        border-right: 750px solid transparent;
    }

    ${media.tablet} {
        border-top: 120px solid white;
        border-right: 500px solid transparent;
    }

    ${media.mobile} {
        border-top: 80px solid white;
        border-right: 300px solid transparent;
    }
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
    flex-direction: column;
    color: white;
    justify-content: flex-end;
    align-items: flex-end;
    padding: 20px;

    ${media.desktop} {
        width: 750px;
        height: 180px;
    }

    ${media.tablet} {
        width: 500px;
        height: 120px;
        padding: 16px;
    }

    ${media.mobile} {
        width: 300px;
        height: 80px;
        padding: 12px;
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

const Logo = styled.img`
    width: 320px;
    margin-right: 358px;
    flex-shrink: 0;
    object-fit: contain;

    ${media.desktop} {
        width: 240px;
        margin-right: 60px;
    }

    ${media.tablet} {
        width: 180px;
        margin-right: 30px;
    }

    ${media.mobile} {
        width: 120px;
        margin-right: 0;
    }
`;

const PaymentBtnContainer = styled.img`
    position: absolute;
    top: 494px;
    right: 100px;
    width: auto;
    max-width: 300px;

    ${media.desktop} {
        top: 380px;
        right: 60px;
        max-width: 240px;
    }

    ${media.tablet} {
        top: 280px;
        right: 40px;
        max-width: 180px;
    }

    ${media.mobile} {
        display: none;
    }
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
    gap: 16px;

    ${media.desktop} {
        height: 180px;
        padding: 0 50px;
        font-size: 18px;
    }

    ${media.tablet} {
        height: 120px;
        padding: 0 30px;
        font-size: 14px;
        gap: 12px;
    }

    ${media.mobile} {
        height: 80px;
        padding: 0 16px;
        font-size: 11px;
        gap: 6px;
        flex-wrap: wrap;
        justify-content: flex-start;
    }
`;

const NavLink = styled.div`
    cursor: pointer;
    transition: opacity 0.2s ease;
    white-space: nowrap;

    &:hover {
        opacity: 0.8;
    }
`;

const KakaoButtonContainer = styled.div`
    z-index: 3;
    position: absolute;
    bottom: 240px;
    right: 40px;

    // ${media.desktop} {
    //     padding: 0 50px 40px 0;
    //     font-size: 20px;
    //     left: 50px;
    // }

    // ${media.tablet} {
    //     padding: 0 30px 30px 0;
    //     font-size: 16px;
    //     left: 30px;
    //     gap: 12px;
    // }

    // ${media.mobile} {
    //     padding: 0 16px 20px 0;
    //     font-size: 12px;
    //     left: 16px;
    //     gap: 8px;

    //     img {
    //         width: 100px;
    //     }
    // }
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

    ${media.desktop} {
        top: 260px;
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
        top: 180px;
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
        top: 110px;
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
            font-size: 14px;
        }
    }
`;
