import React, { useState } from "react";
// import { loadStripe } from "@stripe/stripe-js";
import styled from "styled-components";
import { useRouter } from "next/router";

// Use environment variable for Stripe publishable key with a fallback
// This ensures we at least have a valid string for Stripe initialization in all environments
// const stripePromise = loadStripe(
//   process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "pk_test_51Placeholder"
// );

const CheckoutButton = styled.button`
  display: block;
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  font-size: 1rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  margin-top: 15px;
  box-shadow: 0 4px 15px rgba(108, 99, 255, 0.3);
  position: relative;
  z-index: 10;
  pointer-events: auto !important;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 18px rgba(108, 99, 255, 0.5);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const StatusMessage = styled.div`
  margin-top: 10px;
  text-align: center;
  color: ${(props) => (props.$error ? "var(--error)" : "var(--success)")};
  font-size: 0.9rem;
`;

/**
 * StripeCheckout component for handling Stripe checkout sessions
 * @param {Object} props
 * @param {string} props.priceId - The Stripe price ID for the selected plan
 * @param {string} props.buttonText - Text to display on the checkout button
 * @param {string} props.billingPeriod - The selected billing period (monthly, yearly, or lifetime)
 * @param {string} props.price - The price of the plan to display
 */
const StripeCheckout = ({
  priceId,
  buttonText,
  billingPeriod,
  price,
  trialDays,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Check if we're in development mode
  // In production, this would be set to 'production'
  const isDevelopment = process.env.NODE_ENV !== "production";

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      // For development environment, always use mock checkout to avoid 404 errors
      if (isDevelopment) {
        console.log("Development mode: Redirecting to mock checkout");
        console.log("Checkout initiated with:", {
          priceId,
          billingPeriod,
          price,
        });

        // Give some time for the loading state to show
        setTimeout(() => {
          // Redirect to mock checkout page with plan details and force a refresh
          window.location.href = `/mock-checkout?plan=Cymasphere Pro&billing=${billingPeriod}&price=${price}`;
          setIsLoading(false);
        }, 800);
        return;
      }

      // For production, proceed with actual Stripe checkout
      // const stripe = await stripePromise;

      try {
        // Make a request to your backend to create a checkout session
        // In production, this would be the correct API endpoint
        const apiUrl =
          process.env.REACT_APP_API_URL || "https://api.cymasphere.com";

        const response = await fetch(`${apiUrl}/create-checkout-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            priceId,
            billingPeriod,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to create checkout session"
          );
        }

        const session = await response.json();

        // Redirect to Stripe Checkout
        // const result = await stripe.redirectToCheckout({
        //   sessionId: session.id,
        // });

        // if (result.error) {
        //   throw new Error(result.error.message);
        // }
      } catch (fetchError) {
        console.error("Error fetching checkout session:", fetchError);
        throw new Error(
          "Unable to connect to the payment server. Please try again later."
        );
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      setErrorMessage(
        error.message || "Something went wrong. Please try again."
      );
      setIsLoading(false);
    }
  };

  return (
    <>
      <CheckoutButton onClick={handleCheckout} disabled={isLoading}>
        {isLoading ? "Processing..." : buttonText}
      </CheckoutButton>

      {errorMessage && <StatusMessage $error>{errorMessage}</StatusMessage>}
    </>
  );
};

export default StripeCheckout;
