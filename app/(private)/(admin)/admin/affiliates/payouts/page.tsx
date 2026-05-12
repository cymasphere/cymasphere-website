"use client";

import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";

interface Payout {
  id: string;
  created_at: string;
  affiliate_id: string;
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
`;
const Title = styled.h1`
  font-size: 2rem;
  color: var(--text);
  margin-bottom: 1rem;
`;
const Note = styled.p`
  color: var(--text-secondary);
  margin-bottom: 1rem;
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
`;
const Td = styled.td`
  padding: 0.85rem 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;
const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  background: ${(p) =>
    p.$status === "paid"
      ? "rgba(16,185,129,0.2)"
      : p.$status === "processing"
        ? "rgba(245,158,11,0.2)"
        : "rgba(239,68,68,0.2)"};
  color: ${(p) =>
    p.$status === "paid"
      ? "#6ee7b7"
      : p.$status === "processing"
        ? "#fcd34d"
        : "#fca5a5"};
`;

function fmtMoney(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default function AdminAffiliatesPayoutsPage() {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/affiliates/payouts?limit=200`);
      const json = await res.json();
      if (res.ok) setPayouts(json.payouts || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!user?.is_admin) return null;

  return (
    <Container>
      <Back href="/admin/affiliates">
        <FaArrowLeft /> Back to affiliates
      </Back>
      <Title>Payouts</Title>
      <Note>
        Payouts are run from the per-affiliate detail page (click an affiliate
        on the main list). This view is for historical reference.
      </Note>

      {loading ? (
        <div style={{ color: "var(--text-secondary)" }}>Loading...</div>
      ) : payouts.length === 0 ? (
        <div style={{ color: "var(--text-secondary)" }}>
          No payouts have been run yet.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Affiliate</Th>
                <Th>Amount</Th>
                <Th>Commissions</Th>
                <Th>Adjustments</Th>
                <Th>Status</Th>
                <Th>Transfer ID</Th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <Td>{new Date(p.created_at).toLocaleString()}</Td>
                  <Td>
                    <Link
                      href={`/admin/affiliates/${p.affiliate_id}`}
                      style={{
                        color: "var(--primary)",
                        textDecoration: "none",
                      }}
                    >
                      <code>{p.affiliate_id.slice(0, 8)}</code>
                    </Link>
                  </Td>
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
    </Container>
  );
}
