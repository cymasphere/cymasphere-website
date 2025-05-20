"use client";
import React, { useEffect, useState, useRef, useMemo } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import {
  FaCreditCard,
  FaTimes,
  FaTachometerAlt,
  FaUser,
  FaDownload,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaHome,
  FaArrowLeft,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import CymasphereLogo from "@/components/common/CymasphereLogo";
import LoadingComponent from "@/components/common/LoadingComponent";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: var(--background);
`;

interface SidebarProps {
  $isOpen: boolean;
}

const Sidebar = styled.aside<SidebarProps>`
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

interface MobileOverlayProps {
  $isOpen: boolean;
}

const MobileOverlay = styled.div<MobileOverlayProps>`
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 90;
  display: ${(props) => (props.$isOpen ? "block" : "none")};
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 2rem;
  margin-bottom: 2rem;
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

const MobileLogoContent = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
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
  background: linear-gradient(
    165deg,
    rgba(15, 14, 23, 0.98) 0%,
    rgba(27, 25, 40, 0.98) 50%,
    rgba(35, 32, 52, 0.98) 100%
  );
  backdrop-filter: blur(10px);
  align-items: center;

  &::before {
    content: "";
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
        circle at 30% 50%,
        rgba(108, 99, 255, 0.15),
        transparent 50%
      ),
      radial-gradient(
        circle at 70% 30%,
        rgba(78, 205, 196, 0.15),
        transparent 50%
      );
    z-index: -1;
    pointer-events: none;
  }
`;

interface NavItemProps {
  $active: string;
}

const NavItem = styled.a<NavItemProps>`
  display: flex;
  align-items: center;
  padding: 1rem 2rem;
  color: ${(props) =>
    props.$active === "true" ? "var(--primary)" : "var(--text-secondary)"};
  font-weight: ${(props) => (props.$active === "true" ? "600" : "400")};
  text-decoration: none;
  transition: all 0.2s ease;
  background-color: ${(props) =>
    props.$active === "true" ? "rgba(108, 99, 255, 0.1)" : "transparent"};
  border-left: 3px solid
    ${(props) => (props.$active === "true" ? "var(--primary)" : "transparent")};

  &:hover {
    background-color: rgba(108, 99, 255, 0.05);
    color: var(--text);
  }

  svg {
    margin-right: 1rem;
    font-size: 1.2rem;
  }
`;

interface MobileNavItemProps {
  $active: string;
}

const MobileNavItem = styled(motion.a)<MobileNavItemProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 15px 30px;
  color: ${(props) =>
    props.$active === "true" ? "var(--primary)" : "rgba(255, 255, 255, 0.7)"};
  font-weight: ${(props) => (props.$active === "true" ? "600" : "500")};
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
    content: "";
    position: absolute;
    bottom: -2px;
    left: 20%;
    width: ${(props) => (props.$active === "true" ? "60%" : "0")};
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

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  
  // Initialize translations
  const { t } = useTranslation();
  const { isLoading: languageLoading } = useLanguage();
  
  // Wait for translations to load
  useEffect(() => {
    if (!languageLoading) {
      setTranslationsLoaded(true);
    }
  }, [languageLoading]);

  const user_display_name = useMemo(() => {
    if (!user) return "";
    return user.profile.first_name + " " + user.profile.last_name;
  }, [user]);

  const toggleSidebar = () => {
    setSidebarOpen((prevState) => !prevState);
  };

  const handleLogout = async () => {
    try {
      await signOut("local");
      router.push("/login");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        sidebarOpen
      ) {
        // Do nothing - removed auto-closing behavior
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen]);

  // Return loading state if not mounted yet or translations not loaded
  if (!user || !translationsLoaded) {
    return (
      <LayoutContainer>
        <Content
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <LoadingComponent text={t("dashboard.layout.loading", "Loading dashboard...")} />
        </Content>
      </LayoutContainer>
    );
  }

  // Animation variants
  const fadeIn = {
    hidden: {
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  // Animation variants for menu items
  const menuItemVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        duration: 0.3,
      },
    },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
        ease: "easeOut",
      },
    }),
  };

  // Animation variants for smooth page transitions
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 10,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.3,
        ease: "easeIn",
      },
    },
  };

  // Function to handle navigation with router
  const handleNavigation = (
    e: React.MouseEvent<HTMLAnchorElement>,
    path: string
  ) => {
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
              href="/dashboard"
              onClick={(e: React.MouseEvent<HTMLElement>) =>
                handleNavigation(
                  e as React.MouseEvent<HTMLAnchorElement>,
                  "/dashboard"
                )
              }
              className="dashboard-logo"
            />
          </Link>
        </LogoContainer>

        <nav>
          <Link href="/dashboard" passHref legacyBehavior>
            <NavItem
              $active={pathname === "/dashboard" ? "true" : "false"}
              onClick={(e) => handleNavigation(e, "/dashboard")}
            >
              <FaTachometerAlt /> {t("dashboard.layout.dashboard", "Dashboard")}
            </NavItem>
          </Link>
          <Link href="/profile" passHref legacyBehavior>
            <NavItem
              $active={pathname === "/profile" ? "true" : "false"}
              onClick={(e) => handleNavigation(e, "/profile")}
            >
              <FaUser /> {t("dashboard.layout.profile", "Profile")}
            </NavItem>
          </Link>
          <Link href="/billing" passHref legacyBehavior>
            <NavItem
              $active={pathname === "/billing" ? "true" : "false"}
              onClick={(e) => handleNavigation(e, "/billing")}
            >
              <FaCreditCard /> {t("dashboard.layout.billing", "Billing")}
            </NavItem>
          </Link>
          <Link href="/downloads" passHref legacyBehavior>
            <NavItem
              $active={pathname === "/downloads" ? "true" : "false"}
              onClick={(e) => handleNavigation(e, "/downloads")}
            >
              <FaDownload /> {t("dashboard.layout.downloads", "Downloads")}
            </NavItem>
          </Link>
          <Link href="/settings" passHref legacyBehavior>
            <NavItem
              $active={pathname === "/settings" ? "true" : "false"}
              onClick={(e) => handleNavigation(e, "/settings")}
            >
              <FaCog /> {t("dashboard.layout.settings", "Settings")}
            </NavItem>
          </Link>
        </nav>

        <UserInfo>
          <UserName>
            <h4>{t("dashboard.layout.welcomeUser", "{{name}}", { name: user_display_name })}</h4>
            <p>{t("dashboard.layout.emailLabel", "{{email}}", { email: user.email })}</p>
          </UserName>
          <LogoutButton onClick={handleLogout} title={t("dashboard.layout.logout", "Logout")}>
            <FaSignOutAlt />
          </LogoutButton>
        </UserInfo>
      </Sidebar>

      <MobileOverlay $isOpen={sidebarOpen} />

      <MobileHeader>
        <MobileLogoContent onClick={() => router.push("/dashboard")}>
          <div
            className="mobile-logo"
            style={{ display: "flex", alignItems: "center" }}
          >
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                fontFamily: '"Montserrat", sans-serif',
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginLeft: "6px",
              }}
            >
              <span
                style={{
                  background:
                    "linear-gradient(90deg, var(--primary), var(--accent))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {t("common.brandFirst", "CYMA")}
              </span>
              <span style={{ color: "white" }}>{t("common.brandSecond", "SPHERE")}</span>
            </span>
          </div>
        </MobileLogoContent>

        <MenuButton onClick={toggleSidebar}>
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </MenuButton>
      </MobileHeader>

      {sidebarOpen && (
        <MobileMenu initial="hidden" animate="visible" variants={fadeIn}>
          <MobileNavTitle>{t("dashboard.layout.account", "Account")}</MobileNavTitle>

          <Link href="/dashboard" passHref legacyBehavior>
            <MobileNavItem
              $active={pathname === "/dashboard" ? "true" : "false"}
              variants={menuItemVariants}
              custom={0}
              initial="hidden"
              animate="visible"
              onClick={(e) => handleNavigation(e, "/dashboard")}
            >
              <FaTachometerAlt /> {t("dashboard.layout.dashboard", "Dashboard")}
            </MobileNavItem>
          </Link>

          <Link href="/profile" passHref legacyBehavior>
            <MobileNavItem
              $active={pathname === "/profile" ? "true" : "false"}
              variants={menuItemVariants}
              custom={1}
              initial="hidden"
              animate="visible"
              onClick={(e) => handleNavigation(e, "/profile")}
            >
              <FaUser /> {t("dashboard.layout.profile", "Profile")}
            </MobileNavItem>
          </Link>

          <Link href="/billing" passHref legacyBehavior>
            <MobileNavItem
              $active={pathname === "/billing" ? "true" : "false"}
              variants={menuItemVariants}
              custom={2}
              initial="hidden"
              animate="visible"
              onClick={(e) => handleNavigation(e, "/billing")}
            >
              <FaCreditCard /> {t("dashboard.layout.billing", "Billing")}
            </MobileNavItem>
          </Link>

          <Link href="/downloads" passHref legacyBehavior>
            <MobileNavItem
              $active={pathname === "/downloads" ? "true" : "false"}
              variants={menuItemVariants}
              custom={3}
              initial="hidden"
              animate="visible"
              onClick={(e) => handleNavigation(e, "/downloads")}
            >
              <FaDownload /> {t("dashboard.layout.downloads", "Downloads")}
            </MobileNavItem>
          </Link>

          <Link href="/settings" passHref legacyBehavior>
            <MobileNavItem
              $active={pathname === "/settings" ? "true" : "false"}
              variants={menuItemVariants}
              custom={4}
              initial="hidden"
              animate="visible"
              onClick={(e) => handleNavigation(e, "/settings")}
            >
              <FaCog /> {t("dashboard.layout.settings", "Settings")}
            </MobileNavItem>
          </Link>

          <Link href="/" passHref legacyBehavior>
            <MobileNavItem
              $active="false"
              variants={menuItemVariants}
              custom={5}
              initial="hidden"
              animate="visible"
              onClick={(e) => handleNavigation(e, "/")}
            >
              <FaHome /> {t("dashboard.layout.backToHome", "Back to Home")}
            </MobileNavItem>
          </Link>

          <MobileUserInfo>
            <UserName>
              <h4>{t("dashboard.layout.welcomeUser", "{{name}}", { name: user_display_name })}</h4>
              <p>{t("dashboard.layout.emailLabel", "{{email}}", { email: user.email })}</p>
            </UserName>
            <LogoutButton onClick={handleLogout} title={t("dashboard.layout.logout", "Logout")}>
              <FaSignOutAlt />
            </LogoutButton>
          </MobileUserInfo>
        </MobileMenu>
      )}

      <BackButton
        href="/"
        onClick={(e: React.MouseEvent<HTMLAnchorElement>) =>
          handleNavigation(e, "/")
        }
      >
        {t("dashboard.layout.backToSite", "Back to Site")} <FaArrowLeft />
      </BackButton>

      <Content>
        <PageTransition
          key={pathname}
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
