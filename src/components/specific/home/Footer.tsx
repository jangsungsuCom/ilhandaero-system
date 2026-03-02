import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { media } from "../../../styles/breakpoints";
import { PRIVACY_WITH_BR, TERMS_WITH_BR } from "../../../constant/Policy";

type PolicyType = "terms" | "privacy" | null;

const Footer: React.FC = () => {
    const [openPolicy, setOpenPolicy] = useState<PolicyType>(null);
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (openPolicy) {
            dialog.showModal();
        } else if (dialog.open) {
            dialog.close();
        }
    }, [openPolicy]);

    const handleClose = () => {
        if (dialogRef.current?.open) {
            dialogRef.current.close();
        }
        setOpenPolicy(null);
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
        if (e.target === dialogRef.current) {
            handleClose();
        }
    };

    const currentTitle = openPolicy === "terms" ? "이용약관" : "개인정보처리방침";
    const currentContent = openPolicy === "terms" ? TERMS_WITH_BR : PRIVACY_WITH_BR;
    return (
        <>
            <FooterContainer>
                <FooterLeft>
                    <FooterCompanyName>(주)피우다컴퍼니</FooterCompanyName>
                    <FooterText>전라남도 광양시 광장로 112-20, 109동(상가동), 303호 | 대표자: 강미선</FooterText>
                    <FooterText>사업자등록번호: 818-86-03417 | 통신판매업번호: 제 2026-전남광양-0043 호 | 전화번호: 1555-6890</FooterText>
                </FooterLeft>
                <FooterRight>
                    <PolicyButton type="button" onClick={() => setOpenPolicy("terms")}>
                        이용약관
                    </PolicyButton>
                    <Separator>|</Separator>
                    <PolicyButton type="button" onClick={() => setOpenPolicy("privacy")}>
                        개인정보처리방침
                    </PolicyButton>
                </FooterRight>
            </FooterContainer>

            <StyledDialog ref={dialogRef} onClick={handleBackdropClick} onCancel={handleClose}>
                <DialogInner>
                    <DialogHeader>
                        <DialogTitle>{currentTitle}</DialogTitle>
                        <CloseButton type="button" onClick={handleClose}>
                            ×
                        </CloseButton>
                    </DialogHeader>
                    <DialogBody>
                        <ScrollableText dangerouslySetInnerHTML={{ __html: currentContent }} />
                    </DialogBody>
                </DialogInner>
            </StyledDialog>
        </>
    );
};

export default Footer;

const FooterContainer = styled.footer`
    width: 100%;
    height: 230px;
    background-color: #001129;
    padding: 40px 90px;

    display: flex;
    align-items: flex-end;
    justify-content: space-between;

    font-size: 16px;
    letter-spacing: 1px;
    line-height: 1.6;
    color: #ffffff;

    ${media.mobile} {
        flex-direction: column;
        align-items: flex-start;
        height: auto;
        gap: 16px;
        padding: 24px 20px 32px;
        font-size: 14px;
    }
`;

const FooterLeft = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const FooterCompanyName = styled.div`
    font-weight: bold;
`;

const FooterText = styled.div``;

const FooterRight = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;

    ${media.mobile} {
        align-self: flex-end;
    }
`;

const PolicyButton = styled.button`
    padding: 0;
    border: none;
    background: none;
    color: #ffffff;
    font-size: inherit;
    cursor: pointer;
    text-decoration: underline;

    &:hover {
        opacity: 0.85;
    }
`;

const Separator = styled.span`
    opacity: 0.7;
`;

const StyledDialog = styled.dialog`
    margin: auto;
    padding: 0;
    border: none;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    max-width: 90vw;
    width: 880px;

    &::backdrop {
        background: rgba(0, 0, 0, 0.4);
    }

    ${media.mobile} {
        width: calc(100vw - 32px);
        border-radius: 12px;
    }
`;

const DialogInner = styled.div`
    padding: 0;
    display: flex;
    flex-direction: column;
    height: 80vh;
`;

const DialogHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #e8e8e8;
`;

const DialogTitle = styled.h2`
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #1a1a1a;
`;

const CloseButton = styled.button`
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    background: none;
    font-size: 24px;
    line-height: 1;
    color: #666;
    cursor: pointer;
    border-radius: 8px;

    &:hover {
        background: #f0f0f0;
        color: #1a1a1a;
    }
`;

const DialogBody = styled.div`
    padding: 0;
    flex: 1;
`;

const ScrollableText = styled.div`
    padding: 16px 20px;
    max-height: 100%;
    overflow-y: auto;
    font-size: 14px;
    line-height: 1.6;
    color: #333;

    /* 아래 3줄 추가 또는 교체 */
    white-space: pre-line; /* ← pre-wrap 대신 추천 */
    word-break: keep-all; /* 한글 단어 중간 끊김 방지 */
    overflow-wrap: break-word; /* 너무 긴 영문/URL 등은 강제 줄바꿈 */
`;
