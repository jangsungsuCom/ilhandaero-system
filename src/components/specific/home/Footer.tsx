import styled from "styled-components";

const Footer = () => {
    return (
        <FooterContainer>
            <div style={{ fontWeight: "bold" }}>(주)피우다컴퍼니</div>
            <div>전라남도 광양시 광장로 112-20, 109동(상가동) | 대표자: 강미선</div>
            <div>사업자등록번호: 818-86-03417 | 전화번호: 1555-6890 </div>
        </FooterContainer>
    );
};
export default Footer;

const FooterContainer = styled.div`
    width: 100%;
    height: 230px;
    background-color: #001129;
    padding-left: 90px;

    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: center;

    font-size: 20px;
    letter-spacing: 1px;
    line-height: 38px;
    color: #ffffff;
`;
