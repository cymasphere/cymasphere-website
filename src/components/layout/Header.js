import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaBars, FaTimes, FaUser, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../i18n/LanguageSelector';
import EnergyBall from '../common/EnergyBall';
import { playLydianMaj7Chord } from '../../utils/audioUtils';

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: ${props => props.$isScrolled ? 'rgba(15, 14, 23, 0.95)' : 'transparent'};
  backdrop-filter: ${props => props.$isScrolled ? 'blur(8px)' : 'none'};
  transition: all 0.3s ease-in-out;
  box-shadow: ${props => props.$isScrolled ? '0 5px 20px rgba(0, 0, 0, 0.2)' : 'none'};
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.$isScrolled ? '15px 30px' : '25px 30px'};
  max-width: 1400px;
  margin: 0 auto;
  transition: padding 0.3s ease;
  
  @media (max-width: 768px) {
    padding: ${props => props.$isScrolled ? '12px 20px' : '20px 20px'};
  }
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--text);
  font-weight: 700;
  font-size: 1.8rem;
  cursor: pointer;
  position: relative;
  overflow: visible;
  
  &:hover {
    text-decoration: none;
  }
`;

const LogoText = styled.div`
  display: flex;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 2.5px;
  
  span {
    font-family: 'Montserrat', sans-serif;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  
  @media (max-width: 968px) {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    width: 280px;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    padding-top: 80px;
    background-color: var(--background-alt);
    transform: ${props => props.$isOpen ? 'translateX(0)' : 'translateX(100%)'};
    transition: transform 0.3s ease;
    box-shadow: ${props => props.$isOpen ? '-10px 0 30px rgba(0, 0, 0, 0.3)' : 'none'};
    z-index: 10;
  }
`;

const NavLink = styled.a`
  margin: 0 15px;
  color: var(--text);
  text-decoration: none !important;
  font-weight: 500;
  position: relative;
  transition: color 0.3s ease;
  
  &:hover {
    color: var(--primary);
    text-decoration: none !important;
  }
  
  &:after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    transition: width 0.3s ease;
  }
  
  &:hover:after {
    width: 100%;
  }
  
  @media (max-width: 968px) {
    margin: 15px 30px;
    font-size: 1.1rem;
  }
`;

const ActionButton = styled.a`
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: white;
  padding: 10px 20px;
  border-radius: 24px;
  font-weight: 500;
  margin-left: 15px;
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 5px 15px rgba(108, 99, 255, 0.4);
    transform: translateY(-2px);
    color: white;
  }
  
  @media (max-width: 968px) {
    margin: 20px 30px;
  }
`;

const MenuToggle = styled.button`
  display: none;
  background: none;
  border: none;
  color: var(--text);
  font-size: 24px;
  cursor: pointer;
  z-index: 20;
  
  @media (max-width: 968px) {
    display: block;
  }
`;

const MobileNavOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: ${props => props.$isOpen ? 'block' : 'none'};
  z-index: 5;
`;

const LanguageSelectorWrapper = styled.div`
  margin: 0 20px;
  
  @media (max-width: 1024px) {
    margin: 15px 0;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: var(--text);
  font-size: 24px;
  cursor: pointer;
  z-index: 20;
  
  @media (max-width: 968px) {
    display: block;
  }
`;

const AuthButtons = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin-left: 15px;
  
  @media (max-width: 968px) {
    margin: 20px 30px;
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    width: 100%;
  }
`;

const LoginButton = styled(Link)`
  color: var(--text);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 24px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--primary);
  }
`;

const SignUpButton = styled(Link)`
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: white;
  padding: 8px 16px;
  border-radius: 24px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 5px 15px rgba(108, 99, 255, 0.4);
    transform: translateY(-2px);
    color: white;
  }
`;

const UserMenuContainer = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: var(--text);
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  svg {
    font-size: 20px;
  }
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 14px;
`;

const UserDropdown = styled.div`
  position: absolute;
  top: 45px;
  right: 0;
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  padding: 10px 0;
  min-width: 180px;
  display: ${props => props.$isOpen ? 'block' : 'none'};
  z-index: 10;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const UserMenuItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: 10px 15px;
  color: var(--text);
  text-decoration: none;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--primary);
  }
  
  svg {
    margin-right: 10px;
    color: var(--text-secondary);
  }
`;

const UserMenuLogout = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  text-align: left;
  padding: 10px 15px;
  background: transparent;
  border: none;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 107, 107, 0.1);
  }
  
  svg {
    margin-right: 10px;
    color: var(--danger);
  }
`;

// New styled components for the ripple effect
const RippleContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
`;

const Ripple = styled.div`
  position: absolute;
  border-radius: 50%;
  transform: scale(0);
  background: linear-gradient(90deg, rgba(108, 99, 255, 0.15), rgba(0, 255, 255, 0.1));
  animation: ripple-animation 1s ease-out forwards;
  pointer-events: none;
  
  @keyframes ripple-animation {
    to {
      transform: scale(6);
      opacity: 0;
    }
  }
`;

const Header = () => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { currentUser, userDetails, logout } = useAuth();
  const navigate = useNavigate();
  const [ripples, setRipples] = useState([]);
  const logoRef = useRef(null);
  
  const handleScroll = () => {
    if (window.scrollY > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    
    // Prevent scrolling when mobile menu is open
    if (!isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setUserMenuOpen(false);
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };
  
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };
  
  const closeUserMenu = () => {
    setUserMenuOpen(false);
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.user-menu')) {
        closeUserMenu();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);
  
  const getInitials = () => {
    if (userDetails?.displayName) {
      return userDetails.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return currentUser?.email?.substring(0, 2).toUpperCase() || 'U';
  };
  
  // Updated function to handle the ripple effect
  const handleLogoClick = (e) => {
    // Prevent default only if we're already on the home page
    if (window.location.pathname === '/') {
      e.preventDefault();
    }
    
    // Play the chord
    playLydianMaj7Chord();
    
    // Create ripple effect
    const logoRect = logoRef.current.getBoundingClientRect();
    const size = Math.max(logoRect.width, logoRect.height) * 0.6; // Smaller initial size for more dramatic expansion
    
    // Calculate position relative to the logo
    const x = e.clientX - logoRect.left - size / 2;
    const y = e.clientY - logoRect.top - size / 2;
    
    // Generate a unique ID for this ripple
    const rippleId = Date.now();
    
    // Add new ripple to the array
    const newRipple = {
      id: rippleId,
      style: {
        top: y,
        left: x,
        width: size,
        height: size
      }
    };
    
    setRipples(prevRipples => [...prevRipples, newRipple]);
    
    // Remove the ripple from state after animation completes
    setTimeout(() => {
      setRipples(prevRipples => prevRipples.filter(ripple => ripple.id !== rippleId));
    }, 1000); // Match animation duration
  };
  
  return (
    <HeaderContainer $isScrolled={isScrolled}>
      <HeaderContent $isScrolled={isScrolled}>
        <Logo 
          to="/" 
          onClick={handleLogoClick}
          title="Click to hear a beautiful Lydian Maj7(9, #11, 13) chord"
          ref={logoRef}
        >
          <EnergyBall marginRight="15px" />
          <LogoText>
            <span>CYMA</span>SPHERE
          </LogoText>
          <RippleContainer>
            {ripples.map(ripple => (
              <Ripple key={ripple.id} style={ripple.style} />
            ))}
          </RippleContainer>
        </Logo>
        
        <MenuToggle onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </MenuToggle>
        
        <MobileNavOverlay $isOpen={isMobileMenuOpen} onClick={toggleMobileMenu} />
        
        <Nav $isOpen={isMobileMenuOpen}>
          <NavLink href="#features">{t('header.features', 'Features')}</NavLink>
          <NavLink href="#how-it-works">{t('header.howItWorks', 'How It Works')}</NavLink>
          <NavLink href="#pricing">{t('header.pricing', 'Pricing')}</NavLink>
          <NavLink href="#faq">{t('header.faq', 'FAQ')}</NavLink>
          
          <LanguageSelectorWrapper>
            <LanguageSelector />
          </LanguageSelectorWrapper>
          
          {currentUser ? (
            <UserMenuContainer className="user-menu">
              <UserButton onClick={toggleUserMenu}>
                <UserAvatar>{getInitials()}</UserAvatar>
              </UserButton>
              <UserDropdown $isOpen={userMenuOpen}>
                <UserMenuItem to="/dashboard" onClick={closeUserMenu}>
                  <FaUserCircle /> Dashboard
                </UserMenuItem>
                <UserMenuItem to="/profile" onClick={closeUserMenu}>
                  <FaUser /> Profile
                </UserMenuItem>
                <UserMenuLogout onClick={handleLogout}>
                  <FaSignOutAlt /> Logout
                </UserMenuLogout>
              </UserDropdown>
            </UserMenuContainer>
          ) : (
            <AuthButtons>
              <LoginButton to="/login">Login</LoginButton>
              <SignUpButton to="/signup">Sign Up</SignUpButton>
            </AuthButtons>
          )}
        </Nav>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header; 