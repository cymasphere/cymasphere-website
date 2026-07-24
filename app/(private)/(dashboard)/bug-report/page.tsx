"use client";

/**
 * @fileoverview Account bug-report page with guidance for a good report.
 * @module app/(private)/(dashboard)/bug-report/page
 */

import React, { useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { FaBug } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import NextSEO from "@/components/NextSEO";
import { createSupportTicket } from "@/app/actions/user-management";

const Page = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;

  svg {
    color: var(--primary);
  }
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
`;

const Guidance = styled.div`
  background: var(--card-bg);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 2rem;
  color: var(--text-secondary);
  line-height: 1.55;

  h2 {
    color: var(--text);
    font-size: 1.1rem;
    margin: 0 0 0.75rem;
  }

  ul {
    margin: 0;
    padding-left: 1.25rem;
  }

  li {
    margin-bottom: 0.4rem;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  color: var(--text);
  font-weight: 500;
`;

const Input = styled.input`
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: var(--card-bg);
  color: var(--text);
`;

const TextArea = styled.textarea`
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: var(--card-bg);
  color: var(--text);
  min-height: 160px;
  resize: vertical;
`;

const Button = styled.button`
  align-self: flex-start;
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 6px;
  background: var(--primary);
  color: white;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Message = styled.p<{ $error?: boolean }>`
  color: ${(p) => (p.$error ? "#f87171" : "var(--primary)")};
`;

const FooterLink = styled(Link)`
  display: inline-block;
  margin-top: 1.5rem;
  color: var(--primary);
`;

export default function BugReportPage() {
  const { t } = useTranslation();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      <Page>
        <Title>
          <FaBug />
          {t("dashboard.bugReport.title", "Bug Report")}
        </Title>
        <Subtitle>
          {t(
            "dashboard.bugReport.subtitle",
            "Tell us what went wrong so we can fix it"
          )}
        </Subtitle>

        <Guidance>
          <h2>
            {t(
              "dashboard.bugReport.guidanceTitle",
              "What makes a good bug report?"
            )}
          </h2>
          <ul>
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
          </ul>
        </Guidance>

        <Form onSubmit={onSubmit}>
          <Label>
            {t("dashboard.bugReport.subject", "Subject")}
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder={t(
                "dashboard.bugReport.subjectPlaceholder",
                "Short summary of the bug"
              )}
            />
          </Label>
          <Label>
            {t("dashboard.bugReport.description", "Description")}
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder={t(
                "dashboard.bugReport.descriptionPlaceholder",
                "Example: 1) Open SONG view 2) Delete a bank 3) App freezes. Expected: bank deletes. Actual: freeze. Windows 11, Cymasphere 1.x."
              )}
            />
          </Label>
          {error && <Message $error>{error}</Message>}
          {success && <Message>{success}</Message>}
          <Button type="submit" disabled={loading}>
            {loading
              ? t("dashboard.bugReport.submitting", "Submitting…")
              : t("dashboard.bugReport.submit", "Submit bug report")}
          </Button>
        </Form>

        <FooterLink href="/support">
          {t("dashboard.bugReport.viewTickets", "View my support tickets")}
        </FooterLink>
      </Page>
    </>
  );
}
