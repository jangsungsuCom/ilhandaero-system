/** 카카오톡/카카오스토리 인앱 브라우저 여부 */
export function isKakaoInAppBrowser(): boolean {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    return /KAKAOTALK|KAKAO/i.test(ua);
}

/** 네이버 앱 인앱 브라우저 여부 */
export function isNaverInAppBrowser(): boolean {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    return /NAVER\(inapp|NAVER\/\d/i.test(ua);
}

/** 카카오/네이버 등 인앱 브라우저 여부 (렌더링 대응용) */
export function isInAppBrowser(): boolean {
    return isKakaoInAppBrowser() || isNaverInAppBrowser();
}
