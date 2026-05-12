"use client";

import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import Link from "next/link";
import { FaArrowLeft, FaFilter } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";

interface Commission {
  id: string;
  created_at: string;
  affiliate_id: string;
  referred_customer_id: string;
  product_kind: string;
  recurring_month_index: number | null;
  gross_amount_cents: number;
  commission_amount_cents: number;
  currency: string;
  status: string;
  approve_at: string;
  paid_at: string | null;
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
const Filters = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;
const Select = styled.select`
  padding: 0.6rem 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text);
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
    p.$status === "approved"
      ? "rgba(16,185,129,0.2)"
      : p.$status === "pending"
        ? "rgba(245,158,11,0.2)"
        : p.$status === "paid"
          ? "rgba(108,99,255,0.2)"
          : p.$status === "refunded"
            ? "rgba(239,68,68,0.2)"
            : "rgba(107,114,128,0.2)"};
  color: ${(p) =>
    p.$status === "approved"
      ? "#6ee7b7"
      : p.$status === "pending"
        ? "#fcd34d"
        : p.$status === "paid"
          ? "#c4b5fd"
          : p.$status === "refunded"
            ? "#fca5a5"
            : "#9ca3af"};
`;

function fmtMoney(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default function AdminAffiliatesCommissionsPage() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [kindFilter, setKindFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (statusFilter) params.set("status", statusFilter);
    if (kindFilter) params.set("productKind", kindFilter);
    try {
      const res = await fetch(`/api/admin/affiliates/commissions?${params}`);
      const json = await res.json();
      if (res.ok) setCommissions(json.commissions || []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, kindFilter]);

  useEffect(() => {
    load();
  }, [load]);

  if (!user?.is_admin) return null;

  return (
    <Container>
      <Back href="/admin/affiliates">
        <FaArrowLeft /> Back to affiliates
      </Back>
      <Title>Commissions ledger</Title>
      <Filters>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
          <option value="void">Void</option>
        </Select>
        <Select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
        >
          <option value="">All plans</option>
          <option value="monthly">Monthly</option>
          <option value="annual">Annual</option>
          <option value="lifetime">Lifetime</option>
        </Select>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-secondary)",
            fontSize: "0.85rem",
          }}
        >
          <FaFilter /> {commissions.length} rows
        </span>
      </Filters>

      {loading ? (
        <div style={{ color: "var(--text-secondary)" }}>Loading...</div>
      ) : commissions.length === 0 ? (
        <div style={{ color: "var(--text-secondary)" }}>No commissions found.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Affiliate</Th>
                <Th>Customer</Th>
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
                  <Td>
                    <Link
                      href={`/admin/affiliates/${c.affiliate_id}`}
                      style={{
                        color: "var(--primary)",
                        textDecoration: "none",
                      }}
                    >
                      <code>{c.affiliate_id.slice(0, 8)}</code>
                    </Link>
                  </Td>
                  <Td>
                    <code>{c.referred_customer_id}</code>
                  </Td>
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
    </Container>
  );
}
