import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaTachometerAlt, FaUser, FaCreditCard, FaDownload, FaCog, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import EnergyBall from '../common/EnergyBall';
import { playLydianMaj7Chord } from '../../utils/audioUtils';

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
    transform: translateX(${props => props.isOpen ? '0' : '-100%'});
  }
`;

const MobileOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 90;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1.5rem;
  margin-bottom: 2rem;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--text);
  font-weight: 700;
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
  font-size: 1.4rem;
  
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

const NavItem = styled(Link)`
  padding: 0.85rem 1.5rem;
  color: ${props => props.active === "true" ? 'var(--primary)' : 'var(--text-secondary)'};
  display: flex;
  align-items: center;
  text-decoration: none;
  transition: all 0.2s ease;
  background-color: ${props => props.active === "true" ? 'rgba(108, 99, 255, 0.1)' : 'transparent'};
  border-left: 4px solid ${props => props.active === "true" ? 'var(--primary)' : 'transparent'};
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--text);
    text-decoration: none;
  }
  
  svg {
    margin-right: 0.75rem;
    font-size: 1.1rem;
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
  z-index: 80;
  padding: 0 1rem;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
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
`;

const MobileLogo = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: flex;
  align-items: center;
  
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

function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, logout, userDetails } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef(null);
  
  const toggleSidebar = () => {
    setSidebarOpen(prevState => !prevState);
  };
  
  const closeSidebar = () => {
    setSidebarOpen(false);
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleLogoClick = () => {
    try {
      playLydianMaj7Chord();
    } catch (e) {
      console.log('Audio not available');
    }
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) && sidebarOpen) {
        closeSidebar();
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
  
  // Use real user data if available, otherwise use demo data
  const displayUserDetails = userDetails || demoUserDetails;
  const displayUser = currentUser || { email: 'demo@cymasphere.com' };
  
  return (
    <LayoutContainer>
      <Sidebar ref={sidebarRef} isOpen={sidebarOpen}>
        <LogoContainer>
          <Logo to="/dashboard" onClick={handleLogoClick}>
            <EnergyBall size="35px" marginRight="12px" />
            <LogoText>
              <span>CYMA</span>SPHERE
            </LogoText>
          </Logo>
        </LogoContainer>
        
        <SidebarNav>
          <NavItem to="/dashboard" active={location.pathname === '/dashboard' ? "true" : "false"}>
            <FaTachometerAlt /> Dashboard
          </NavItem>
          <NavItem to="/profile" active={location.pathname === '/profile' ? "true" : "false"}>
            <FaUser /> Profile
          </NavItem>
          <NavItem to="/billing" active={location.pathname === '/billing' ? "true" : "false"}>
            <FaCreditCard /> Billing
          </NavItem>
          <NavItem to="/downloads" active={location.pathname === '/downloads' ? "true" : "false"}>
            <FaDownload /> Downloads
          </NavItem>
          <NavItem to="/settings" active={location.pathname === '/settings' ? "true" : "false"}>
            <FaCog /> Settings
          </NavItem>
        </SidebarNav>
        
        <UserInfo>
          <UserName>
            <h4>{displayUserDetails?.displayName || 'Demo User'}</h4>
            <p>{displayUser?.email}</p>
          </UserName>
          {currentUser ? (
            <LogoutButton onClick={handleLogout} title="Logout">
              <FaSignOutAlt />
            </LogoutButton>
          ) : (
            <LogoutButton onClick={() => navigate('/login')} title="Login">
              <FaSignOutAlt />
            </LogoutButton>
          )}
        </UserInfo>
      </Sidebar>
      
      <MobileOverlay isOpen={sidebarOpen} onClick={closeSidebar} />
      
      <MobileHeader>
        <MenuButton onClick={toggleSidebar}>
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </MenuButton>
        <MobileLogo>
          <EnergyBall size="30px" marginRight="8px" />
          CYMASPHERE
        </MobileLogo>
      </MobileHeader>
      
      <Content>
        {children}
      </Content>
    </LayoutContainer>
  );
}

export default DashboardLayout; 