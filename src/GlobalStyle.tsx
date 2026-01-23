import { createGlobalStyle } from "styled-components";

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: "Noto Sans KR", -apple-system, BlinkMacSystemFont,
      "Segoe UI", Roboto, "Apple SD Gothic Neo",
      "Noto Sans KR", "Malgun Gothic", Arial, sans-serif;
  }
`;

export default GlobalStyle;
