import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { FaBars, FaTimes, FaUser, FaSignOutAlt, FaUserCircle, FaPuzzlePiece, FaQuestionCircle, FaRegLightbulb, FaRegCreditCard } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/NextAuthContext';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import styles from './MobileLanguageStyle.module.css';

// Dynamically import components with browser-only APIs
const DynamicLanguageSelector = dynamic(() => import('../i18n/DynamicLanguageSelector'), {
  ssr: false
});

const EnergyBall = dynamic(() => import('../common/EnergyBall'), {
  ssr: false
});

// Import audio utilities dynamically to avoid SSR issues
const playSound = async () => {
  if (typeof window !== 'undefined') {
    const { playLydianMaj7Chord } = await import('../../utils/audioUtils');
    playLydianMaj7Chord();
  }
};

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 3000;
  background-color: ${props => props.$isScrolled || props.$menuOpen ? 'rgba(15, 14, 23, 0.95)' : 'transparent'};
  backdrop-filter: ${props => props.$isScrolled || props.$menuOpen ? 'blur(8px)' : 'none'};
  transition: all 0.3s ease-in-out;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  max-width: 1440px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 15px 20px;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  z-index: 3001;
  position: relative;
`;

const Logo = styled.div`
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: 1px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
  
  /* Add glow effect */
  &:after {
    content: "CymaSphere";
    position: absolute;
    top: 0;
    left: 0;
    z-index: -1;
    filter: blur(15px);
    opacity: 0.5;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const NavLinks = styled.nav`
  display: flex;
  gap: 30px;
  
  @media (max-width: 991px) {
    display: none;
  }
`;

const NavLink = styled.a`
  color: ${props => props.$isActive ? 'white' : 'rgba(255, 255, 255, 0.7)'};
  font-weight: ${props => props.$isActive ? '600' : '500'};
  letter-spacing: 0.3px;
  position: relative;
  transition: color 0.3s ease;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: ${props => props.$isActive ? '100%' : '0'};
    height: 2px;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    transition: width 0.3s ease;
  }
  
  &:hover {
    color: white;
    
    &:after {
      width: 100%;
    }
  }
`;

const AuthSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 3001;
  
  @media (max-width: 991px) {
    display: none;
  }
`;

const MobileActions = styled.div`
  display: none;
  z-index: 3001;
  
  @media (max-width: 991px) {
    display: flex;
    align-items: center;
    gap: 15px;
  }
`;

const MenuToggle = styled.div`
  font-size: 1.5rem;
  cursor: pointer;
  color: white;
  z-index: 3001;
  transition: all 0.3s ease;
  
  &:hover {
    color: var(--primary);
  }
`;

const MobileMenu = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: rgba(10, 10, 15, 0.98);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transform: translateY(${props => props.$isOpen ? '0' : '-100%'});
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 3000;
  backdrop-filter: blur(10px);
  
  /* Add animated background */
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 50%, rgba(108, 99, 255, 0.05) 0%, transparent 70%);
    z-index: -1;
    opacity: ${props => props.$isOpen ? '1' : '0'};
    transition: opacity 0.5s ease;
  }
`;

const MobileNavLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 25px;
  margin-bottom: 40px;
  width: 85%;
  max-width: 300px;
`;

const MobileNavLink = styled.a`
  color: white;
  font-size: 1.3rem;
  font-weight: 500;
  text-align: center;
  padding: 15px;
  border-radius: 12px;
  background: ${props => props.$isActive ? 'rgba(108, 99, 255, 0.15)' : 'transparent'};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    opacity: 0;
    z-index: -1;
    transition: opacity 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-3px);
    
    &:before {
      opacity: 0.1;
    }
  }
`;

const MobileAuthSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 85%;
  max-width: 300px;
`;

const AuthButton = styled.a`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: ${props => props.$isPrimary ? '10px 24px' : '9px 20px'};
  border-radius: 50px;
  font-weight: 600;
  transition: all 0.3s ease;
  letter-spacing: 0.3px;
  
  ${props => props.$isPrimary ? `
    background: linear-gradient(90deg, var(--primary), var(--accent));
    color: white;
    box-shadow: 0 4px 15px rgba(108, 99, 255, 0.3);
    
    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(108, 99, 255, 0.4);
    }
  ` : `
    background: transparent;
    color: white;
    border: 2px solid var(--primary);
    
    &:hover {
      background: rgba(108, 99, 255, 0.1);
    }
  `}
  
  /* For mobile menu */
  ${props => props.$isMobile && `
    padding: 15px 24px;
    width: 100%;
    font-size: 1.1rem;
  `}
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2999;
  opacity: ${props => props.$isVisible ? 1 : 0};
  visibility: ${props => props.$isVisible ? 'visible' : 'hidden'};
  transition: opacity 0.3s ease, visibility 0.3s ease;
  backdrop-filter: blur(3px);
`;

const UserDropdown = styled.div`
  position: relative;
`;

const UserDropdownToggle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 15px;
  border-radius: 50px;
  background: rgba(108, 99, 255, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(108, 99, 255, 0.2);
  }
  
  /* Add subtle glow effect */
  box-shadow: 0 0 15px rgba(108, 99, 255, 0.1);
`;

const UserIcon = styled.div`
  font-size: 1.2rem;
  color: var(--primary);
`;

const UserName = styled.span`
  font-weight: 500;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: calc(100% + 15px);
  right: 0;
  width: 220px;
  background: rgba(30, 30, 40, 0.95);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1);
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: translateY(${props => props.$isOpen ? '0' : '-10px'});
  transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s ease;
  z-index: 3001;
  backdrop-filter: blur(10px);
  
  /* Add subtle gradient border */
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    opacity: 0.5;
  }
`;

const DropdownItem = styled.a`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  color: white;
  transition: all 0.3s ease;
  border-left: 3px solid transparent;
  
  &:hover {
    background: rgba(108, 99, 255, 0.1);
    border-left-color: var(--primary);
  }
  
  ${props => props.$isLogout && `
    color: var(--error);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: rgba(255, 94, 98, 0.1);
      border-left-color: var(--error);
    }
  `}
`;

const DropdownIcon = styled.div`
  font-size: 1.1rem;
  color: ${props => props.$isLogout ? 'var(--error)' : 'var(--primary)'};
  opacity: 0.9;
`;

const DropdownText = styled.span`
  font-weight: 500;
`;

const NextHeader = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef(null);
  
  // Determine if we're on the landing page
  const isLandingPage = router.pathname === "/";
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Set initial scroll state
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [menuOpen]);
  
  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };
  
  const handleLogoClick = () => {
    playSound();
    router.push('/');
  };
  
  // Add navigation handlers that force a refresh
  const handleLoginClick = (e) => {
    e.preventDefault();
    window.location.href = '/login';
  };
  
  const handleSignupClick = (e) => {
    e.preventDefault();
    window.location.href = '/signup';
  };
  
  // Handle navigation with route
  const navItems = [
    { name: t('header.features'), path: '/#features' },
    { name: t('header.howItWorks'), path: '/#how-it-works' },
    { name: t('header.pricing'), path: '/#pricing' },
    { name: t('header.faq'), path: '/#faq' },
    { name: t('header.contact'), path: '/#contact' },
  ];
  
  // Desktop Auth Options
  const renderAuthSection = () => {
    if (currentUser) {
      return (
        <UserDropdown ref={dropdownRef}>
          <UserDropdownToggle onClick={() => setDropdownOpen(!dropdownOpen)}>
            <UserIcon>
              <FaUserCircle />
            </UserIcon>
            <UserName>{currentUser.displayName || currentUser.email}</UserName>
          </UserDropdownToggle>
          
          <DropdownMenu $isOpen={dropdownOpen}>
            <Link href="/dashboard" passHref>
              <DropdownItem>
                <DropdownIcon>
                  <FaPuzzlePiece />
                </DropdownIcon>
                <DropdownText>{t('header.dashboard')}</DropdownText>
              </DropdownItem>
            </Link>
            
            <Link href="/billing" passHref>
              <DropdownItem>
                <DropdownIcon>
                  <FaRegCreditCard />
                </DropdownIcon>
                <DropdownText>{t('header.billing')}</DropdownText>
              </DropdownItem>
            </Link>
            
            <Link href="/faq" passHref>
              <DropdownItem>
                <DropdownIcon>
                  <FaQuestionCircle />
                </DropdownIcon>
                <DropdownText>{t('header.faq')}</DropdownText>
              </DropdownItem>
            </Link>
            
            <Link href="/guides" passHref>
              <DropdownItem>
                <DropdownIcon>
                  <FaRegLightbulb />
                </DropdownIcon>
                <DropdownText>{t('header.guides')}</DropdownText>
              </DropdownItem>
            </Link>
            
            <DropdownItem as="button" onClick={handleLogout} $isLogout>
              <DropdownIcon $isLogout>
                <FaSignOutAlt />
              </DropdownIcon>
              <DropdownText>{t('header.logout')}</DropdownText>
            </DropdownItem>
          </DropdownMenu>
        </UserDropdown>
      );
    }
    
    return (
      <>
        <AuthButton as="a" onClick={handleLoginClick}>{t('header.login')}</AuthButton>
        <AuthButton as="a" $isPrimary onClick={handleSignupClick}>
          {t('header.signUp')}
        </AuthButton>
      </>
    );
  };
  
  return (
    <>
      <HeaderContainer $isScrolled={isScrolled} $menuOpen={menuOpen}>
        <HeaderContent>
          <LogoContainer onClick={handleLogoClick}>
            <Logo>CymaSphere</Logo>
            <EnergyBall size={30} color="rgba(108, 99, 255, 0.7)" />
          </LogoContainer>
          
          <NavLinks>
            {navItems.map((item) => (
              <Link key={item.name} href={item.path} passHref>
                <NavLink $isActive={router.asPath === item.path}>
                  {item.name}
                </NavLink>
              </Link>
            ))}
          </NavLinks>
          
          <AuthSection>
            {renderAuthSection()}
            <div className={styles.mobileWrapper}>
              <DynamicLanguageSelector />
            </div>
          </AuthSection>
          
          <MobileActions>
            <div className={styles.mobileWrapper}>
              <DynamicLanguageSelector />
            </div>
            <MenuToggle onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <FaTimes /> : <FaBars />}
            </MenuToggle>
          </MobileActions>
        </HeaderContent>
      </HeaderContainer>
      
      <MobileMenu $isOpen={menuOpen}>
        <MobileNavLinks>
          {navItems.map((item) => (
            <Link key={item.name} href={item.path} passHref>
              <MobileNavLink 
                $isActive={router.asPath === item.path}
                onClick={() => setMenuOpen(false)}
              >
                {item.name}
              </MobileNavLink>
            </Link>
          ))}
        </MobileNavLinks>
        
        <MobileAuthSection>
          {currentUser ? (
            <>
              <Link href="/dashboard" passHref>
                <AuthButton 
                  $isPrimary 
                  $isMobile
                  onClick={() => setMenuOpen(false)}
                >
                  <FaPuzzlePiece />
                  {t('header.dashboard')}
                </AuthButton>
              </Link>
              <AuthButton 
                $isMobile
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout(e);
                  setMenuOpen(false);
                }}
              >
                <FaSignOutAlt />
                {t('header.logout')}
              </AuthButton>
            </>
          ) : (
            <>
              <AuthButton 
                $isPrimary 
                $isMobile
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/signup';
                }}
              >
                {t('header.signUp')}
              </AuthButton>
              <AuthButton 
                $isMobile
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = '/login';
                }}
              >
                {t('header.login')}
              </AuthButton>
            </>
          )}
        </MobileAuthSection>
      </MobileMenu>
      
      <Overlay 
        $isVisible={menuOpen} 
        onClick={() => setMenuOpen(false)}
      />
    </>
  );
};

export default NextHeader; 