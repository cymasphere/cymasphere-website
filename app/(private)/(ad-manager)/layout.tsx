"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaChartLine,
  FaUsers,
  FaBullhorn,
  FaCog,
  FaHome,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import LoadingComponent from "@/components/common/LoadingComponent";
import CymasphereLogo from "@/components/common/CymasphereLogo";

interface AdManagerLayoutProps {
  children: React.ReactNode;
}

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: var(--bg);
`;

const Sidebar = styled(motion.aside)<{ $isOpen: boolean }>`
  width: 280px;
  background: linear-gradient(135deg, var(--card-bg) 0%, rgba(255, 255, 255, 0.02) 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  z-index: 1000;
  overflow-y: auto;

  @media (max-width: 768px) {
    transform: translateX(${props => props.$isOpen ? '0' : '-100%'});
    transition: transform 0.3s ease;
  }
`;

const LogoContainer = styled.div`
  padding: 2rem 1.5rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const NavItem = styled.a<{ $active: string }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  color: ${props => props.$active === "true" ? "var(--primary)" : "var(--text-secondary)"};
  text-decoration: none;
  transition: all 0.3s ease;
  border-left: 3px solid ${props => props.$active === "true" ? "var(--primary)" : "transparent"};
  background-color: ${props => props.$active === "true" ? "rgba(108, 99, 255, 0.1)" : "transparent"};

  &:hover {
    color: var(--primary);
    background-color: rgba(108, 99, 255, 0.05);
    border-left-color: var(--primary);
  }

  svg {
    font-size: 1.1rem;
    flex-shrink: 0;
  }
`;

const UserInfo = styled.div`
  margin-top: auto;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const UserName = styled.div`
  margin-bottom: 1rem;

  h4 {
    color: var(--text);
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
  }

  p {
    color: var(--text-secondary);
    margin: 0;
    font-size: 0.85rem;
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text);
  }
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 280px;
  min-height: 100vh;

  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const MobileOverlay = styled.div<{ $isOpen: boolean }>`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: ${props => props.$isOpen ? 1 : 0};
  pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
  transition: opacity 0.3s ease;

  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileHeader = styled.header`
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--card-bg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;

  @media (max-width: 768px) {
    display: flex;
  }
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: var(--text);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

const MobileLogoContent = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
`;

export default function AdManagerLayout({ children }: AdManagerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Check if user has ad manager access
  useEffect(() => {
    if (user && !user.can_access_ad_manager) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const user_display_name = useMemo(() => {
    if (user?.profile?.first_name && user?.profile?.last_name) {
      return `${user.profile.first_name} ${user.profile.last_name}`;
    } else if (user?.profile?.first_name) {
      return user.profile.first_name;
    } else if (user?.profile?.last_name) {
      return user.profile.last_name;
    } else if (user?.email) {
      return user.email.split("@")[0];
    }
    return "Guest";
  }, [user]);

  const handleNavigation = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    setSidebarOpen(false);
    router.push(href);
  };

  const handleLogout = async () => {
    try {
      await signOut("local");
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

  if (!user) {
    return <LoadingComponent />;
  }

  if (!user.can_access_ad_manager) {
    return <LoadingComponent />;
  }

  return (
    <LayoutContainer>
      <Sidebar ref={sidebarRef} $isOpen={sidebarOpen}>
        <LogoContainer>
          <Link href="/ad-manager" passHref legacyBehavior>
            <CymasphereLogo
              size="32px"
              fontSize="1.4rem"
              href="/ad-manager"
              onClick={(e: React.MouseEvent<HTMLElement>) =>
                handleNavigation(
                  e as React.MouseEvent<HTMLAnchorElement>,
                  "/ad-manager"
                )
              }
              className="ad-manager-logo"
            />
          </Link>
        </LogoContainer>

        <nav>
          <Link href="/ad-manager" passHref legacyBehavior>
            <NavItem
              $active={pathname === "/ad-manager" ? "true" : "false"}
              onClick={(e) => handleNavigation(e, "/ad-manager")}
            >
              <FaHome /> Ad Manager Dashboard
            </NavItem>
          </Link>
          <Link href="/ad-manager/campaigns" passHref legacyBehavior>
            <NavItem
              $active={pathname.startsWith("/ad-manager/campaigns") ? "true" : "false"}
              onClick={(e) => handleNavigation(e, "/ad-manager/campaigns")}
            >
              <FaBullhorn /> Campaigns
            </NavItem>
          </Link>
          <Link href="/ad-manager/audiences" passHref legacyBehavior>
            <NavItem
              $active={pathname.startsWith("/ad-manager/audiences") ? "true" : "false"}
              onClick={(e) => handleNavigation(e, "/ad-manager/audiences")}
            >
              <FaUsers /> Audiences
            </NavItem>
          </Link>
          <Link href="/ad-manager/analytics" passHref legacyBehavior>
            <NavItem
              $active={pathname.startsWith("/ad-manager/analytics") ? "true" : "false"}
              onClick={(e) => handleNavigation(e, "/ad-manager/analytics")}
            >
              <FaChartLine /> Analytics
            </NavItem>
          </Link>
          <Link href="/ad-manager/settings" passHref legacyBehavior>
            <NavItem
              $active={pathname.startsWith("/ad-manager/settings") ? "true" : "false"}
              onClick={(e) => handleNavigation(e, "/ad-manager/settings")}
            >
              <FaCog /> Settings
            </NavItem>
          </Link>
        </nav>

        <UserInfo>
          <UserName>
            <h4>{user_display_name}</h4>
            <p>{user.email}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
              Ad Manager
            </p>
          </UserName>
          <LogoutButton onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </LogoutButton>
        </UserInfo>
      </Sidebar>

      <MobileOverlay $isOpen={sidebarOpen} />

      <MobileHeader>
        <MenuButton onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </MenuButton>

        <MobileLogoContent>
          <CymasphereLogo
            size="24px"
            fontSize="1.2rem"
            href="/ad-manager"
            onClick={(e: React.MouseEvent<HTMLElement>) =>
              handleNavigation(
                e as React.MouseEvent<HTMLAnchorElement>,
                "/ad-manager"
              )
            }
            className="mobile-ad-manager-logo"
          />
        </MobileLogoContent>

        <div style={{ width: "24px" }} />
      </MobileHeader>

      <MainContent>
        {children}
      </MainContent>
    </LayoutContainer>
  );
} 