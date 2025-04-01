import styled from 'styled-components';

export const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 3000;
  background-color: ${props => props.$isScrolled || props.$menuOpen ? 'rgba(15, 14, 23, 0.95)' : 'transparent'};
  backdrop-filter: ${props => props.$isScrolled || props.$menuOpen ? 'blur(8px)' : 'none'};
  transition: all 0.3s ease-in-out;
  box-shadow: ${props => props.$isScrolled || props.$menuOpen ? '0 5px 20px rgba(0, 0, 0, 0.2)' : 'none'};
`;

export const LogoContainer = styled.a`
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
  
  ${props => props.$menuOpen && `
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