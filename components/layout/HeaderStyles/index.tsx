/**
 * @fileoverview Header Style Components
 * @module components/layout/HeaderStyles
 * 
 * Reusable styled components for header styling. Provides consistent
 * header container and logo container styles that can be used across
 * different header implementations.
 * 
 * @example
 * // Using HeaderContainer
 * <HeaderContainer $isScrolled={true} $menuOpen={false}>
 *   <HeaderContent />
 * </HeaderContainer>
 * 
 * @example
 * // Using LogoContainer
 * <LogoContainer $menuOpen={false}>
 *   <Logo />
 * </LogoContainer>
 */

import styled from "styled-components";

/**
 * @brief Props for HeaderContainer styled component
 */
interface HeaderContainerProps {
  /** @param {boolean} [isScrolled] - Whether the page has been scrolled */
  $isScrolled?: boolean;
  /** @param {boolean} [menuOpen] - Whether the mobile menu is open */
  $menuOpen?: boolean;
}

/**
 * @brief HeaderContainer styled component
 * 
 * Fixed header container with dynamic background and backdrop blur based on
 * scroll state and menu open state. Includes smooth transitions and shadow effects.
 * 
 * @note Position is fixed at top of viewport
 * @note Z-index is 3000 to stay above most content
 * @note Background becomes more opaque when scrolled or menu is open
 * @note Backdrop blur is applied when scrolled or menu is open
 */
export const HeaderContainer = styled.header<HeaderContainerProps>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 3000;
  background-color: ${(props) =>
    props.$isScrolled || props.$menuOpen
      ? "rgba(15, 14, 23, 0.95)"
      : "transparent"};
  backdrop-filter: ${(props) =>
    props.$isScrolled || props.$menuOpen ? "blur(8px)" : "none"};
  transition: all 0.3s ease-in-out;
  box-shadow: ${(props) =>
    props.$isScrolled || props.$menuOpen
      ? "0 5px 20px rgba(0, 0, 0, 0.2)"
      : "none"};
`;

/**
 * @brief Props for LogoContainer styled component
 */
interface LogoContainerProps {
  /** @param {boolean} [menuOpen] - Whether the mobile menu is open */
  $menuOpen?: boolean;
}

/**
 * @brief LogoContainer styled component
 * 
 * Container for the logo with hover effects and optional glow effect when
 * menu is open. Includes responsive sizing for mobile devices.
 * 
 * @note Includes drop shadow effect when menu is open
 * @note Logo image height is 40px on desktop, 32px on mobile
 * @note Smooth transitions for all interactive states
 */
export const LogoContainer = styled.a<LogoContainerProps>`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 1.8rem;
  cursor: pointer;
  position: relative;
  overflow: visible;
  transition: all 0.3s ease;

  ${(props) =>
    props.$menuOpen &&
    `
    filter: drop-shadow(0 0 8px rgba(108, 99, 255, 0.6));
  `}

  &:hover {
    text-decoration: none;
  }

  img {
    height: 40px;
    width: auto;
    margin-right: 10px;
  }

  @media (max-width: 768px) {
    img {
      height: 32px;
    }
  }
`;
