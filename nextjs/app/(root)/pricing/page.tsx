"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Loader2, CreditCard, Calendar } from "lucide-react";
import {
  PlanType,
  PriceData,
  getPrices,
  initiateCheckout,
} from "@/utils/stripe/actions";
import { useAuth } from "@/components_template/AuthContext";

interface PricingPlan {
  type: PlanType;
  name: string;
  features: string[];
  highlightedFeature?: string;
  mostPopular?: boolean;
  description?: string;
}

export default function PricingPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<PlanType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [priceData, setPriceData] = useState<Record<
    PlanType,
    PriceData
  > | null>(null);
  const [collectPaymentMethod, setCollectPaymentMethod] = useState(false);

  const plans: PricingPlan[] = [
    {
      type: "monthly",
      name: "Basic",
      features: [
        "Full access to all basic features",
        "Unlimited projects",
        "Priority email support",
        "Regular updates",
      ],
      description: "Perfect for getting started with our platform",
    },
    {
      type: "annual",
      name: "Pro",
      features: [
        "All Basic features",
        "Advanced analytics",
        "Team collaboration tools",
        "Priority phone support",
      ],
      mostPopular: true,
      highlightedFeature: "Save compared to monthly",
      description: "Best value for professionals and teams",
    },
    {
      type: "lifetime",
      name: "Lifetime",
      features: [
        "All Pro features",
        "Lifetime updates",
        "Premium support",
        "Future premium features",
      ],
      highlightedFeature: "Best long-term value",
      description: "One-time payment for lifetime access",
    },
  ];

  useEffect(() => {
    async function fetchPrices() {
      try {
        setIsLoadingPrices(true);
        const { prices, error } = await getPrices();

        if (error) {
          throw new Error(error);
        }

        setPriceData(prices);
      } catch (err) {
        console.error("Error fetching prices:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load pricing information"
        );
      } finally {
        setIsLoadingPrices(false);
      }
    }

    fetchPrices();
  }, []);

  // Format the price for display
  function formatPrice(amount: number, currency: string): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount / 100);
  }

  // Calculate the discounted price
  function getDiscountedPrice(price: PriceData): {
    original: string;
    discounted?: string;
    savingsText?: string;
  } {
    if (!price) return { original: "$0.00" };

    const original = formatPrice(price.amount, price.currency);

    if (!price.discount) return { original };

    let discounted;
    let savingsText;

    if (price.discount.percent_off) {
      discounted = formatPrice(
        price.amount * (1 - price.discount.percent_off / 100),
        price.currency
      );
      savingsText = `Save ${price.discount.percent_off}%`;
    } else if (price.discount.amount_off) {
      discounted = formatPrice(
        price.amount - price.discount.amount_off,
        price.currency
      );
      savingsText = `Save ${formatPrice(
        price.discount.amount_off,
        price.discount.currency || price.currency
      )}`;
    }

    return { original, discounted, savingsText };
  }

  async function handleCheckout(planType: PlanType) {
    try {
      setIsLoading(planType);
      setError(null);

      // Get the promotion code if there's a discount for this plan
      const promotionCode = priceData?.[planType]?.discount?.promotion_code;

      // Call the server action directly with optional email, promotion code, and payment preference
      const { url, error: checkoutError } = await initiateCheckout(
        planType,
        user?.email,
        promotionCode,
        collectPaymentMethod
      );

      if (checkoutError || !url) {
        throw new Error(checkoutError || "Failed to create checkout session");
      }

      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (err) {
      console.error("Checkout error:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(null);
    }
  }

  // Get subscription interval for display
  function getInterval(planType: PlanType, priceData?: PriceData): string {
    if (!priceData) {
      return planType === "monthly"
        ? "per month"
        : planType === "annual"
        ? "per year"
        : "one-time payment";
    }

    if (planType === "lifetime") return "one-time payment";

    return priceData.interval === "month"
      ? "per month"
      : priceData.interval === "year"
      ? "per year"
      : priceData.interval
      ? `per ${priceData.interval}`
      : "";
  }

  // Calculate annual savings percentage compared to monthly
  function getAnnualSavings(): string {
    if (!priceData) return "Save compared to monthly";

    const monthly = priceData.monthly;
    const annual = priceData.annual;

    if (!monthly || !annual) return "Save compared to monthly";

    const monthlyCost = monthly.amount;
    const yearlyCost = annual.amount;
    const yearlyEquivalent = monthlyCost * 12;

    if (yearlyEquivalent <= 0) return "Save compared to monthly";

    const savingsPercent = Math.round(
      (1 - yearlyCost / yearlyEquivalent) * 100
    );

    return savingsPercent > 0
      ? `Save ${savingsPercent}% compared to monthly`
      : "Best value plan";
  }

  // Render the trial options section
  const renderTrialOptions = (planType: PlanType) => {
    // Only show trial options for subscription plans (monthly/annual)
    if (planType === "lifetime") return null;

    return (
      <div className="mb-6 mt-4">
        <p className="text-sm text-gray-400 mb-3">Choose your trial option:</p>

        <div className="space-y-3">
          <label
            className={`flex items-start p-3 rounded-lg cursor-pointer transition-colors ${
              !collectPaymentMethod
                ? "bg-indigo-900/30 border border-indigo-500/50"
                : "bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700/50"
            }`}
          >
            <input
              type="radio"
              className="sr-only"
              checked={!collectPaymentMethod}
              onChange={() => setCollectPaymentMethod(false)}
            />
            <Calendar className="h-5 w-5 text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">14-day free trial</div>
              <div className="text-sm text-gray-400">
                No payment method required
              </div>
            </div>
          </label>

          <label
            className={`flex items-start p-3 rounded-lg cursor-pointer transition-colors ${
              collectPaymentMethod
                ? "bg-indigo-900/30 border border-indigo-500/50"
                : "bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700/50"
            }`}
          >
            <input
              type="radio"
              className="sr-only"
              checked={collectPaymentMethod}
              onChange={() => setCollectPaymentMethod(true)}
            />
            <CreditCard className="h-5 w-5 text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">21-day extended trial</div>
              <div className="text-sm text-gray-400">
                Add payment method now (50% longer trial)
              </div>
            </div>
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <h1 className="gradient-heading text-4xl md:text-5xl mb-8">
        Choose Your Plan
      </h1>
      <p className="text-center text-gray-300 mb-6 max-w-2xl mx-auto">
        Select the plan that best fits your needs. All plans include core
        features with varying levels of access and support.
      </p>
      <p className="text-center text-indigo-300 mb-16">
        Start with a free trial, no commitment required.
      </p>

      {isLoadingPrices ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          <span className="ml-3 text-xl">Loading pricing information...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const price = priceData?.[plan.type];
            const { original, discounted, savingsText } = price
              ? getDiscountedPrice(price)
              : {
                  original:
                    plan.type === "monthly"
                      ? "$9.99"
                      : plan.type === "annual"
                      ? "$99.99"
                      : "$299.99",
                };

            // Update annual plan highlighted feature if we have real price data
            const highlightedFeature =
              plan.type === "annual" && priceData?.monthly && priceData?.annual
                ? getAnnualSavings()
                : plan.highlightedFeature;

            return (
              <motion.div
                key={plan.type}
                className={`card relative p-8 flex flex-col ${
                  plan.mostPopular ? "border-indigo-500/50" : ""
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {plan.mostPopular && (
                  <div className="absolute -top-4 left-0 right-0 mx-auto w-max px-4 py-1 bg-gradient text-white text-sm font-semibold rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">
                  {price?.name || plan.name}
                </h3>
                <div className="mb-4">
                  {discounted ? (
                    <div>
                      <span className="text-3xl font-bold">{discounted}</span>
                      <span className="text-gray-400 ml-2">
                        {getInterval(plan.type, price)}
                      </span>
                      <div className="mt-1">
                        <span className="text-gray-400 line-through mr-2">
                          {original}
                        </span>
                        <span className="text-green-400 text-sm font-medium">
                          {savingsText}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold">{original}</span>
                      <span className="text-gray-400 ml-2">
                        {getInterval(plan.type, price)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-gray-300 mb-6">{plan.description}</p>

                {highlightedFeature && (
                  <div className="bg-indigo-900/30 text-indigo-300 px-4 py-2 rounded-lg mb-6 text-sm font-medium">
                    {highlightedFeature}
                  </div>
                )}

                <ul className="mb-8 flex-grow">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start mb-3">
                      <Check className="text-green-400 mr-2 h-5 w-5 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Trial options section for subscription plans */}
                {renderTrialOptions(plan.type)}

                <button
                  className={`btn-primary w-full ${
                    isLoading === plan.type ? "opacity-70" : ""
                  }`}
                  onClick={() => handleCheckout(plan.type)}
                  disabled={isLoading !== null}
                >
                  {isLoading === plan.type ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      {plan.type !== "lifetime"
                        ? "Start Free Trial"
                        : "Get Lifetime Access"}{" "}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </span>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {error && <div className="error-alert mt-8">{error}</div>}

      <div className="mt-16 text-center text-gray-400 text-sm">
        <p>All plans include a secure payment process through Stripe.</p>
        <p className="mt-2">
          Have questions? Contact our support team for assistance.
        </p>
      </div>
    </div>
  );
}
