export type PlanType = "monthly" | "annual" | "lifetime";

export interface PriceData {
  id: string;
  type: PlanType;
  amount: number;
  /** @brief Strikethrough retail anchor in cents (from Stripe metadata `compare_at_amount`). */
  compareAtAmount?: number;
  currency: string;
  interval?: string;
  name: string;
  discount?: {
    percent_off?: number;
    amount_off?: number;
    currency?: string;
    name: string;
    id: string;
    promotion_code?: string;
    promotion_display?: string;
  };
}

export interface PricesResponse {
  success: boolean;
  prices: Record<PlanType, PriceData>;
  error?: string;
}
