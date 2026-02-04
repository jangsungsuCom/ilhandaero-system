/** 반응형 브레이크포인트 (1920px 기준 데스크톱 디자인) */
export const breakpoints = {
    /** 모바일 최대 */
    mobile: 767,
    /** 태블릿 최대 */
    tablet: 1023,
    /** 소형 데스크톱 최대 */
    desktop: 1439,
    /** 대형 데스크톱 (1920px 기준 디자인) */
    largeDesktop: 1920,
} as const;

/** 미디어쿼리 헬퍼 */
export const media = {
    mobile: `@media (max-width: ${breakpoints.mobile}px)`,
    tablet: `@media (max-width: ${breakpoints.tablet}px)`,
    desktop: `@media (max-width: ${breakpoints.desktop}px)`,
    largeDesktop: `@media (min-width: ${breakpoints.largeDesktop}px)`,
    /** 태블릿 이상 */
    tabletUp: `@media (min-width: ${breakpoints.mobile + 1}px)`,
    /** 데스크톱 이상 */
    desktopUp: `@media (min-width: ${breakpoints.tablet + 1}px)`,
} as const;
