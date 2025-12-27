"use client";
import React from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { motion, Variants } from "framer-motion";

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 120px 20px 40px 20px;
  line-height: 1.6;

  @media (max-width: 768px) {
    padding: 100px 15px 20px 15px;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: var(--text);
  text-align: center;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const LastUpdated = styled.p`
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 3rem;
  font-style: italic;
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.3rem;
  margin-bottom: 1rem;
  color: var(--text);
  font-weight: 600;
`;

const SectionContent = styled.p`
  color: var(--text-secondary);
  margin-bottom: 1rem;
`;

const HighlightBox = styled.div`
  background: linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(78, 205, 196, 0.1) 100%);
  border-left: 4px solid var(--primary);
  padding: 1.5rem;
  border-radius: 8px;
  margin: 2rem 0;
  
  p {
    margin: 0;
    color: var(--text);
    font-size: 1.05rem;
    line-height: 1.8;
  }
`;

const ContactInfo = styled.div`
  background-color: var(--card-bg);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 2rem;
  text-align: center;
`;

export default function RefundPolicyPage() {
  const { t } = useTranslation();

  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
  };

  return (
    <>
      <NextSEO
        title="Refund Policy | Cymasphere"
        description="Learn about Cymasphere's refund policy. We offer free trials to help you evaluate our music composition software before making a purchase."
      />
      
      <Container>
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <Title>Refund Policy</Title>
          <LastUpdated>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</LastUpdated>

          <Section>
            <SectionTitle>1. Our Commitment to Your Satisfaction</SectionTitle>
            <SectionContent>
              At Cymasphere, we are dedicated to providing exceptional music composition and theory tools that enhance your creative workflow. We understand the importance of making an informed decision when choosing software that will become an integral part of your musical journey.
            </SectionContent>
          </Section>

          <Section>
            <SectionTitle>2. Free Trial Period</SectionTitle>
            <SectionContent>
              To ensure that Cymasphere is the right fit for your needs, we offer a comprehensive free trial period. This trial allows you to explore all features of our platform, test its capabilities with your own projects, and experience the full range of tools available before making any financial commitment.
            </SectionContent>
            <SectionContent>
              During your free trial, you have full access to all premium features, giving you a complete understanding of how Cymasphere can enhance your music composition process. We encourage you to take full advantage of this period to evaluate whether our software meets your requirements and expectations.
            </SectionContent>
          </Section>

          <HighlightBox>
            <p>
              <strong>Our Free Trial Policy:</strong> We offer up to 14 days of free access to all premium features, with no credit card required for the initial 7 days. This generous trial period is designed to give you ample time to thoroughly evaluate Cymasphere and ensure it aligns with your creative needs.
            </p>
          </HighlightBox>

          <Section>
            <SectionTitle>3. No Refund Policy</SectionTitle>
            <SectionContent>
              As a digital software service, all subscription fees and one-time purchases made through Cymasphere are final and non-refundable. This policy applies to all subscription plans, including monthly, annual, and lifetime memberships, as well as any additional products or services purchased through our platform.
            </SectionContent>
            <SectionContent>
              This policy is standard practice for digital software services and reflects the nature of our product. Once you have subscribed or made a purchase, you gain immediate access to our platform and all associated features, making it impossible to "return" digital products in the traditional sense.
            </SectionContent>
          </Section>

          <Section>
            <SectionTitle>4. Why We Don't Offer Refunds</SectionTitle>
            <SectionContent>
              Digital software services differ fundamentally from physical products. When you purchase access to Cymasphere, you receive immediate and ongoing access to our platform, tools, and resources. Unlike physical goods that can be returned unused, digital services are consumed upon access.
            </SectionContent>
            <SectionContent>
              Our free trial period is specifically designed to address this concern by providing you with a risk-free opportunity to evaluate our software comprehensively before making any payment. This approach allows you to make an informed decision with confidence, knowing exactly what you're purchasing.
            </SectionContent>
          </Section>

          <Section>
            <SectionTitle>5. Subscription Cancellation</SectionTitle>
            <SectionContent>
              While we do not offer refunds for payments already processed, you may cancel your subscription at any time through your account settings. Upon cancellation, you will retain access to all premium features until the end of your current billing period. No further charges will be applied to your payment method after the current period expires.
            </SectionContent>
            <SectionContent>
              Cancellation is immediate and can be done at any time through your account dashboard. We believe in transparent, user-friendly subscription management, and you maintain full control over your subscription status.
            </SectionContent>
          </Section>

          <Section>
            <SectionTitle>6. Exceptional Circumstances</SectionTitle>
            <SectionContent>
              While our refund policy is firm, we understand that exceptional circumstances may arise. If you believe you have encountered a unique situation that warrants special consideration, we encourage you to contact our support team. We review each case individually and may, at our sole discretion, make exceptions in truly extraordinary circumstances.
            </SectionContent>
            <SectionContent>
              Please note that technical issues, feature requests, or changes in personal circumstances do not typically qualify for refunds, as these concerns are best addressed through our free trial period or by contacting our support team for assistance.
            </SectionContent>
          </Section>

          <Section>
            <SectionTitle>7. Making an Informed Decision</SectionTitle>
            <SectionContent>
              We strongly recommend taking full advantage of our free trial before making any purchase. Use this time to:
            </SectionContent>
            <ul style={{ color: 'var(--text-secondary)', marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li>Explore all features and tools available in Cymasphere</li>
              <li>Test the software with your own musical projects</li>
              <li>Evaluate how it integrates with your creative workflow</li>
              <li>Review tutorials, documentation, and support resources</li>
              <li>Contact our support team with any questions or concerns</li>
            </ul>
            <SectionContent>
              By thoroughly evaluating Cymasphere during your free trial, you can make a confident, informed decision about whether our platform is the right choice for your musical endeavors.
            </SectionContent>
          </Section>

          <Section>
            <SectionTitle>8. Questions and Support</SectionTitle>
            <SectionContent>
              If you have questions about this refund policy, our free trial, or any aspect of Cymasphere, our support team is here to help. We're committed to ensuring you have all the information you need to make the best decision for your needs.
            </SectionContent>
          </Section>

          <ContactInfo>
            <strong>Contact Information</strong><br />
            Email: support@cymasphere.com<br />
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
              We typically respond within 24-48 hours
            </span>
          </ContactInfo>
        </motion.div>
      </Container>
    </>
  );
}

