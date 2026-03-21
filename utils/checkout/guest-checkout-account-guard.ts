/**
 * @fileoverview Ensures guest checkout cannot proceed when a Cymasphere profile
 * already exists for the email — those users must sign in and use Billing.
 *
 * @module utils/checkout/guest-checkout-account-guard
 */

import { createSupabaseServiceRole } from "@/utils/supabase/service";

export {
  ACCOUNT_EXISTS_REQUIRE_LOGIN,
  ACCOUNT_EXISTS_REQUIRE_LOGIN_MESSAGE,
} from "@/utils/checkout/guest-checkout-constants";

/**
 * @brief Whether a guest (no Supabase session) must log in before checkout for this email.
 * @param checkoutEmail - Raw email from the checkout form or body
 * @param authUserId - Authenticated user id, if any
 * @returns True when there is no session and a `profiles` row exists for the normalized email
 * @note Uses the service role to look up by email; call only from trusted server routes.
 */
export async function guestCheckoutEmailRequiresLogin(
  checkoutEmail: string,
  authUserId: string | null | undefined,
): Promise<boolean> {
  if (authUserId) {
    return false;
  }
  const normalized = checkoutEmail.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  const supabase = await createSupabaseServiceRole();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();
  return Boolean(data?.id);
}
