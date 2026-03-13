import { css } from "styled-components";
import { media } from "./breakpoints";

/** 마이페이지 제목 (페이지 타이틀) */
export const mypageTitle = css`
    font-size: 32px;

    ${media.tablet} {
        font-size: 24px;
    }

    ${media.mobile} {
        font-size: 20px;
    }
`;

/** 마이페이지 부제목 (섹션/카드 타이틀) */
export const mypageSubtitle = css`
    font-size: 20px;

    ${media.tablet} {
        font-size: 18px;
    }

    ${media.mobile} {
        font-size: 16px;
    }
`;

/** 마이페이지 내용 (본문, 테이블, 라벨 등) */
export const mypageContent = css`
    font-size: 16px;

    ${media.tablet} {
        font-size: 14px;
    }

    ${media.mobile} {
        font-size: 14px;
    }
`;
