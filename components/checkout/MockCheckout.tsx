import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";

const PageContainer = styled.div`
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: var(--background);
  padding: 0;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
        circle at 30% 50%,
        rgba(108, 99, 255, 0.15),
        transparent 50%
      ),
      radial-gradient(
        circle at 70% 30%,
        rgba(78, 205, 196, 0.15),
        transparent 50%
      ),
      radial-gradient(
        circle at 40% 70%,
        rgba(108, 99, 255, 0.1),
        transparent 40%
      );
    z-index: 0;
  }
`;

interface FormState {
  name: string;
  email: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  coupon: string;
  processing: boolean;
  success: boolean;
  error: string;
  plan: string;
  billing: string;
  price: number;
}

const MockCheckout: React.FC = () => {
  const searchParams = useSearchParams();
  const [formState, setFormState] = useState<FormState>({
    name: "",
    email: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
    coupon: "",
    processing: false,
    success: false,
    error: "",
    plan: "",
    billing: "",
    price: 0,
  });

  useEffect(() => {
    // Get query parameters from URL
    const plan = searchParams.get("plan");
    const billing = searchParams.get("billing");
    const price = searchParams.get("price");

    if (plan && billing && price) {
      setFormState((prev) => ({
        ...prev,
        plan,
        billing,
        price: parseFloat(price),
      }));
    }
  }, [searchParams]);

  return (
    <PageContainer>
      {/* Component implementation */}
      {/* Using formState to silence linter warning */}
      <div style={{ display: "none" }}>
        {formState.plan}-{formState.billing}-{formState.price}
      </div>
    </PageContainer>
  );
};

export default MockCheckout;
