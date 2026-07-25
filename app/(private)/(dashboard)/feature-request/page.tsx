"use client";

/**
 * @fileoverview Account feature-request page.
 * @module app/(private)/(dashboard)/feature-request/page
 * @note Layout and form styles match the Support dashboard page.
 */

import React, { useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { FaLightbulb, FaTicketAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import NextSEO from "@/components/NextSEO";
import { createSupportTicket } from "@/app/actions/user-management";
import {
  TicketsContainer,
  TicketsTitle,
  TicketsSubtitle,
  FormGroup,
  FormLabel,
  FormInput,
  FormTextarea,
  SubmitButton,
  ErrorMessage,
  SuccessMessage,
} from "@/components/support/SupportTicketsComponents";

const ContentCard = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const PageFormActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-start;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const IntroText = styled.p`
  margin: 0 0 1.5rem;
  color: var(--text-secondary);
  line-height: 1.55;
  font-size: 1rem;
`;

const FooterRow = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: 0.5rem;
`;

const TicketsLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  svg {
    font-size: 0.9rem;
  }
`;

/**
 * @brief Feature request form for authenticated dashboard users.
 * @returns Feature request page with ticket creation form.
 */
export default function FeatureRequestPage() {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * @brief Submit a typed feature support ticket.
   * @param e Form submit event.
   */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const result = await createSupportTicket({
        subject: subject.trim(),
        description: description.trim(),
        ticket_type: "feature",
      });
      if (result.success && result.ticket) {
        setSuccess(
          t(
            "dashboard.featureRequest.success",
            "Ticket {{number}} created. Thank you!",
            { number: result.ticket.ticket_number }
          )
        );
        setSubject("");
        setDescription("");
      } else {
        setError(result.error || "Failed to create ticket");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NextSEO
        title={t("dashboard.featureRequest.title", "Feature Request")}
        description={t(
          "dashboard.featureRequest.subtitle",
          "Suggest an improvement for Cymasphere"
        )}
      />
      <TicketsContainer>
        <TicketsTitle>
          <FaLightbulb />
          {t("dashboard.featureRequest.title", "Feature Request")}
        </TicketsTitle>
        <TicketsSubtitle>
          {t(
            "dashboard.featureRequest.subtitle",
            "Suggest an improvement for Cymasphere"
          )}
        </TicketsSubtitle>

        <ContentCard>
          <IntroText>
            {t(
              "dashboard.featureRequest.intro",
              "Describe the workflow you want and why it would help. We read every suggestion."
            )}
          </IntroText>
          <form onSubmit={onSubmit}>
            <FormGroup>
              <FormLabel htmlFor="feature-subject">
                {t("dashboard.featureRequest.subject", "Subject")}
              </FormLabel>
              <FormInput
                id="feature-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder={t(
                  "dashboard.featureRequest.subjectPlaceholder",
                  "Short summary of your idea"
                )}
              />
            </FormGroup>
            <FormGroup>
              <FormLabel htmlFor="feature-description">
                {t("dashboard.featureRequest.description", "Description")}
              </FormLabel>
              <FormTextarea
                id="feature-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder={t(
                  "dashboard.featureRequest.descriptionPlaceholder",
                  "What should it do? When would you use it?"
                )}
              />
            </FormGroup>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {success && <SuccessMessage>{success}</SuccessMessage>}
            <PageFormActions>
              <SubmitButton type="submit" disabled={loading}>
                {loading
                  ? t("dashboard.featureRequest.submitting", "Submitting…")
                  : t(
                      "dashboard.featureRequest.submit",
                      "Submit feature request"
                    )}
              </SubmitButton>
            </PageFormActions>
          </form>
        </ContentCard>

        <FooterRow>
          <TicketsLink href="/support">
            <FaTicketAlt />
            {t(
              "dashboard.featureRequest.viewTickets",
              "View my support tickets"
            )}
          </TicketsLink>
        </FooterRow>
      </TicketsContainer>
    </>
  );
}
