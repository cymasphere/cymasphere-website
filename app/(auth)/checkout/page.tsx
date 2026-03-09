/**
 * @fileoverview In-app checkout page for lifetime and subscription plans.
 * @module app/(auth)/checkout/page
 *
 * Renders the shared EmbeddedCheckout component with plan params from the URL.
 * Used when navigating directly to /checkout (e.g. from email links). Inline
 * checkout from the pricing section uses the same EmbeddedCheckout in a modal.
 */

"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { PlanType } from "@/types/stripe";
import { EmbeddedCheckout } from "@/components/checkout/EmbeddedCheckout";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: var(--background);
  padding: 6rem 1.5rem 4rem;
`;

const Content = styled.div`
  max-width: 420px;
  margin: 0 auto;
`;

const validPlans: PlanType[] = ["monthly", "annual", "lifetime"];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") as PlanType | null;
  const collectPaymentMethod =
    searchParams.get("collectPaymentMethod") === "true";
  const isPlanChange = searchParams.get("isPlanChange") === "true";
  const planType = plan && validPlans.includes(plan) ? plan : null;

  useEffect(() => {
    if (plan && !planType) {
      router.replace("/#pricing");
    }
  }, [plan, planType, router]);

  if (!planType) {
    return (
      <PageContainer>
        <Content>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <LoadingSpinner />
          </div>
        </Content>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Content>
        <EmbeddedCheckout
          planType={planType}
          collectPaymentMethod={collectPaymentMethod}
          isPlanChange={isPlanChange}
        />
      </Content>
    </PageContainer>
  );
}
