"use client";

/**
 * @fileoverview Account feature-request page.
 * @module app/(private)/(dashboard)/feature-request/page
 */

import React, { useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { FaLightbulb } from "react-icons/fa";
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
  margin-bottom: 2rem;
  line-height: 1.55;
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

export default function FeatureRequestPage() {
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
      <Page>
        <Title>
          <FaLightbulb />
          {t("dashboard.featureRequest.title", "Feature Request")}
        </Title>
        <Subtitle>
          {t(
            "dashboard.featureRequest.intro",
            "Describe the workflow you want and why it would help. We read every suggestion."
          )}
        </Subtitle>

        <Form onSubmit={onSubmit}>
          <Label>
            {t("dashboard.featureRequest.subject", "Subject")}
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder={t(
                "dashboard.featureRequest.subjectPlaceholder",
                "Short summary of your idea"
              )}
            />
          </Label>
          <Label>
            {t("dashboard.featureRequest.description", "Description")}
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder={t(
                "dashboard.featureRequest.descriptionPlaceholder",
                "What should it do? When would you use it?"
              )}
            />
          </Label>
          {error && <Message $error>{error}</Message>}
          {success && <Message>{success}</Message>}
          <Button type="submit" disabled={loading}>
            {loading
              ? t("dashboard.featureRequest.submitting", "Submitting…")
              : t("dashboard.featureRequest.submit", "Submit feature request")}
          </Button>
        </Form>

        <FooterLink href="/support">
          {t(
            "dashboard.featureRequest.viewTickets",
            "View my support tickets"
          )}
        </FooterLink>
      </Page>
    </>
  );
}
