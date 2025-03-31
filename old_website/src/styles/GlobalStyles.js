import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  :root {
    --background: #0f0e17;
    --background-alt: #151422;
    --text: #fffffe;
    --text-secondary: #a7a9be;
    --primary: #6c63ff;
    --accent: #4ecdc4;
    --card-bg: #1f1e28;
    --danger: #ff6b6b;
    --success: #2ed573;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: var(--background);
    color: var(--text);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  a {
    text-decoration: none;
    color: var(--primary);
    transition: color 0.3s ease;
  }

  a:hover {
    color: var(--accent);
  }

  button {
    font-family: 'Inter', sans-serif;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: 700;
    line-height: 1.2;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  /* For smooth scrolling */
  html {
    scroll-behavior: smooth;
  }

  /* Making focus styles more accessible */
  :focus {
    outline: 2px dashed var(--primary);
    outline-offset: 3px;
  }

  /* Hide outline for mouse users */
  :focus:not(:focus-visible) {
    outline: none;
  }
`;

export default GlobalStyles;
