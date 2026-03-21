/**
 * @fileoverview Shared strings for guest-vs-existing-account checkout gating (client + server safe).
 *
 * @module utils/checkout/guest-checkout-constants
 */

/** @brief Error code when checkout email already has a profile and the user must log in first. */
export const ACCOUNT_EXISTS_REQUIRE_LOGIN = "ACCOUNT_EXISTS_REQUIRE_LOGIN" as const;

/** @brief Default user-facing copy for {@link ACCOUNT_EXISTS_REQUIRE_LOGIN}. */
export const ACCOUNT_EXISTS_REQUIRE_LOGIN_MESSAGE =
  "You already have an account with this email address. Log in to continue. We will open Billing so you can finish checkout.";
