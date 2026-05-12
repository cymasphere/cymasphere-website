"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserFriends,
  FaPlus,
  FaTimes,
  FaSave,
  FaCheckCircle,
  FaPauseCircle,
  FaCopy,
  FaCog,
  FaSearch,
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
  stripe_connect_account_id: string | null;
  connect_payouts_enabled: boolean;
  status: "active" | "suspended";
  notes: string | null;
  created_at: string;
}

interface ProfileLite {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}

const Container = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 1rem;
  svg {
    color: var(--primary);
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0;
`;

const Button = styled.button<{ $variant?: "primary" | "secondary" | "danger" }>`
  padding: 0.75rem 1.5rem;
  background: ${(p) =>
    p.$variant === "primary"
      ? "linear-gradient(135deg, var(--primary), var(--accent))"
      : p.$variant === "danger"
        ? "linear-gradient(135deg, #ef4444, #dc2626)"
        : "rgba(255, 255, 255, 0.05)"};
  color: ${(p) => (p.$variant === "secondary" ? "var(--text)" : "white")};
  border: 1px solid
    ${(p) =>
      p.$variant === "secondary" ? "rgba(255,255,255,0.2)" : "transparent"};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(108, 99, 255, 0.3);
  }
  &:disabled {
    opacity: 0.5;
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

const Thead = styled.thead`
  background: rgba(108, 99, 255, 0.1);
`;

const Th = styled.th`
  padding: 1rem;
  text-align: left;
  color: var(--text);
  font-weight: 600;
  font-size: 0.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Td = styled.td`
  padding: 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const StatusBadge = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.7rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${(p) =>
    p.$active ? "rgba(16, 185, 129, 0.2)" : "rgba(107, 114, 128, 0.2)"};
  color: ${(p) => (p.$active ? "#10b981" : "#9ca3af")};
  border: 1px solid
    ${(p) =>
      p.$active ? "rgba(16, 185, 129, 0.3)" : "rgba(107, 114, 128, 0.3)"};
`;

const CodeChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.65rem;
  border-radius: 6px;
  font-family:
    ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.85rem;
  font-weight: 700;
  background: rgba(108, 99, 255, 0.15);
  color: var(--primary);
  border: 1px solid rgba(108, 99, 255, 0.3);
  cursor: pointer;
`;

const Modal = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
  overflow-y: auto;
`;

const ModalContent = styled(motion.div)`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const FormRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Label = styled.label`
  font-size: 0.9rem;
  color: var(--text);
  font-weight: 500;
`;

const Input = styled.input`
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text);
  font-size: 1rem;
  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const Help = styled.span`
  font-size: 0.75rem;
  color: var(--text-secondary);
`;

const ErrorBox = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: #fecaca;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const Empty = styled.div`
  padding: 3rem;
  text-align: center;
  color: var(--text-secondary);
`;

const SearchWrap = styled.div`
  position: relative;
  margin-bottom: 1rem;
  svg {
    position: absolute;
    left: 0.85rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
  }
`;

const SearchInput = styled(Input)`
  padding-left: 2.5rem;
`;

export default function AdminAffiliatesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [users, setUsers] = useState<ProfileLite[]>([]);
  const [userQuery, setUserQuery] = useState("");

  const [form, setForm] = useState({
    userId: "",
    code: "",
    customerDiscountPercent: 20,
    commissionRateSubscription: 0.2,
    commissionRateLifetime: 0.2,
    recurringMonths: 12,
    payoutMinimumCents: 5000,
    notes: "",
  });

  const fetchAffiliates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/affiliates");
      const json = await res.json();
      if (res.ok) {
        setAffiliates(json.affiliates || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAffiliates();
  }, [fetchAffiliates]);

  const searchUsers = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setUsers([]);
      return;
    }
    try {
      const res = await fetch(
        `/api/admin/affiliates/search-users?q=${encodeURIComponent(q)}`,
      );
      if (res.ok) {
        const json = await res.json();
        setUsers(json.users || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(userQuery), 250);
    return () => clearTimeout(t);
  }, [userQuery, searchUsers]);

  const filtered = useMemo(() => {
    if (!search) return affiliates;
    const s = search.toLowerCase();
    return affiliates.filter(
      (a) =>
        a.code.toLowerCase().includes(s) ||
        a.user_id.toLowerCase().includes(s) ||
        (a.notes ?? "").toLowerCase().includes(s),
    );
  }, [affiliates, search]);

  const handleCreate = async () => {
    setCreateError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) {
        setCreateError(json.error || "Failed to create affiliate");
        return;
      }
      setShowCreate(false);
      setForm({
        userId: "",
        code: "",
        customerDiscountPercent: 20,
        commissionRateSubscription: 0.2,
        commissionRateLifetime: 0.2,
        recurringMonths: 12,
        payoutMinimumCents: 5000,
        notes: "",
      });
      setUserQuery("");
      setUsers([]);
      await fetchAffiliates();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (a: Affiliate) => {
    const next = a.status === "active" ? "suspended" : "active";
    try {
      const res = await fetch(`/api/admin/affiliates/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        await fetchAffiliates();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copy = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  if (!user?.is_admin) return null;

  return (
    <Container>
      <Header>
        <div>
          <Title>
            <FaUserFriends /> Affiliates
          </Title>
          <Subtitle>
            Invite-only affiliate program. Each code doubles as a Stripe
            promotion code that gives the customer a discount.
          </Subtitle>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link href="/admin/affiliates/commissions">
            <Button $variant="secondary">Commissions</Button>
          </Link>
          <Link href="/admin/affiliates/payouts">
            <Button $variant="secondary">Payouts</Button>
          </Link>
          <Button $variant="primary" onClick={() => setShowCreate(true)}>
            <FaPlus /> New Affiliate
          </Button>
        </div>
      </Header>

      <SearchWrap>
        <FaSearch />
        <SearchInput
          placeholder="Search by code, user id, or notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </SearchWrap>

      {loading ? (
        <Empty>Loading...</Empty>
      ) : filtered.length === 0 ? (
        <Empty>No affiliates yet. Click &quot;New Affiliate&quot; to invite one.</Empty>
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Code</Th>
              <Th>Discount</Th>
              <Th>Sub Rate</Th>
              <Th>Lifetime Rate</Th>
              <Th>Months</Th>
              <Th>Status</Th>
              <Th>Connect</Th>
              <Th>Actions</Th>
            </tr>
          </Thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <Td>
                  <CodeChip
                    onClick={() => copy(a.code)}
                    title="Click to copy code"
                  >
                    {a.code} <FaCopy size={10} />
                  </CodeChip>
                </Td>
                <Td>{a.customer_discount_percent}% off</Td>
                <Td>{(a.commission_rate_subscription * 100).toFixed(1)}%</Td>
                <Td>{(a.commission_rate_lifetime * 100).toFixed(1)}%</Td>
                <Td>{a.recurring_months}</Td>
                <Td>
                  <StatusBadge $active={a.status === "active"}>
                    {a.status === "active" ? (
                      <FaCheckCircle />
                    ) : (
                      <FaPauseCircle />
                    )}
                    {a.status}
                  </StatusBadge>
                </Td>
                <Td>
                  {a.connect_payouts_enabled ? (
                    <StatusBadge $active>Enabled</StatusBadge>
                  ) : (
                    <StatusBadge $active={false}>Not setup</StatusBadge>
                  )}
                </Td>
                <Td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button
                      $variant="secondary"
                      onClick={() => toggleStatus(a)}
                      style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
                    >
                      {a.status === "active" ? "Suspend" : "Activate"}
                    </Button>
                    <Link href={`/admin/affiliates/${a.id}`}>
                      <Button
                        $variant="secondary"
                        style={{
                          padding: "0.4rem 0.75rem",
                          fontSize: "0.85rem",
                        }}
                      >
                        <FaCog /> Details
                      </Button>
                    </Link>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <AnimatePresence>
        {showCreate && (
          <Modal
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <ModalContent
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                }}
              >
                <h2 style={{ margin: 0, color: "var(--text)" }}>New Affiliate</h2>
                <button
                  onClick={() => setShowCreate(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              {createError && <ErrorBox>{createError}</ErrorBox>}

              <FormRow>
                <Label>User (search by email)</Label>
                <Input
                  placeholder="Type at least 2 characters..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                />
                {users.length > 0 && (
                  <div
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    {users.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => {
                          setForm((f) => ({ ...f, userId: u.id }));
                          setUserQuery(u.email || u.id);
                          setUsers([]);
                        }}
                        style={{
                          padding: "0.6rem 0.85rem",
                          cursor: "pointer",
                          borderBottom: "1px solid rgba(255,255,255,0.05)",
                          color: "var(--text)",
                          fontSize: "0.9rem",
                        }}
                      >
                        {u.email || u.id}
                        {(u.first_name || u.last_name) && (
                          <span style={{ color: "var(--text-secondary)" }}>
                            {" "}
                            — {u.first_name} {u.last_name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {form.userId && (
                  <Help>Selected user id: {form.userId}</Help>
                )}
              </FormRow>

              <FormRow>
                <Label>Affiliate code (uppercase, A-Z 0-9, 3-32 chars)</Label>
                <Input
                  placeholder="ALICE"
                  value={form.code}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                    })
                  }
                />
                <Help>
                  Customers will type this at checkout to receive the discount.
                </Help>
              </FormRow>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <FormRow>
                  <Label>Customer discount %</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={form.customerDiscountPercent}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        customerDiscountPercent: Number(e.target.value),
                      })
                    }
                  />
                </FormRow>
                <FormRow>
                  <Label>Recurring months</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.recurringMonths}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        recurringMonths: Number(e.target.value),
                      })
                    }
                  />
                  <Help>
                    Both the customer discount and the affiliate commission span
                    this many months.
                  </Help>
                </FormRow>
                <FormRow>
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
                </FormRow>
                <FormRow>
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
                </FormRow>
              </div>

              <FormRow>
                <Label>Payout minimum (USD)</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={form.payoutMinimumCents / 100}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      payoutMinimumCents: Math.round(
                        Number(e.target.value) * 100,
                      ),
                    })
                  }
                />
              </FormRow>

              <FormRow>
                <Label>Internal notes (optional)</Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </FormRow>

              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  justifyContent: "flex-end",
                  marginTop: "1rem",
                }}
              >
                <Button
                  $variant="secondary"
                  onClick={() => setShowCreate(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  $variant="primary"
                  onClick={handleCreate}
                  disabled={
                    creating ||
                    !form.userId ||
                    !form.code ||
                    form.code.length < 3
                  }
                >
                  <FaSave />
                  {creating ? "Creating..." : "Create Affiliate"}
                </Button>
              </div>
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>
    </Container>
  );
}
