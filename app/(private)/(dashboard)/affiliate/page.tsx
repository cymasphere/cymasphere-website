"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";
import {
  FaUserFriends,
  FaCopy,
  FaCheckCircle,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaTag,
  FaPiggyBank,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";

interface AffiliateRow {
  id: string;
  code: string;
  customer_discount_percent: number;
  commission_rate_subscription: number;
  commission_rate_lifetime: number;
  recurring_months: number;
  payout_minimum_cents: number;
  stripe_connect_account_id: string | null;
  connect_payouts_enabled: boolean;
  connect_onboarded_at: string | null;
  status: "active" | "suspended";
  tos_accepted_at: string | null;
}

interface Stats {
  pendingCents: number;
  approvedCents: number;
  paidCents: number;
  refundedCents: number;
  voidCents: number;
  totalCount: number;
  currency: string;
  adjustmentsCents: number;
  availableCents: number;
}

interface Payout {
  id: string;
  created_at: string;
  amount_cents: number;
  currency: string;
  commission_count: number;
  status: "processing" | "paid" | "failed";
}

const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
  svg {
    color: var(--primary);
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
`;

const Banner = styled.div<{ $tone: "info" | "warn" | "success" | "danger" }>`
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid;
  ${(p) => {
    switch (p.$tone) {
      case "info":
        return `background: rgba(108,99,255,0.1); color: var(--text); border-color: rgba(108,99,255,0.3);`;
      case "warn":
        return `background: rgba(245,158,11,0.1); color: #fcd34d; border-color: rgba(245,158,11,0.3);`;
      case "success":
        return `background: rgba(16,185,129,0.1); color: #6ee7b7; border-color: rgba(16,185,129,0.3);`;
      case "danger":
        return `background: rgba(239,68,68,0.1); color: #fecaca; border-color: rgba(239,68,68,0.3);`;
    }
  }}
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 2rem;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const CardTitle = styled.h3`
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: var(--text-secondary);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Big = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: var(--text);
`;

const Small = styled.div`
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
`;

const CodeCard = styled.div`
  background: linear-gradient(
    135deg,
    rgba(108, 99, 255, 0.12),
    rgba(78, 205, 196, 0.12)
  );
  border: 1px solid rgba(108, 99, 255, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const CodeText = styled.div`
  font-family:
    ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 1.6rem;
  letter-spacing: 0.1rem;
  font-weight: 700;
  color: var(--primary);
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" }>`
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  border: 1px solid
    ${(p) => (p.$variant === "primary" ? "transparent" : "rgba(255,255,255,0.2)")};
  background: ${(p) =>
    p.$variant === "primary"
      ? "linear-gradient(135deg, var(--primary), var(--accent))"
      : "rgba(255,255,255,0.05)"};
  color: white;
  transition: transform 0.15s ease;
  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.85rem 1rem;
  background: rgba(108, 99, 255, 0.1);
  color: var(--text);
  font-size: 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Td = styled.td`
  padding: 0.85rem 1rem;
  color: var(--text-secondary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.9rem;
`;

function fmtMoney(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default function AffiliateDashboardPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const connectState = searchParams.get("connect");

  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<AffiliateRow | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [copied, setCopied] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = affiliate ? `${baseUrl}/?ref=${affiliate.code}` : "";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/affiliate/stats");
      const json = await res.json();
      if (res.ok) {
        setAffiliate(json.affiliate);
        setStats(json.stats ?? null);
        setPayouts(json.payouts ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const acceptTos = async () => {
    try {
      const res = await fetch("/api/affiliate/stats", { method: "POST" });
      if (res.ok) {
        await load();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConnect = async () => {
    setConnectLoading(true);
    try {
      const res = await fetch("/api/affiliate/connect/onboard", {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok && json.url) {
        window.location.href = json.url;
      } else {
        alert(json.error || "Failed to start onboarding.");
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setConnectLoading(false);
    }
  };

  const copyShare = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!user) return null;

  if (loading) {
    return (
      <Container>
        <Title>
          <FaUserFriends /> Affiliate
        </Title>
        <Subtitle>Loading...</Subtitle>
      </Container>
    );
  }

  if (!affiliate) {
    return (
      <Container>
        <Title>
          <FaUserFriends /> Affiliate
        </Title>
        <Subtitle>
          You are not currently enrolled in the Cymasphere affiliate program.
          Affiliates are invite-only. If you&apos;d like to be considered,
          please reach out via the support page.
        </Subtitle>
      </Container>
    );
  }

  if (!affiliate.tos_accepted_at) {
    return (
      <Container>
        <Title>
          <FaUserFriends /> Affiliate program terms
        </Title>
        <Subtitle>
          Before you start sharing your code, please review and accept the
          affiliate program terms.
        </Subtitle>
        <Card>
          <h3 style={{ marginTop: 0 }}>Cymasphere affiliate terms — summary</h3>
          <ul
            style={{
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              paddingLeft: "1.2rem",
            }}
          >
            <li>
              Customers who use your code <code>{affiliate.code}</code> save{" "}
              {affiliate.customer_discount_percent.toFixed(0)}% for{" "}
              {affiliate.recurring_months} months.
            </li>
            <li>
              You earn{" "}
              {(affiliate.commission_rate_subscription * 100).toFixed(0)}% on
              each paid subscription invoice for{" "}
              {affiliate.recurring_months} months, or{" "}
              {(affiliate.commission_rate_lifetime * 100).toFixed(0)}% on a
              lifetime purchase (one-time).
            </li>
            <li>
              Commissions are held in <em>pending</em> status for 30 days to
              absorb refunds, then become available for payout.
            </li>
            <li>
              Payouts run via Stripe Connect once your available balance
              crosses{" "}
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(affiliate.payout_minimum_cents / 100)}
              .
            </li>
            <li>
              Self-referrals (using your own code on your own purchase) are
              blocked at checkout. Attempting to circumvent this may result in
              suspension and forfeiture of unpaid balance.
            </li>
            <li>
              Refunded charges void the matching commission. If the commission
              has already been paid, the corresponding amount is debited from
              your next payout.
            </li>
            <li>
              We reserve the right to suspend or terminate the affiliate
              relationship at any time. Approved-but-unpaid commissions
              accumulated before termination will be paid out subject to the
              normal minimum.
            </li>
          </ul>
          <Button
            $variant="primary"
            onClick={acceptTos}
            style={{ marginTop: "1rem" }}
          >
            <FaCheckCircle /> I agree to the affiliate terms
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Title>
        <FaUserFriends /> Affiliate
      </Title>
      <Subtitle>
        Share your code, earn {(affiliate.commission_rate_subscription * 100).toFixed(0)}% on every
        subscription invoice for {affiliate.recurring_months} months and{" "}
        {(affiliate.commission_rate_lifetime * 100).toFixed(0)}% on lifetime
        purchases.
      </Subtitle>

      {affiliate.status === "suspended" && (
        <Banner $tone="danger">
          <FaExclamationTriangle /> Your affiliate account is currently
          suspended. New attributions are paused. Contact support for details.
        </Banner>
      )}

      {connectState === "done" && (
        <Banner $tone="success">
          <FaCheckCircle /> Stripe Connect onboarding complete. You can now
          receive payouts.
        </Banner>
      )}
      {connectState === "pending" && (
        <Banner $tone="warn">
          <FaExclamationTriangle /> Stripe still needs a few more details
          before you can receive payouts. Tap the button below to finish.
        </Banner>
      )}
      {connectState === "error" && (
        <Banner $tone="danger">
          <FaExclamationTriangle /> Something went wrong returning from
          Stripe. Try again — your data was not lost.
        </Banner>
      )}

      <CodeCard>
        <div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            Your code
          </div>
          <CodeText>{affiliate.code}</CodeText>
          <div
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.85rem",
              marginTop: "0.25rem",
            }}
          >
            Customers save{" "}
            {affiliate.customer_discount_percent.toFixed(0)}% for{" "}
            {affiliate.recurring_months} months.
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Button $variant="primary" onClick={copyShare}>
            <FaCopy /> {copied ? "Copied!" : "Copy share link"}
          </Button>
          <div
            style={{
              fontFamily:
                "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
              fontSize: "0.85rem",
              color: "var(--text-secondary)",
              wordBreak: "break-all",
              maxWidth: 320,
            }}
          >
            {shareUrl}
          </div>
        </div>
      </CodeCard>

      <Grid>
        <Card>
          <CardTitle>
            <FaPiggyBank /> Available for payout
          </CardTitle>
          <Big>
            {stats ? fmtMoney(Math.max(0, stats.availableCents), stats.currency) : "$0.00"}
          </Big>
          <Small>
            Minimum payout {fmtMoney(affiliate.payout_minimum_cents)}. Pending
            balance becomes available 30 days after each conversion.
          </Small>
        </Card>
        <Card>
          <CardTitle>
            <FaTag /> Pending
          </CardTitle>
          <Big>{stats ? fmtMoney(stats.pendingCents, stats.currency) : "$0.00"}</Big>
          <Small>
            From recent conversions still inside the 30-day refund window.
          </Small>
        </Card>
        <Card>
          <CardTitle>Total paid out</CardTitle>
          <Big>{stats ? fmtMoney(stats.paidCents, stats.currency) : "$0.00"}</Big>
          <Small>{stats?.totalCount ?? 0} attributed conversions all-time.</Small>
        </Card>
        <Card>
          <CardTitle>Stripe Connect</CardTitle>
          {affiliate.connect_payouts_enabled ? (
            <>
              <Big style={{ fontSize: "1.4rem", color: "#10b981" }}>
                Enabled
              </Big>
              <Small>
                You&apos;ll receive direct deposits to the bank account on file
                with Stripe.
              </Small>
            </>
          ) : (
            <>
              <Big style={{ fontSize: "1.4rem", color: "#9ca3af" }}>
                Not setup
              </Big>
              <Small>
                Onboard with Stripe to receive payouts. We use Stripe Express,
                which handles tax forms (1099 / W-8BEN) and direct deposit.
              </Small>
              <div style={{ marginTop: "0.75rem" }}>
                <Button
                  $variant="primary"
                  onClick={handleConnect}
                  disabled={connectLoading}
                >
                  <FaExternalLinkAlt />
                  {connectLoading ? "Opening..." : "Start onboarding"}
                </Button>
              </div>
            </>
          )}
        </Card>
      </Grid>

      <h2
        style={{
          color: "var(--text)",
          fontSize: "1.4rem",
          marginBottom: "1rem",
        }}
      >
        Payout history
      </h2>
      {payouts.length === 0 ? (
        <Card>
          <Small>
            No payouts yet. Approved balance is paid out in batches once you
            cross the {fmtMoney(affiliate.payout_minimum_cents)} minimum.
          </Small>
        </Card>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Amount</Th>
              <Th>Commissions</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id}>
                <Td>{new Date(p.created_at).toLocaleString()}</Td>
                <Td>{fmtMoney(p.amount_cents, p.currency)}</Td>
                <Td>{p.commission_count}</Td>
                <Td style={{ textTransform: "capitalize" }}>{p.status}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}
