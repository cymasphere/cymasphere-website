"use client";

/**
 * @fileoverview Account bug-report page with guidance for a good report.
 * @module app/(private)/(dashboard)/bug-report/page
 * @note Layout and form styles match the Support dashboard page.
 */

import React, { useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { FaBug, FaTicketAlt } from "react-icons/fa";
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

const CardHeading = styled.h2`
  font-size: 1.2rem;
  margin: 0 0 1rem;
  color: var(--text);
  display: flex;
  align-items: center;

  svg {
    margin-right: 0.75rem;
    color: var(--primary);
  }
`;

const GuidanceList = styled.ul`
  margin: 0;
  padding-left: 1.25rem;
  color: var(--text-secondary);
  line-height: 1.55;

  li {
    margin-bottom: 0.5rem;

    &:last-child {
      margin-bottom: 0;
    }
  }
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
 * @brief Bug report form for authenticated dashboard users.
 * @returns Bug report page with guidance and ticket creation form.
 */
export default function BugReportPage() {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * @brief Submit a typed bug support ticket.
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
        ticket_type: "bug",
      });
      if (result.success && result.ticket) {
        setSuccess(
          t(
            "dashboard.bugReport.success",
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
        title={t("dashboard.bugReport.title", "Bug Report")}
        description={t(
          "dashboard.bugReport.subtitle",
          "Tell us what went wrong so we can fix it"
        )}
      />
      <TicketsContainer>
        <TicketsTitle>
          <FaBug />
          {t("dashboard.bugReport.title", "Bug Report")}
        </TicketsTitle>
        <TicketsSubtitle>
          {t(
            "dashboard.bugReport.subtitle",
            "Tell us what went wrong so we can fix it"
          )}
        </TicketsSubtitle>

        <ContentCard>
          <CardHeading>
            {t(
              "dashboard.bugReport.guidanceTitle",
              "What makes a good bug report?"
            )}
          </CardHeading>
          <GuidanceList>
            <li>
              {t(
                "dashboard.bugReport.tipSteps",
                "Steps to reproduce — what you clicked or did, in order"
              )}
            </li>
            <li>
              {t(
                "dashboard.bugReport.tipExpected",
                "Expected vs actual — what should happen vs what happened"
              )}
            </li>
            <li>
              {t(
                "dashboard.bugReport.tipVersion",
                "App version and OS (Helpful: About window shows the version)"
              )}
            </li>
            <li>
              {t(
                "dashboard.bugReport.tipContext",
                "Which view/track/plugin you were using when it failed"
              )}
            </li>
          </GuidanceList>
        </ContentCard>

        <ContentCard>
          <form onSubmit={onSubmit}>
            <FormGroup>
              <FormLabel htmlFor="bug-subject">
                {t("dashboard.bugReport.subject", "Subject")}
              </FormLabel>
              <FormInput
                id="bug-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder={t(
                  "dashboard.bugReport.subjectPlaceholder",
                  "Short summary of the bug"
                )}
              />
            </FormGroup>
            <FormGroup>
              <FormLabel htmlFor="bug-description">
                {t("dashboard.bugReport.description", "Description")}
              </FormLabel>
              <FormTextarea
                id="bug-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder={t(
                  "dashboard.bugReport.descriptionPlaceholder",
                  "Example: 1) Open SONG view 2) Delete a bank 3) App freezes. Expected: bank deletes. Actual: freeze. Windows 11, Cymasphere 1.x."
                )}
              />
            </FormGroup>
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {success && <SuccessMessage>{success}</SuccessMessage>}
            <PageFormActions>
              <SubmitButton type="submit" disabled={loading}>
                {loading
                  ? t("dashboard.bugReport.submitting", "Submitting…")
                  : t("dashboard.bugReport.submit", "Submit bug report")}
              </SubmitButton>
            </PageFormActions>
          </form>
        </ContentCard>

        <FooterRow>
          <TicketsLink href="/support">
            <FaTicketAlt />
            {t("dashboard.bugReport.viewTickets", "View my support tickets")}
          </TicketsLink>
        </FooterRow>
      </TicketsContainer>
    </>
  );
}
