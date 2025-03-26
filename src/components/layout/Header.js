import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { FaBars, FaTimes, FaUser, FaSignOutAlt, FaUserCircle, FaPuzzlePiece, FaQuestionCircle, FaRegLightbulb, FaRegCreditCard } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/NextAuthContext';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import styles from './MobileLanguageStyle.module.css';
import { HeaderContainer, LogoContainer } from './HeaderStyles/index';
import Image from 'next/image';

// Define animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

// Dynamically import components for client-side only
const DynamicLanguageSelector = dynamic(() => import('../i18n/DynamicLanguageSelector'), { ssr: false });
const EnergyBall = dynamic(() => import('../common/EnergyBall'), { ssr: false });

// Import audio utilities dynamically to avoid SSR issues
const playSound = async () => {
  if (typeof window !== 'undefined') {
    const { playLydianMaj7Chord } = await import('../../utils/audioUtils');
    playLydianMaj7Chord();
  }
};

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.$isScrolled ? '15px 30px' : '25px 30px'};
  max-width: 1400px;
  margin: 0 auto;
  transition: padding 0.3s ease;
  position: relative;
  z-index: 3500;
  
  @media (max-width: 768px) {
    padding: ${props => props.$isScrolled ? '12px 20px' : '20px 20px'};
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
    display: none;
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

const LoginButton = styled.a`
  color: var(--text);
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 24px;
  font-weight: 500;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--primary);
  }
`;

const SignUpButton = styled.a`
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: white;
  padding: 8px 16px;
  border-radius: 24px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(108, 99, 255, 0.25);
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
  width: 180px;
  display: ${props => props.$isOpen ? 'block' : 'none'};
  z-index: 10;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const UserMenuItem = styled.a`
  display: flex;
  align-items: center;
  padding: 10px 15px;
  color: var(--text);
  text-decoration: none;
  transition: all 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  min-width: 180px;
  font-size: 14px;
  font-weight: normal;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--primary);
  }
  
  svg {
    margin-right: 10px;
    color: var(--text-secondary);
    width: 16px;
    height: 16px;
  }
`;

const UserMenuLogout = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  text-align: left;
  padding: 10px 15px;
  background: transparent;
  border: none;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 180px;
  font-size: 14px;
  font-weight: normal;
  font-family: inherit;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--primary);
  }
  
  svg {
    margin-right: 10px;
    color: var(--danger);
    width: 16px;
    height: 16px;
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

// New fullscreen mobile menu
const MobileMenu = styled(motion.div)`
  display: flex;
  position: fixed;
  top: 70px;
  left: 0;
  width: 100%;
  height: calc(100vh - 70px);
  padding-top: 10px;
  box-sizing: border-box;
  background: linear-gradient(135deg, var(--background), #0a0915);
  z-index: 999;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
  
  @media (max-width: 968px) {
    display: flex;
  }
`;

const MobileMenuContent = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto;
  margin-top: 20px;
  padding: 30px;
  position: relative;
  z-index: 500;
  width: 100%;
  text-align: center;
  
  @media (max-width: 480px) {
    padding: 20px 15px;
    margin-top: 15px;
  }
  
  /* Add extra space for auth buttons at bottom */
  padding-bottom: 60px;
`;

const MobileNavLink = styled(motion.a)`
  color: var(--text);
  text-decoration: none;
  font-size: 2rem;
  font-weight: 500;
  margin: 15px 0;
  padding: 10px;
  text-align: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    margin-right: 12px;
    font-size: 1.75rem;
    color: var(--primary);
  }
  
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    transition: width 0.3s ease;
  }
  
  &:hover {
    color: var(--primary);
    
    &:after {
      width: 80%;
    }
  }
`;

const MobileAuthButtons = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
  margin-left: auto;
  margin-right: auto;
  width: 80%;
  max-width: 300px;
`;

const MobileLoginButton = styled.a`
  color: var(--text);
  text-decoration: none;
  padding: 12px 20px;
  border-radius: 24px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--primary);
  }
`;

const MobileSignUpButton = styled.a`
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: white;
  padding: 12px 20px;
  border-radius: 24px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(108, 99, 255, 0.25);
  }
`;

const MobileUserMenu = styled(motion.div)`
  display: flex;
  flex-direction: column;
  width: 80%;
  max-width: 300px;
  margin-top: 30px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  overflow: hidden;
`;

const MobileUserMenuItem = styled(Link)`
  display: flex;
  align-items: center;
  padding: 18px 20px;
  color: var(--text);
  font-size: 1.2rem;
  text-decoration: none;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--primary);
  }
  
  svg {
    margin-right: 15px;
    font-size: 1.2rem;
    color: var(--text-secondary);
  }
`;

const MobileUserMenuLogout = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  text-align: left;
  padding: 18px 20px;
  background: transparent;
  border: none;
  color: var(--text);
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 107, 107, 0.1);
  }
  
  svg {
    margin-right: 15px;
    font-size: 1.2rem;
    color: var(--danger);
  }
`;

const MobileMenuToggle = styled.button`
  display: none;
  background: transparent;
  border: none;
  color: var(--text);
  font-size: 24px;
  cursor: pointer;
  z-index: 2100;
  width: 40px;
  height: 40px;
  position: relative;
  
  @media (max-width: 968px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const MobileMenuBurger = styled.div`
  width: 24px;
  height: 20px;
  position: relative;
  transform: rotate(0deg);
  transition: .5s ease-in-out;
  
  span {
    display: block;
    position: absolute;
    height: 2px;
    width: 100%;
    background: var(--text);
    border-radius: 9px;
    opacity: 1;
    left: 0;
    transform: rotate(0deg);
    transition: .25s ease-in-out;
    
    &:nth-child(1) {
      top: ${props => props.$isOpen ? '9px' : '0px'};
      transform: ${props => props.$isOpen ? 'rotate(135deg)' : 'rotate(0)'};
    }
    
    &:nth-child(2) {
      top: 9px;
      opacity: ${props => props.$isOpen ? '0' : '1'};
    }
    
    &:nth-child(3) {
      top: ${props => props.$isOpen ? '9px' : '18px'};
      transform: ${props => props.$isOpen ? 'rotate(-135deg)' : 'rotate(0)'};
    }
  }
`;

// Add a background decoration for the mobile menu
const MobileMenuBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
  opacity: 0.6;
  
  &:before {
    content: '';
    position: absolute;
    top: -10%;
    left: -10%;
    right: -10%;
    bottom: -10%;
    background: 
      radial-gradient(circle at 20% 30%, rgba(108, 99, 255, 0.15), transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(78, 205, 196, 0.15), transparent 40%);
    filter: blur(20px);
    transform: translateZ(0);
  }
`;

const FloatingCircle = styled(motion.div)`
  position: absolute;
  border-radius: 50%;
  background: ${props => props.color || 'rgba(108, 99, 255, 0.15)'};
  filter: blur(15px);
  z-index: -1;
`;

const Header = () => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { currentUser, userDetails, logout } = useAuth();
  const router = useRouter();
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
      setUserMenuOpen(false);
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
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
    playSound();
    
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
  
  // Add new navigation functions
  const handleLoginClick = (e) => {
    e.preventDefault();
    window.location.href = '/login';
  };
  
  const handleSignupClick = (e) => {
    e.preventDefault();
    window.location.href = '/signup';
  };
  
  return (
    <HeaderContainer $isScrolled={isScrolled} $menuOpen={isMobileMenuOpen}>
      <HeaderContent $isScrolled={isScrolled}>
        <Link href="/" passHref legacyBehavior>
          <LogoContainer 
            onClick={handleLogoClick}
            title="Click to hear a beautiful Lydian Maj7(9, #11, 13) chord"
            ref={logoRef}
            $menuOpen={isMobileMenuOpen}
          >
            <EnergyBall />
            <LogoText>
              <span>CYMA</span>SPHERE
            </LogoText>
            <RippleContainer>
              {ripples.map(ripple => (
                <Ripple key={ripple.id} style={ripple.style} />
              ))}
            </RippleContainer>
          </LogoContainer>
        </Link>
        
        <MobileMenuToggle onClick={toggleMobileMenu}>
          <MobileMenuBurger $isOpen={isMobileMenuOpen}>
            <span></span>
            <span></span>
            <span></span>
          </MobileMenuBurger>
        </MobileMenuToggle>
        
        {/* Regular desktop navigation */}
        <Nav>
          <NavLink href="#features">{t('header.features', 'Features')}</NavLink>
          <NavLink href="#how-it-works">{t('header.howItWorks', 'How It Works')}</NavLink>
          <NavLink href="#pricing">{t('header.pricing', 'Pricing')}</NavLink>
          <NavLink href="#faq">{t('header.faq', 'FAQ')}</NavLink>
          
          <LanguageSelectorWrapper>
            <DynamicLanguageSelector />
          </LanguageSelectorWrapper>
          
          {currentUser ? (
            <UserMenuContainer className="user-menu">
              <UserButton onClick={toggleUserMenu}>
                <UserAvatar>{getInitials()}</UserAvatar>
              </UserButton>
              <UserDropdown $isOpen={userMenuOpen}>
                <Link href="/dashboard" passHref>
                  <UserMenuItem onClick={(e) => {
                    e.preventDefault();
                    closeUserMenu();
                    window.location.href = '/dashboard';
                  }}>
                    <FaUser /> My Account
                  </UserMenuItem>
                </Link>
                <UserMenuLogout onClick={handleLogout}>
                  <FaSignOutAlt /> Logout
                </UserMenuLogout>
              </UserDropdown>
            </UserMenuContainer>
          ) : (
            <AuthButtons>
              <LoginButton onClick={handleLoginClick}>Login</LoginButton>
              <SignUpButton onClick={handleSignupClick}>Sign Up</SignUpButton>
            </AuthButtons>
          )}
        </Nav>
        
        {/* Fullscreen mobile menu */}
        <MobileMenu 
          $isOpen={isMobileMenuOpen}
          initial="closed"
          animate={isMobileMenuOpen ? "open" : "closed"}
          variants={{
            open: {
              opacity: 1,
              y: 0,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                when: "beforeChildren",
                staggerChildren: 0.05
              }
            },
            closed: {
              opacity: 0,
              y: 50,
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 30,
                when: "afterChildren",
                staggerChildren: 0.05,
                staggerDirection: -1
              }
            }
          }}
        >
          <MobileMenuBackground>
            <FloatingCircle
              color="rgba(108, 99, 255, 0.15)"
              style={{ width: '300px', height: '300px', top: '20%', right: '5%' }}
              animate={{ 
                y: [0, -20, 0],
                x: [0, 10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            />
            <FloatingCircle
              color="rgba(78, 205, 196, 0.15)"
              style={{ width: '250px', height: '250px', bottom: '15%', left: '5%' }}
              animate={{ 
                y: [0, 20, 0],
                x: [0, -10, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            />
            <FloatingCircle
              color="rgba(255, 255, 255, 0.07)"
              style={{ width: '150px', height: '150px', top: '70%', left: '30%' }}
              animate={{ 
                y: [0, -15, 0],
                x: [0, 15, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            />
          </MobileMenuBackground>
          <MobileMenuContent
            variants={{
              open: {
                opacity: 1,
                y: 0,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  when: "beforeChildren",
                  staggerChildren: 0.07
                }
              },
              closed: {
                opacity: 0,
                y: 20,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  when: "afterChildren",
                  staggerChildren: 0.05,
                  staggerDirection: -1
                }
              }
            }}
          >
            {/* Language selector with extreme styling - moved to top */}
            <div 
              className={styles.mobileWrapper} 
              style={{ 
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                padding: '20px',
                margin: '10px 0 30px',
                transform: 'scale(1.3)',
                transformOrigin: 'center center',
                position: 'relative',
                zIndex: 1500
              }}
            >
              <motion.div
                variants={{
                  open: { opacity: 1, y: 0 },
                  closed: { opacity: 0, y: 20 }
                }}
                style={{ display: 'inline-block' }}
              >
                <DynamicLanguageSelector />
              </motion.div>
            </div>
            
            <MobileNavLink 
              href="#features" 
              onClick={toggleMobileMenu}
              variants={{
                open: { opacity: 1, y: 0 },
                closed: { opacity: 0, y: 20 }
              }}
            >
              <FaPuzzlePiece />
              {t('header.features', 'Features')}
            </MobileNavLink>
            
            <MobileNavLink 
              href="#how-it-works" 
              onClick={toggleMobileMenu}
              variants={{
                open: { opacity: 1, y: 0 },
                closed: { opacity: 0, y: 20 }
              }}
            >
              <FaRegLightbulb />
              {t('header.howItWorks', 'How It Works')}
            </MobileNavLink>
            
            <MobileNavLink 
              href="#pricing" 
              onClick={toggleMobileMenu}
              variants={{
                open: { opacity: 1, y: 0 },
                closed: { opacity: 0, y: 20 }
              }}
            >
              <FaRegCreditCard />
              {t('header.pricing', 'Pricing')}
            </MobileNavLink>
            
            <MobileNavLink 
              href="#faq" 
              onClick={toggleMobileMenu}
              variants={{
                open: { opacity: 1, y: 0 },
                closed: { opacity: 0, y: 20 }
              }}
            >
              <FaQuestionCircle />
              {t('header.faq', 'FAQ')}
            </MobileNavLink>
            
            {currentUser ? (
              <MobileUserMenu
                variants={{
                  open: { opacity: 1, y: 0 },
                  closed: { opacity: 0, y: 20 }
                }}
              >
                <MobileUserMenuItem href="/dashboard" onClick={toggleMobileMenu}>
                  <FaUserCircle /> Dashboard
                </MobileUserMenuItem>
                <MobileUserMenuItem href="/profile" onClick={toggleMobileMenu}>
                  <FaUser /> Profile
                </MobileUserMenuItem>
                <MobileUserMenuLogout onClick={() => { handleLogout(); toggleMobileMenu(); }}>
                  <FaSignOutAlt /> Logout
                </MobileUserMenuLogout>
              </MobileUserMenu>
            ) : (
              <MobileAuthButtons variants={fadeIn}>
                <MobileLoginButton onClick={handleLoginClick}>
                  Login
                </MobileLoginButton>
                <MobileSignUpButton onClick={handleSignupClick}>
                  Sign Up
                </MobileSignUpButton>
              </MobileAuthButtons>
            )}
          </MobileMenuContent>
        </MobileMenu>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header; 