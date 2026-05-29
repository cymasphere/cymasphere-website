/**
 * @fileoverview NextFooter Component
 * @module components/layout/NextFooter
 * 
 * Next.js App Router-optimized footer component with navigation links,
 * social media icons, and legal information modals. Uses Next.js navigation
 * hooks for client-side routing.
 * 
 * @example
 * // Basic usage
 * <NextFooter />
 */

import React, { useState } from "react";
import styled, { css } from "styled-components";
import Link from "next/link";
import {
  FaXTwitter,
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaDiscord,
} from "react-icons/fa6";
import LegalModal from "../modals/LegalModal";
import EnergyBall from "../common/EnergyBall";
import { playLydianMaj7Chord } from "../../utils/audioUtils";
import { usePathname } from "next/navigation";

const FooterContainer = styled.footer`
  background-color: var(--surface);
  padding: 4rem 0 2rem;
  color: var(--text-secondary);
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1fr;
  gap: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const FooterColumn = styled.div`
  display: flex;
  flex-direction: column;

  &:first-child {
    margin-right: 1rem;
  }

  &:not(:first-child) {
    padding-left: 1rem;
  }
`;

/**
 * @brief Brand logo target: one anchor via `next/link` (avoids nested `<a>` around the mark).
 */
const FooterLogoLink = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--text);
  font-weight: 700;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  cursor: pointer;

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
    font-family: "Montserrat", sans-serif;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const BrandCredit = styled.a`
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  font-style: italic;
  text-decoration: none;
  transition: color 0.2s ease;
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  min-height: 44px;
  padding: 6px 0;

  &:hover {
    color: var(--primary);
  }
`;

const FooterDescription = styled.p`
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  max-width: 300px;
  line-height: 1.6;
`;

const FooterHeading = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1.25rem;
  letter-spacing: 0.5px;
`;

const footerNavLinkStyles = css`
  font-size: 0.95rem;
  color: var(--text-secondary);
  text-decoration: none;
  margin-bottom: 1rem;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  min-height: 44px;
  padding: 6px 0;
  cursor: pointer;
  background: none;
  border: none;
  font-family: inherit;
  text-align: left;
  width: 100%;

  &:hover {
    color: var(--primary);
    text-decoration: none;
  }
`;

/** @brief Same-page hash links and hard `location` redirects (Dashboard / Settings). */
const FooterLink = styled.a`
  ${footerNavLinkStyles}
`;

/**
 * @brief In-app footer row using `next/link` for client-side navigation and a single real `<a>`.
 */
const FooterNavLink = styled(Link)`
  ${footerNavLinkStyles}
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
`;

const SocialIcon = styled.a`
  color: var(--text-secondary);
  font-size: 1.25rem;
  transition: color 0.2s ease, transform 0.2s ease;

  &:hover {
    color: var(--primary);
    transform: translateY(-2px);
  }
`;

const Copyright = styled.div`
  text-align: center;
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  font-size: 0.85rem;

  p {
    margin: 0;

    span {
      margin-left: 0.5rem;
      font-style: italic;
      opacity: 0.8;
    }
  }

  @media (max-width: 480px) {
    span {
      display: block;
      margin-top: 5px;
      margin-left: 0 !important;
    }
  }
`;

/**
 * @brief NextFooter component
 * 
 * Footer component optimized for Next.js App Router. Provides four-column
 * layout with brand information, navigation, account links, and company
 * information. Includes legal modals and social media links.
 * 
 * @returns {JSX.Element} The rendered footer component
 * 
 * @note Uses Next.js usePathname for logo scroll behavior on `/`
 * @note Logo click plays audio chord when on home page
 * @note Responsive design with mobile-optimized grid layout
 * @note Includes legal modals for terms and privacy policy
 * @note Internal routes use `FooterNavLink` so markup is not `<a><a>…</a></a>`.
 */
const NextFooter = () => {
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const pathname = usePathname();

  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    try {
      playLydianMaj7Chord();
    } catch {
      console.log("Audio not available");
    }
  };

  return (
    <FooterContainer>
      <FooterContent>
        <FooterColumn>
          <FooterLogoLink
            href="/"
            onClick={handleLogoClick}
            title="Click to hear a beautiful Lydian Maj7(9, #11, 13) chord"
          >
            <EnergyBall />
            <LogoText>
              <span>CYMA</span>SPHERE
            </LogoText>
          </FooterLogoLink>
          <BrandCredit href="https://nnaud.io">by NNAudio</BrandCredit>
          <FooterDescription>
            Cymasphere is an interactive music compositional tool for producers,
            composers, performing musicians, educators, and students.
          </FooterDescription>
          <SocialLinks>
            <SocialIcon
              href="https://x.com/cymasphere"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
            >
              <FaXTwitter />
            </SocialIcon>
            <SocialIcon
              href="https://instagram.com/cymasphere"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </SocialIcon>
            <SocialIcon
              href="https://facebook.com/cymasphere"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FaFacebook />
            </SocialIcon>
            <SocialIcon
              href="https://youtube.com/@cymasphere"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
            >
              <FaYoutube />
            </SocialIcon>
            <SocialIcon
              href="https://discord.gg/gXGqqYR47B"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord"
            >
              <FaDiscord />
            </SocialIcon>
          </SocialLinks>
        </FooterColumn>

        <FooterColumn>
          <FooterHeading>Navigation</FooterHeading>
          <FooterNavLink href="/">Home</FooterNavLink>
          <FooterLink href="#features">Features</FooterLink>
          <FooterLink href="#how-it-works">How It Works</FooterLink>
          <FooterLink href="#pricing">Pricing</FooterLink>
          <FooterLink href="#faq">FAQ</FooterLink>
        </FooterColumn>

        <FooterColumn>
          <FooterHeading>Account</FooterHeading>
          <FooterNavLink href="/login">Login</FooterNavLink>
          <FooterNavLink href="/signup">Sign Up</FooterNavLink>
          <FooterLink
            href="/dashboard"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              window.location.href = "/dashboard";
            }}
          >
            Dashboard
          </FooterLink>
          <FooterLink
            href="/settings"
            onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
              e.preventDefault();
              window.location.href = "/settings";
            }}
          >
            Settings
          </FooterLink>
        </FooterColumn>

        <FooterColumn>
          <FooterHeading>Information</FooterHeading>
          <FooterNavLink href="/about">About Us</FooterNavLink>
          <FooterNavLink href="/contact">Contact</FooterNavLink>
          <FooterNavLink href="/terms-of-service">
            Terms of Service
          </FooterNavLink>
          <FooterNavLink href="/privacy-policy">Privacy Policy</FooterNavLink>
          <FooterNavLink href="/refund-policy">Refund Policy</FooterNavLink>
        </FooterColumn>
      </FooterContent>
      <Copyright>
        <p>
          &copy; {new Date().getFullYear()} CYMASPHERE{" "}
          <span>All rights reserved</span>
        </p>
      </Copyright>
      {showTermsModal && (
        <LegalModal
          isOpen={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          modalType="terms"
        />
      )}
      {showPrivacyModal && (
        <LegalModal
          isOpen={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
          modalType="privacy"
        />
      )}
    </FooterContainer>
  );
};

export default NextFooter;
