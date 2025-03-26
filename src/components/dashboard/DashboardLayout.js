import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/NextAuthContext';
import { FaTachometerAlt, FaUser, FaCreditCard, FaDownload, FaCog, FaSignOutAlt, FaBars, FaTimes, FaHome, FaArrowLeft } from 'react-icons/fa';
import EnergyBall from '../common/EnergyBall';
import { playLydianMaj7Chord } from '../../utils/audioUtils';
import CymasphereLogo from '../common/CymasphereLogo';
import { motion } from 'framer-motion';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: var(--background);
`;

const Sidebar = styled.aside`
  width: 280px;
  background-color: var(--card-bg);
  color: var(--text);
  padding: 1.5rem 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
  transition: transform 0.3s ease;
  
  @media (max-width: 768px) {
    display: none; /* Hide sidebar completely on mobile */
  }
`;

const MobileOverlay = styled.div`
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 90;
  display: ${props => props.$isOpen ? 'block' : 'none'};
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 2rem;
  margin-bottom: 2rem;
`;

const Logo = styled.a`
  display: flex;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
`;

const LogoText = styled.div`
  display: flex;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 2.5px;
  font-size: 1.4rem;
  color: white;
  
  span {
    font-family: 'Montserrat', sans-serif;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const SidebarNav = styled.nav`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const NavItem = styled.a`
  display: flex;
  align-items: center;
  padding: 1rem 2rem;
  color: ${props => props.$active === "true" ? 'var(--primary)' : 'var(--text-secondary)'};
  font-weight: ${props => props.$active === "true" ? '600' : '400'};
  text-decoration: none;
  transition: all 0.2s ease;
  background-color: ${props => props.$active === "true" ? 'rgba(108, 99, 255, 0.1)' : 'transparent'};
  border-left: 3px solid ${props => props.$active === "true" ? 'var(--primary)' : 'transparent'};
  
  &:hover {
    background-color: rgba(108, 99, 255, 0.05);
    color: var(--text);
  }
  
  svg {
    margin-right: 1rem;
    font-size: 1.2rem;
  }
`;

const Content = styled.main`
  flex: 1;
  padding: 1.5rem;
  margin-left: 280px;
  width: calc(100% - 280px);
  
  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
    padding-top: 70px;
  }
`;

const MobileHeader = styled.header`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: var(--card-bg);
  z-index: 9999;
  padding: 0 20px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  background-color: rgba(15, 14, 23, 0.95);
  
  @media (max-width: 768px) {
    display: flex;
  }
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: var(--text);
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    color: var(--primary);
  }
`;

const MobileLogoContainer = styled.a`
  cursor: pointer;
  text-decoration: none;
`;

const MobileLogo = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  display: flex;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  img {
    height: 30px;
    margin-right: 8px;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const UserName = styled.div`
  flex: 1;
  
  h4 {
    font-size: 0.95rem;
    margin: 0;
    color: var(--text);
  }
  
  p {
    font-size: 0.8rem;
    margin: 0;
    color: var(--text-secondary);
  }
`;

const LogoutButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  
  &:hover {
    color: var(--error);
  }
`;

const BackButton = styled.a`
  position: fixed;
  top: 25px;
  right: 30px;
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 1rem;
  z-index: 1000;
  transition: all 0.3s ease;
  
  &:hover {
    color: var(--text);
  }
  
  svg {
    margin-left: 8px;
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileMenu = styled(motion.div)`
  position: fixed;
  top: 60px;
  left: 0;
  width: 100%;
  height: calc(100vh - 60px);
  z-index: 999;
  padding: 1.5rem 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  background: linear-gradient(165deg, 
    rgba(15, 14, 23, 0.98) 0%,
    rgba(27, 25, 40, 0.98) 50%,
    rgba(35, 32, 52, 0.98) 100%
  );
  backdrop-filter: blur(10px);
  align-items: center;
  
  &::before {
    content: '';
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 50%, rgba(108, 99, 255, 0.15), transparent 50%),
                radial-gradient(circle at 70% 30%, rgba(78, 205, 196, 0.15), transparent 50%);
    z-index: -1;
    pointer-events: none;
  }
`;

const MobileNavItem = styled(motion.a)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px 30px;
  color: ${props => props.$active === "true" ? 'var(--primary)' : 'rgba(255, 255, 255, 0.7)'};
  font-weight: ${props => props.$active === "true" ? '600' : '500'};
  letter-spacing: 0.3px;
  text-decoration: none;
  transition: all 0.3s ease;
  width: 100%;
  cursor: pointer;
  margin: 0.5rem 0;
  position: relative;
  font-size: 1.1rem;
  
  &:hover {
    color: white;
  }
  
  svg {
    margin-right: 1rem;
    font-size: 1.2rem;
  }

  &:after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 20%;
    width: ${props => props.$active === "true" ? '60%' : '0'};
    height: 2px;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    transition: width 0.3s ease;
  }
  
  &:hover:after {
    width: 60%;
  }
`;

const MobileNavTitle = styled.h3`
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 1.5rem;
  padding: 0 2rem;
  text-align: center;
  width: 100%;
`;

const MobileBackButton = styled(MobileNavItem)`
  margin-top: auto;
  color: var(--text-secondary);
  background-color: transparent;
`;

const MobileUserInfo = styled(UserInfo)`
  margin-top: 1rem;
  width: 80%;
  max-width: 400px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  justify-content: center;
`;

// Add page transition animation wrapper
const PageTransition = styled(motion.div)`
  width: 100%;
  height: 100%;
`;

function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout, userDetails } = useAuth();
  const router = useRouter();
  const sidebarRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Set isMounted to true after component has mounted to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const toggleSidebar = () => {
    setSidebarOpen(prevState => !prevState);
  };
  
  const closeSidebar = () => {
    setSidebarOpen(false);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleLogoClick = () => {
    try {
      playLydianMaj7Chord();
    } catch (e) {
      console.log('Audio not available');
    }
    window.location.href = '/dashboard';
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && sidebarOpen) {
        // Do nothing - removed auto-closing behavior
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);
  
  // TEMPORARY: Create mock user data for demo mode
  const demoUserDetails = {
    displayName: 'Demo User',
    email: 'demo@cymasphere.com'
  };
  
  // Return loading state if not mounted yet
  if (!isMounted) {
    return (
      <LayoutContainer>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          Loading...
        </Content>
      </LayoutContainer>
    );
  }
  
  // Use real user data if available, otherwise use demo data
  const displayUserDetails = userDetails || demoUserDetails;
  const displayUser = currentUser || { email: 'demo@cymasphere.com' };
  
  // Animation variants
  const fadeIn = {
    hidden: { 
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };
  
  // Animation variants for menu items
  const menuItemVariants = {
    hidden: { 
      opacity: 0,
      y: 20,
      transition: {
        duration: 0.3,
      }
    },
    visible: i => ({ 
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
        ease: "easeOut"
      }
    })
  };
  
  // Animation variants for smooth page transitions
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 10
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };
  
  // Function to handle navigation with router
  const handleNavigation = (e, path) => {
    e.preventDefault();
    router.push(path);
  };
  
  return (
    <LayoutContainer>
      <Sidebar ref={sidebarRef} $isOpen={sidebarOpen}>
        <LogoContainer>
          <Link href="/dashboard" passHref legacyBehavior>
            <CymasphereLogo 
              size="32px" 
              fontSize="1.4rem" 
              onClick={(e) => handleNavigation(e, '/dashboard')}
            />
          </Link>
        </LogoContainer>
        
        <SidebarNav>
          <Link href="/dashboard" passHref legacyBehavior>
            <NavItem 
              $active={router.pathname === '/dashboard' ? "true" : "false"}
              onClick={(e) => handleNavigation(e, '/dashboard')}
            >
              <FaTachometerAlt /> Dashboard
            </NavItem>
          </Link>
          <Link href="/profile" passHref legacyBehavior>
            <NavItem 
              $active={router.pathname === '/profile' ? "true" : "false"}
              onClick={(e) => handleNavigation(e, '/profile')}
            >
              <FaUser /> Profile
            </NavItem>
          </Link>
          <Link href="/billing" passHref legacyBehavior>
            <NavItem 
              $active={router.pathname === '/billing' ? "true" : "false"}
              onClick={(e) => handleNavigation(e, '/billing')}
            >
              <FaCreditCard /> Billing
            </NavItem>
          </Link>
          <Link href="/downloads" passHref legacyBehavior>
            <NavItem 
              $active={router.pathname === '/downloads' ? "true" : "false"}
              onClick={(e) => handleNavigation(e, '/downloads')}
            >
              <FaDownload /> Downloads
            </NavItem>
          </Link>
          <Link href="/settings" passHref legacyBehavior>
            <NavItem 
              $active={router.pathname === '/settings' ? "true" : "false"}
              onClick={(e) => handleNavigation(e, '/settings')}
            >
              <FaCog /> Settings
            </NavItem>
          </Link>
        </SidebarNav>
        
        <UserInfo>
          <UserName>
            <h4>{displayUserDetails?.displayName || 'Demo User'}</h4>
            <p>{displayUser?.email}</p>
          </UserName>
          <LogoutButton onClick={handleLogout} title="Logout">
            <FaSignOutAlt />
          </LogoutButton>
        </UserInfo>
      </Sidebar>
      
      <MobileOverlay $isOpen={sidebarOpen} />
      
      <MobileHeader>
        <Link href="/dashboard" passHref legacyBehavior>
          <MobileLogoContainer onClick={(e) => handleNavigation(e, '/dashboard')}>
            <CymasphereLogo size="32px" fontSize="1.5rem" />
          </MobileLogoContainer>
        </Link>
        
        <MenuButton onClick={toggleSidebar}>
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </MenuButton>
      </MobileHeader>
      
      {sidebarOpen && (
        <MobileMenu
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <MobileNavTitle>Account</MobileNavTitle>
          
          <Link href="/dashboard" passHref legacyBehavior>
            <MobileNavItem 
              $active={router.pathname === '/dashboard' ? "true" : "false"}
              variants={menuItemVariants}
              custom={0}
              initial="hidden"
              animate="visible"
              onClick={(e) => handleNavigation(e, '/dashboard')}
            >
              <FaTachometerAlt /> Dashboard
            </MobileNavItem>
          </Link>
          
          <Link href="/profile" passHref legacyBehavior>
            <MobileNavItem 
              $active={router.pathname === '/profile' ? "true" : "false"}
              variants={menuItemVariants}
              custom={1}
              initial="hidden"
              animate="visible"
              onClick={(e) => handleNavigation(e, '/profile')}
            >
              <FaUser /> Profile
            </MobileNavItem>
          </Link>
          
          <Link href="/billing" passHref legacyBehavior>
            <MobileNavItem 
              $active={router.pathname === '/billing' ? "true" : "false"}
              variants={menuItemVariants}
              custom={2}
              initial="hidden"
              animate="visible"
              onClick={(e) => handleNavigation(e, '/billing')}
            >
              <FaCreditCard /> Billing
            </MobileNavItem>
          </Link>
          
          <Link href="/downloads" passHref legacyBehavior>
            <MobileNavItem 
              $active={router.pathname === '/downloads' ? "true" : "false"}
              variants={menuItemVariants}
              custom={3}
              initial="hidden"
              animate="visible"
              onClick={(e) => handleNavigation(e, '/downloads')}
            >
              <FaDownload /> Downloads
            </MobileNavItem>
          </Link>
          
          <Link href="/settings" passHref legacyBehavior>
            <MobileNavItem 
              $active={router.pathname === '/settings' ? "true" : "false"}
              variants={menuItemVariants}
              custom={4}
              initial="hidden"
              animate="visible"
              onClick={(e) => handleNavigation(e, '/settings')}
            >
              <FaCog /> Settings
            </MobileNavItem>
          </Link>
          
          <Link href="/" passHref legacyBehavior>
            <MobileNavItem 
              as={MobileBackButton}
              variants={menuItemVariants}
              custom={5}
              initial="hidden"
              animate="visible"
              onClick={(e) => handleNavigation(e, '/')}
            >
              <FaHome /> Back to Home
            </MobileNavItem>
          </Link>
          
          <MobileUserInfo>
            <UserName>
              <h4>{displayUserDetails?.displayName || 'Demo User'}</h4>
              <p>{displayUser?.email}</p>
            </UserName>
            <LogoutButton onClick={handleLogout} title="Logout">
              <FaSignOutAlt />
            </LogoutButton>
          </MobileUserInfo>
        </MobileMenu>
      )}
      
      <BackButton 
        href="/"
        onClick={(e) => handleNavigation(e, '/')}
      >
        Back to Site <FaArrowLeft />
      </BackButton>
      
      <Content>
        <PageTransition
          key={router.pathname}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageVariants}
        >
          {children}
        </PageTransition>
      </Content>
    </LayoutContainer>
  );
}

export default DashboardLayout; 