"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styled from "styled-components";
import {
  FaUserFriends,
  FaArrowLeft,
  FaSave,
  FaPiggyBank,
  FaCheckCircle,
  FaPauseCircle,
} from "react-icons/fa";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface Affiliate {
  id: string;
  user_id: string;
  code: string;
  customer_discount_percent: number;
  commission_rate_subscription: number;
  commission_rate_lifetime: number;
  recurring_months: number;
  payout_minimum_cents: number;
  stripe_coupon_id: string;
  stripe_promotion_code_id: string;
  stripe_connect_account_id: string | null;
  connect_payouts_enabled: boolean;
  status: "active" | "suspended";
  notes: string | null;
  created_at: string;
}

interface Stats {
  pendingCents: number;
  approvedCents: number;
  paidCents: number;
  refundedCents: number;
  voidCents: number;
  totalCount: number;
}

interface Commission {
  id: string;
  created_at: string;
  product_kind: string;
  recurring_month_index: number | null;
  gross_amount_cents: number;
  commission_amount_cents: number;
  currency: string;
  status: string;
  approve_at: string;
  paid_at: string | null;
}

interface Payout {
  id: string;
  created_at: string;
  amount_cents: number;
  currency: string;
  commission_count: number;
  adjustment_total_cents: number;
  status: string;
  stripe_transfer_id: string | null;
  failure_reason: string | null;
}

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
`;

const Back = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  margin-bottom: 1rem;
  &:hover {
    color: var(--text);
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--text);
  margin-bottom: 0.5rem;
  svg {
    color: var(--primary);
  }
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const Card = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const Section = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const SectionTitle = styled.h2`
  margin: 0 0 1rem;
  font-size: 1.2rem;
  color: var(--text);
`;

const Stat = styled.div`
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text);
`;

const StatLabel = styled.div`
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1rem;
`;

const Label = styled.label`
  font-size: 0.85rem;
  color: var(--text-secondary);
`;

const Input = styled.input`
  padding: 0.6rem 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text);
  font-size: 0.95rem;
  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" | "danger" }>`
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  border: 1px solid
    ${(p) => (p.$variant === "secondary" ? "rgba(255,255,255,0.2)" : "transparent")};
  background: ${(p) =>
    p.$variant === "primary"
      ? "linear-gradient(135deg, var(--primary), var(--accent))"
      : p.$variant === "danger"
        ? "linear-gradient(135deg, #ef4444, #dc2626)"
        : "rgba(255,255,255,0.05)"};
  color: white;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;
const Th = styled.th`
  text-align: left;
  padding: 0.7rem 0.85rem;
  background: rgba(108, 99, 255, 0.1);
  color: var(--text);
  font-size: 0.85rem;
`;
const Td = styled.td`
  padding: 0.7rem 0.85rem;
  color: var(--text-secondary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.9rem;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  background: ${(p) => {
    switch (p.$status) {
      case "approved":
        return "rgba(16,185,129,0.2)";
      case "pending":
        return "rgba(245,158,11,0.2)";
      case "paid":
        return "rgba(108,99,255,0.2)";
      case "refunded":
        return "rgba(239,68,68,0.2)";
      case "void":
        return "rgba(107,114,128,0.2)";
      default:
        return "rgba(107,114,128,0.2)";
    }
  }};
  color: ${(p) => {
    switch (p.$status) {
      case "approved":
        return "#6ee7b7";
      case "pending":
        return "#fcd34d";
      case "paid":
        return "#c4b5fd";
      case "refunded":
        return "#fca5a5";
      default:
        return "#9ca3af";
    }
  }};
`;

function fmtMoney(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default function AdminAffiliateDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);

  const [saving, setSaving] = useState(false);
  const [runningPayout, setRunningPayout] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    commissionRateSubscription: 0.2,
    commissionRateLifetime: 0.2,
    recurringMonths: 12,
    payoutMinimumCents: 5000,
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [detailRes, commRes, payRes] = await Promise.all([
        fetch(`/api/admin/affiliates/${id}`),
        fetch(`/api/admin/affiliates/commissions?affiliateId=${id}&limit=100`),
        fetch(`/api/admin/affiliates/payouts?affiliateId=${id}&limit=50`),
      ]);
      const detail = await detailRes.json();
      const comm = await commRes.json();
      const pay = await payRes.json();
      if (detail.success) {
        setAffiliate(detail.affiliate);
        setStats(detail.stats);
        setForm({
          commissionRateSubscription:
            detail.affiliate.commission_rate_subscription,
          commissionRateLifetime: detail.affiliate.commission_rate_lifetime,
          recurringMonths: detail.affiliate.recurring_months,
          payoutMinimumCents: detail.affiliate.payout_minimum_cents,
          notes: detail.affiliate.notes ?? "",
        });
      } else {
        setError(detail.error || "Not found");
      }
      if (comm.success) setCommissions(comm.commissions);
      if (pay.success) setPayouts(pay.payouts);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/affiliates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to save");
      } else {
        await load();
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!affiliate) return;
    const next = affiliate.status === "active" ? "suspended" : "active";
    const res = await fetch(`/api/admin/affiliates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) await load();
  };

  const runPayout = async () => {
    if (!affiliate) return;
    if (
      !window.confirm(
        `Run payout for ${affiliate.code}? This transfers funds via Stripe Connect.`,
      )
    ) {
      return;
    }
    setRunningPayout(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/affiliates/payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId: id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Payout failed");
      } else {
        await load();
      }
    } finally {
      setRunningPayout(false);
    }
  };

  if (!user?.is_admin) return null;

  if (loading) {
    return (
      <Container>
        <Subtitle>Loading...</Subtitle>
      </Container>
    );
  }
  if (!affiliate) {
    return (
      <Container>
        <Back href="/admin/affiliates">
          <FaArrowLeft /> Back
        </Back>
        <Subtitle>{error || "Affiliate not found."}</Subtitle>
      </Container>
    );
  }

  return (
    <Container>
      <Back href="/admin/affiliates">
        <FaArrowLeft /> Back to affiliates
      </Back>
      <Title>
        <FaUserFriends /> {affiliate.code}
      </Title>
      <Subtitle>
        Created {new Date(affiliate.created_at).toLocaleDateString()} ·
        user_id <code>{affiliate.user_id}</code>
      </Subtitle>

      {error && (
        <Section
          style={{
            background: "rgba(239,68,68,0.1)",
            borderColor: "rgba(239,68,68,0.3)",
            color: "#fecaca",
          }}
        >
          {error}
        </Section>
      )}

      <Grid>
        <Card>
          <StatLabel>Pending</StatLabel>
          <Stat>{stats ? fmtMoney(stats.pendingCents) : "$0.00"}</Stat>
        </Card>
        <Card>
          <StatLabel>Approved (available)</StatLabel>
          <Stat>{stats ? fmtMoney(stats.approvedCents) : "$0.00"}</Stat>
        </Card>
        <Card>
          <StatLabel>Paid out</StatLabel>
          <Stat>{stats ? fmtMoney(stats.paidCents) : "$0.00"}</Stat>
        </Card>
        <Card>
          <StatLabel>Status / Connect</StatLabel>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {affiliate.status === "active" ? (
              <StatusBadge $status="approved">
                <FaCheckCircle /> Active
              </StatusBadge>
            ) : (
              <StatusBadge $status="void">
                <FaPauseCircle /> Suspended
              </StatusBadge>
            )}
          </div>
          <div style={{ fontSize: "0.85rem", marginTop: 6, color: "var(--text-secondary)" }}>
            {affiliate.connect_payouts_enabled
              ? "Connect: payouts enabled"
              : "Connect: not setup"}
          </div>
        </Card>
      </Grid>

      <Section>
        <SectionTitle>Settings</SectionTitle>
        <Row>
          <Field>
            <Label>Subscription commission %</Label>
            <Input
              type="number"
              min={1}
              max={100}
              step={0.5}
              value={form.commissionRateSubscription * 100}
              onChange={(e) =>
                setForm({
                  ...form,
                  commissionRateSubscription: Number(e.target.value) / 100,
                })
              }
            />
          </Field>
          <Field>
            <Label>Lifetime commission %</Label>
            <Input
              type="number"
              min={1}
              max={100}
              step={0.5}
              value={form.commissionRateLifetime * 100}
              onChange={(e) =>
                setForm({
                  ...form,
                  commissionRateLifetime: Number(e.target.value) / 100,
                })
              }
            />
          </Field>
          <Field>
            <Label>Recurring months</Label>
            <Input
              type="number"
              min={1}
              value={form.recurringMonths}
              onChange={(e) =>
                setForm({ ...form, recurringMonths: Number(e.target.value) })
              }
            />
          </Field>
          <Field>
            <Label>Payout minimum (USD)</Label>
            <Input
              type="number"
              min={0}
              value={form.payoutMinimumCents / 100}
              onChange={(e) =>
                setForm({
                  ...form,
                  payoutMinimumCents: Math.round(Number(e.target.value) * 100),
                })
              }
            />
          </Field>
        </Row>
        <Field>
          <Label>Notes</Label>
          <Input
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Button $variant="primary" onClick={save} disabled={saving}>
            <FaSave /> {saving ? "Saving..." : "Save changes"}
          </Button>
          <Button $variant="secondary" onClick={toggleStatus}>
            {affiliate.status === "active" ? "Suspend" : "Activate"}
          </Button>
          <Button
            $variant="primary"
            onClick={runPayout}
            disabled={
              runningPayout ||
              !affiliate.connect_payouts_enabled ||
              (stats?.approvedCents ?? 0) < affiliate.payout_minimum_cents
            }
          >
            <FaPiggyBank />
            {runningPayout ? "Running..." : "Run payout"}
          </Button>
        </div>
      </Section>

      <Section>
        <SectionTitle>Commissions ({commissions.length})</SectionTitle>
        {commissions.length === 0 ? (
          <div style={{ color: "var(--text-secondary)" }}>
            No commissions yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Plan</Th>
                  <Th>Cycle</Th>
                  <Th>Gross</Th>
                  <Th>Commission</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c.id}>
                    <Td>{new Date(c.created_at).toLocaleString()}</Td>
                    <Td>{c.product_kind}</Td>
                    <Td>
                      {c.recurring_month_index !== null
                        ? `#${c.recurring_month_index + 1}`
                        : "—"}
                    </Td>
                    <Td>{fmtMoney(c.gross_amount_cents, c.currency)}</Td>
                    <Td>{fmtMoney(c.commission_amount_cents, c.currency)}</Td>
                    <Td>
                      <StatusBadge $status={c.status}>{c.status}</StatusBadge>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Section>

      <Section>
        <SectionTitle>Payouts ({payouts.length})</SectionTitle>
        {payouts.length === 0 ? (
          <div style={{ color: "var(--text-secondary)" }}>
            No payouts yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Amount</Th>
                  <Th>Commissions</Th>
                  <Th>Adjustments</Th>
                  <Th>Status</Th>
                  <Th>Transfer</Th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <Td>{new Date(p.created_at).toLocaleString()}</Td>
                    <Td>{fmtMoney(p.amount_cents, p.currency)}</Td>
                    <Td>{p.commission_count}</Td>
                    <Td>{fmtMoney(p.adjustment_total_cents, p.currency)}</Td>
                    <Td>
                      <StatusBadge $status={p.status}>{p.status}</StatusBadge>
                    </Td>
                    <Td>
                      <code>{p.stripe_transfer_id ?? "—"}</code>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Section>
    </Container>
  );
}
