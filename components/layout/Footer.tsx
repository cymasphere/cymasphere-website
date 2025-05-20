import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Link from "next/link";
import {
  FaXTwitter,
  FaInstagram,
  FaFacebook,
  FaYoutube,
  FaDiscord,
} from "react-icons/fa6";
import LegalModal from "@/components/modals/LegalModal";
import AboutUsModal from "@/components/modals/AboutUsModal";
import EnergyBall from "@/components/common/EnergyBall";
import { playLydianMaj7Chord } from "@/utils/audioUtils";
import i18next from "i18next";

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

const FooterLogo = styled.div`
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

const FooterLink = styled.span`
  color: var(--text-secondary);
  text-decoration: none;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
  transition: color 0.2s ease;
  cursor: pointer;
  display: block;

  &:hover {
    color: var(--primary);
    text-decoration: none;
  }
`;

const FooterAnchor = styled.span`
  font-size: 0.95rem;
  color: var(--text-secondary);
  text-decoration: none;
  margin-bottom: 0.75rem;
  transition: color 0.2s ease;
  display: block;
  cursor: pointer;

  &:hover {
    color: var(--primary);
    text-decoration: none;
  }
`;

const FooterButton = styled.button`
  background: none;
  border: none;
  font-size: 0.95rem;
  color: var(--text-secondary);
  text-align: left;
  padding: 0;
  margin-bottom: 0.75rem;
  cursor: pointer;
  transition: color 0.2s ease;
  display: inline-block;

  &:hover {
    color: var(--primary);
  }
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

const CopyrightLink = styled.a`
  color: inherit;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: var(--primary);
  }
`;

// Simple i18n wrapper functions to avoid hook ordering issues
function getTranslation(key: string, defaultValue: string, options?: Record<string, any>): string {
  return i18next.t(key, { defaultValue, ...options }) as string;
}

const Footer = () => {
  // All hooks at the top in consistent order
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [language, setLanguage] = useState(() => 
    typeof window !== 'undefined' ? i18next.language : 'en'
  );
  
  // Effect to listen for language changes
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setLanguage(lng);
    };
    
    if (typeof window !== 'undefined') {
      i18next.on('languageChanged', handleLanguageChanged);
      return () => {
        i18next.off('languageChanged', handleLanguageChanged);
      };
    }
    return undefined;
  }, []);

  // When language changes, this will re-render the component
  // using the _ variable to ensure ESLint doesn't complain about unused vars
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = language;

  return (
    <FooterContainer>
      <FooterContent>
        <FooterColumn>
          <Link href="/" passHref legacyBehavior>
            <FooterLogo
              onClick={(e) => {
                if (window.location.pathname === "/") {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  try {
                    playLydianMaj7Chord();
                  } catch {
                    console.log("Audio not available");
                  }
                }
              }}
            >
              <EnergyBall size="35px" marginRight="12px" />
              <LogoText>
                <span>CYMA</span>SPHERE
              </LogoText>
            </FooterLogo>
          </Link>
          <BrandCredit href="https://nnaud.io">{getTranslation("footer.byNNAudio", "by NNAudio")}</BrandCredit>
          <FooterDescription>
            {getTranslation("footer.description", "Cymasphere is an interactive music compositional tool for producers, composers, performing musicians, educators, and students.")}
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
              href="https://discord.gg/cymasphere"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Discord"
            >
              <FaDiscord />
            </SocialIcon>
          </SocialLinks>
        </FooterColumn>

        <FooterColumn>
          <FooterHeading>{getTranslation("footer.navigation", "Navigation")}</FooterHeading>
          <Link href="/" passHref legacyBehavior>
            <FooterLink>{getTranslation("header.home", "Home")}</FooterLink>
          </Link>
          <FooterAnchor as="a" href="#features">
            {getTranslation("header.features", "Features")}
          </FooterAnchor>
          <FooterAnchor as="a" href="#how-it-works">
            {getTranslation("header.howItWorks", "How It Works")}
          </FooterAnchor>
          <FooterAnchor as="a" href="#pricing">
            {getTranslation("header.pricing", "Pricing")}
          </FooterAnchor>
          <FooterAnchor as="a" href="#faq">
            {getTranslation("header.faq", "FAQ")}
          </FooterAnchor>
        </FooterColumn>

        <FooterColumn>
          <FooterHeading>{getTranslation("footer.account", "Account")}</FooterHeading>
          <Link href="/login" passHref legacyBehavior>
            <FooterLink>{getTranslation("common.login", "Login")}</FooterLink>
          </Link>
          <Link href="/signup" passHref legacyBehavior>
            <FooterLink>{getTranslation("common.signUp", "Sign Up")}</FooterLink>
          </Link>
          <Link href="/dashboard" passHref legacyBehavior>
            <FooterLink>{getTranslation("footer.accountDashboard", "Account Dashboard")}</FooterLink>
          </Link>
        </FooterColumn>

        <FooterColumn>
          <FooterHeading>{getTranslation("footer.company", "Company")}</FooterHeading>
          <FooterButton onClick={() => setShowAboutModal(true)}>
            {getTranslation("footer.aboutUs", "About Us")}
          </FooterButton>
          <FooterButton onClick={() => setShowPrivacyModal(true)}>
            {getTranslation("footer.privacyPolicy", "Privacy Policy")}
          </FooterButton>
          <FooterButton onClick={() => setShowTermsModal(true)}>
            {getTranslation("footer.termsConditions", "Terms & Conditions")}
          </FooterButton>
        </FooterColumn>
      </FooterContent>

      <Copyright>
        <p>
          {getTranslation("footer.copyright", `© ${new Date().getFullYear()} Cymasphere. All rights reserved.`, { year: new Date().getFullYear() })}
          <span>
            <CopyrightLink
              href="https://nnaud.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              {getTranslation("footer.byNNAudio", "by NNAudio")}
            </CopyrightLink>
          </span>
        </p>
      </Copyright>

      <LegalModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        modalType="terms"
      />

      <LegalModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        modalType="privacy"
      />

      <AboutUsModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />
    </FooterContainer>
  );
};

export default Footer;
