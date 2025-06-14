"use client";

import React from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const PageContainer = styled.div`
  min-height: 100vh;
  background: var(--surface);
  padding: 120px 0 60px;
`;

const ContentWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const PageTitle = styled.h1`
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 2rem;
  letter-spacing: -0.5px;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
  color: white;
  text-align: center;
  background: linear-gradient(135deg, #6c63ff, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const AboutUsContent = styled.div`
  color: var(--text);
  font-size: 1rem;
  line-height: 1.7;

  h3 {
    font-size: 1.6rem;
    margin-top: 30px;
    margin-bottom: 15px;
    color: var(--primary);
    background: linear-gradient(135deg, #6c63ff, #4ecdc4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: inline-block;
  }

  p {
    margin-bottom: 20px;
  }

  ul,
  ol {
    margin-bottom: 20px;
    padding-left: 25px;
  }

  li {
    margin-bottom: 12px;
  }

  a {
    color: var(--accent);
    text-decoration: none;
    transition: color 0.2s;

    &:hover {
      color: var(--primary);
      text-decoration: underline;
    }
  }
`;

const CompanyHighlight = styled.div`
  background: rgba(108, 99, 255, 0.1);
  border-left: 4px solid var(--primary);
  padding: 20px;
  margin: 30px 0;
  border-radius: 0 8px 8px 0;
`;

const TeamSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 30px;
  margin: 40px 0;
`;

const TeamMember = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const TeamMemberImage = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: rgba(108, 99, 255, 0.2);
  margin-bottom: 15px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: var(--primary);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const TeamMemberName = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 5px;
  color: white;
`;

const TeamMemberRole = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
`;

const AboutUsPage = () => {
  const { t } = useTranslation();

  return (
    <PageContainer>
      <ContentWrapper>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PageTitle>{t("footer.aboutUs", "About Us")}</PageTitle>
          
          <AboutUsContent>
            <h3>{t("aboutUs.mission.title", "Our Mission")}</h3>
            <p>
              {t("aboutUs.mission.content", "Cymasphere's mission is to make music theory accessible without requiring years of study or technical application to an instrument. We believe that deep musical understanding should be within reach of all creators, not just trained musicians. Our tools are designed to remove traditional barriers to music creation while offering creative freedom.")}
            </p>

            <CompanyHighlight>
              {t("aboutUs.mission.highlight", "We're committed to empowering creators of all levels by making music's theoretical complexity intuitive and accessible. Our goal is to enable you to realize your creative vision without the years of study normally required.")}
            </CompanyHighlight>

            <h3>{t("aboutUs.story.title", "Our Story")}</h3>
            <p>
              {t("aboutUs.story.content1", "Founded by Ryan Johnson, a passionate musician, and Garrett Fleischer, an experienced software engineer, Cymasphere was born from a shared vision: to democratize music creation by eliminating the requirement of deep theoretical knowledge.")}
            </p>

            <p>
              {t("aboutUs.story.content2", "After observing that existing music software either required advanced theoretical understanding or severely limited creativity, our founders set out to create a tool that would make musical sophistication accessible to everyone, without requiring years of theoretical study or technical mastery of an instrument.")}
            </p>

            <h3>{t("aboutUs.values.title", "Our Values")}</h3>
            <p>
              {t("aboutUs.values.intro", "At Cymasphere, we're guided by a set of core values that shape everything we do:")}
            </p>

            <ul>
              <li>
                <strong>{t("aboutUs.values.integrity.title", "Musical Integrity")}</strong> - {t("aboutUs.values.integrity.content", "We respect the principles of music theory while embracing innovation")}
              </li>
              <li>
                <strong>{t("aboutUs.values.design.title", "Intuitive Design")}</strong> - {t("aboutUs.values.design.content", "Our interfaces are visually clear and immediately understandable")}
              </li>
              <li>
                <strong>{t("aboutUs.values.freedom.title", "Creative Freedom")}</strong> - {t("aboutUs.values.freedom.content", "We provide guidance without limiting expression")}
              </li>
              <li>
                <strong>{t("aboutUs.values.learning.title", "Continuous Learning")}</strong> - {t("aboutUs.values.learning.content", "Our tools help users develop their musical understanding")}
              </li>
            </ul>

            <h3>{t("aboutUs.approach.title", "Our Approach")}</h3>
            <p>
              {t("aboutUs.approach.intro", "Cymasphere takes a unique approach to music composition software by focusing on:")}
            </p>

            <ol>
              <li>{t("aboutUs.approach.point1", "Visualizing harmony and voice leading in intuitive ways")}</li>
              <li>
                {t("aboutUs.approach.point2", "Providing intelligent suggestions while respecting your creative direction")}
              </li>
              <li>
                {t("aboutUs.approach.point3", "Integrating theoretical concepts seamlessly into the creative workflow")}
              </li>
              <li>{t("aboutUs.approach.point4", "Building bridges between composition, arrangement, and production")}</li>
            </ol>

            <p>
              {t("aboutUs.approach.conclusion", "We're constantly refining our approach based on user feedback and the latest developments in music technology. We believe in creating tools that grow with you and adapt to your evolving creative needs.")}
            </p>

            <h3>{t("aboutUs.future.title", "Looking Forward")}</h3>
            <p>
              {t("aboutUs.future.content1", "As we continue to develop Cymasphere, we're excited about the future of music creation. Our roadmap includes advanced integration with major DAWs, expanded harmonic palettes, deeper AI-assisted composition features, and much more.")}
            </p>

            <p>
              {t("aboutUs.future.content2", "We invite you to join us on this journey and help shape the future of intelligent music creation tools.")}
            </p>
          </AboutUsContent>
        </motion.div>
      </ContentWrapper>
    </PageContainer>
  );
};

export default AboutUsPage; 