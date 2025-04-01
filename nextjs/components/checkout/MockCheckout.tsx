import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import {
  FaLock,
  FaCreditCard,
  FaCalendarAlt,
  FaShieldAlt,
  FaArrowLeft,
} from "react-icons/fa";
import CymasphereLogo from "../common/CymasphereLogo";

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

const HeaderNav = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 0;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 30px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const BackButton = styled(Link)`
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 1rem;
  z-index: 10;
  padding: 10px 0;
  margin-top: 10px;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    color: var(--text);
  }

  svg {
    margin-right: 8px;
  }
`;

const MainContent = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 80px;
  z-index: 5;
  position: relative;
`;

const CheckoutContainer = styled.div`
  max-width: 700px;
  width: 100%;
  padding: 25px 30px;
  background: rgba(25, 23, 36, 0.85);
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin: 0 20px;

  &:before {
    content: "";
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    background: linear-gradient(
      135deg,
      rgba(108, 99, 255, 0.5) 0%,
      rgba(108, 99, 255, 0) 50%,
      rgba(78, 205, 196, 0.5) 100%
    );
    border-radius: 18px;
    z-index: -1;
    opacity: 0.4;
    filter: blur(8px);
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Title = styled.h1`
  font-size: 1.8rem;
  margin-bottom: 5px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const OrderSummary = styled.div`
  background: rgba(30, 28, 42, 0.5);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
`;

const OrderItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
`;

const Label = styled.span`
  color: var(--text-secondary);
`;

const Value = styled.span`
  color: var(--text);
  font-weight: 600;
`;

const Total = styled(OrderItem)`
  font-weight: 600;
  padding-top: 8px;
  margin-top: 3px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: none;

  label {
    font-size: 1.05rem;
  }

  div {
    font-size: 1.1rem;
    color: var(--primary);
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const InputLabel = styled.label`
  display: block;
  margin-bottom: 5px;
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  background-color: rgba(15, 14, 23, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text);
  font-size: 0.95rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 1px var(--primary);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const InputRow = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 15px;

  @media (max-width: 600px) {
    flex-direction: column;
    gap: 15px;
  }
`;

const CardNumberField = styled.div`
  flex: 10;
`;

const CardExpiryField = styled.div`
  flex: 2;
`;

const CardCvcField = styled.div`
  flex: 1.5;
`;

const InputWithIcon = styled.div`
  position: relative;

  svg {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-secondary);
  }
`;

// Helper to get query parameters in Next.js
interface QueryParams {
  [key: string]: string;
}

const useQueryParams = (): QueryParams => {
  const router = useRouter();
  const [queryParams, setQueryParams] = useState<QueryParams>({});

  useEffect(() => {
    if (router.isReady) {
      setQueryParams(router.query as QueryParams);
    }
  }, [router.isReady, router.query]);

  return queryParams;
};

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
  const router = useRouter();
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

  const formatPrice = (): string => {
    const prices: Record<string, Record<string, number>> = {
      starter: { monthly: 0, yearly: 0 },
      pro: { monthly: 19, yearly: 190 },
      enterprise: { monthly: 49, yearly: 490 },
    };

    const price = prices[formState.plan]?.[formState.billing] || 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatCardNumber = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "");

    // Add a space after every 4 digits
    let formatted = "";
    for (let i = 0; i < digits.length; i += 4) {
      formatted += digits.slice(i, i + 4) + " ";
    }

    // Remove trailing space and limit to 19 characters (16 digits + 3 spaces)
    return formatted.trim().slice(0, 19);
  };

  const formatExpiryDate = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, "");

    // Format as MM / YY
    if (digits.length <= 2) {
      return digits;
    } else {
      return digits.slice(0, 2) + " / " + digits.slice(2, 4);
    }
  };

  const formatCVC = (value: string): string => {
    // Allow only digits and limit to 3-4 characters
    return value.replace(/\D/g, "").slice(0, 4);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;

    // Format the input values based on their type
    let formattedValue = value;

    if (name === "cardNumber") {
      formattedValue = formatCardNumber(value);
    } else if (name === "expiry") {
      formattedValue = formatExpiryDate(value);
    } else if (name === "cvc") {
      formattedValue = formatCVC(value);
    }

    setFormState((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const handleBackToPricing = (
    e: React.MouseEvent<HTMLAnchorElement>
  ): void => {
    e.preventDefault();
    router.push("/pricing");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setFormState((prev) => ({ ...prev, processing: true, error: "" }));

    // Simulate processing time
    setTimeout(() => {
      setFormState((prev) => ({ ...prev, processing: false, success: true }));

      // Redirect to dashboard after payment success
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }, 1500);
  };

  return <PageContainer>{/* Component implementation */}</PageContainer>;
};

export default MockCheckout;
