"use client";
import React, { useState, useEffect } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { FaCog, FaServer, FaShieldAlt, FaUsers } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import styled from "styled-components";
import { motion } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";

const SettingsContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const SettingsTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 1rem;

  svg {
    color: var(--primary);
  }

  @media (max-width: 768px) {
    font-size: 2rem;
    margin-bottom: 1rem;
  }
`;

const SettingsSubtitle = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 2rem;
  }
`;

const ComingSoonCard = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 2rem;
`;

const ComingSoonTitle = styled.h2`
  font-size: 2rem;
  color: var(--text);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;

  svg {
    color: var(--primary);
  }
`;

const ComingSoonText = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const FeatureList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const FeatureCard = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  text-align: center;
`;

const FeatureIcon = styled.div`
  font-size: 2rem;
  color: var(--primary);
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h3`
  font-size: 1.2rem;
  color: var(--text);
  margin-bottom: 0.5rem;
`;

const FeatureDescription = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
`;

function AdminSettingsPage() {
  const { user } = useAuth();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const { t } = useTranslation();
  const { isLoading: languageLoading } = useLanguage();

  useEffect(() => {
    if (!languageLoading) {
      setTranslationsLoaded(true);
    }
  }, [languageLoading]);

  if (languageLoading || !translationsLoaded) {
    return <LoadingComponent />;
  }

  if (!user) {
    return <LoadingComponent />;
  }

  // Temporarily disabled admin check for testing
  // if (!user || user.profile?.subscription !== "admin") {
  //   return null;
  // }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
    }),
  };

  const features = [
    {
      icon: <FaServer />,
      title: "System Configuration",
      description:
        "Configure server settings, database connections, and system preferences.",
    },
    {
      icon: <FaShieldAlt />,
      title: "Security Settings",
      description:
        "Manage authentication methods, access controls, and security policies.",
    },
    {
      icon: <FaUsers />,
      title: "User Management",
      description:
        "Configure user roles, permissions, and access levels across the platform.",
    },
  ];

  return (
    <>
      <NextSEO
        title={t("admin.settings", "Admin Settings")}
        description="Configure system settings and preferences"
      />

      <SettingsContainer>
        <SettingsTitle>
          <FaCog />
          {t("admin.settings", "Admin Settings")}
        </SettingsTitle>
        <SettingsSubtitle>
          Configure system settings and preferences
        </SettingsSubtitle>

        <ComingSoonCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <ComingSoonTitle>
            <FaCog />
            Coming Soon
          </ComingSoonTitle>
          <ComingSoonText>
            Advanced administrative settings are being developed. This section
            will provide comprehensive system configuration options, security
            settings, and platform management tools for administrators.
          </ComingSoonText>
        </ComingSoonCard>

        <FeatureList>
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={index + 1}
            >
              <FeatureIcon>{feature.icon}</FeatureIcon>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
            </FeatureCard>
          ))}
        </FeatureList>
      </SettingsContainer>
    </>
  );
}

export default AdminSettingsPage;
