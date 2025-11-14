"use server";

import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { SubscriptionType } from "@/utils/supabase/types";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export interface AdminDashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  lifetimeRevenue: number;
  totalCustomers: number;
  freeUsers: number;
  monthlySubscribers: number;
  annualSubscribers: number;
  lifetimeCustomers: number;
  adminUsers: number;
  trialUsers: number;
  churnRate: number;
  recentActivity: AdminActivity[];
}

export interface AdminActivity {
  id: string;
  type: "subscription" | "payment" | "user_signup" | "cancellation";
  description: string;
  amount?: number;
  currency?: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
}

export interface UserData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscription: string;
  customerId?: string;
  subscriptionExpiration?: string;
  trialExpiration?: string;
  createdAt: string;
  lastActive?: string;
  totalSpent: number;
}

export interface DetailedUserData extends UserData {
  subscriptions: {
    id: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    priceId: string;
    amount: number;
    interval: string;
  }[];
  purchases: {
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    description: string;
  }[];
  invoices: {
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    paidAt: string | null;
    dueDate: string | null;
    description: string;
  }[];
}

/**
 * Fetches comprehensive admin dashboard statistics
 * @deprecated Use individual stat functions instead for better performance
 */
export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  try {
    const supabase = await createSupabaseServiceRole();

    // Get all users from profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    const totalUsers = profiles?.length || 0;

    // Count subscription types
    const subscriptionCounts =
      profiles?.reduce((acc, profile) => {
        const sub = profile.subscription || "none";
        acc[sub] = (acc[sub] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

    const freeUsers = subscriptionCounts.none || 0;
    const monthlySubscribers = subscriptionCounts.monthly || 0;
    const annualSubscribers = subscriptionCounts.annual || 0;
    const lifetimeCustomers = subscriptionCounts.lifetime || 0;
    const adminUsers = subscriptionCounts.admin || 0;

    // Count trial users (those with trial_expiration but no active subscription)
    const trialUsers =
      profiles?.filter(
        (p) =>
          p.trial_expiration &&
          new Date(p.trial_expiration) > new Date() &&
          p.subscription === "none"
      ).length || 0;

    const activeSubscriptions = monthlySubscribers + annualSubscribers;

    // TODO: Integrate with Stripe tables when available
    // Using mock data for revenue calculations for now
    const invoices: any[] = [];
    const paymentIntents: any[] = [];

    console.log("Using mock revenue data - Stripe tables not available");

    // Calculate revenue (using mock data for now)
    const paidInvoices = invoices?.filter((inv) => inv.status === "paid") || [];
    const succeededPayments =
      paymentIntents?.filter((pi) => {
        const attrs = pi.attrs as any;
        return attrs?.status === "succeeded" && !attrs?.refunded;
      }) || [];

    const totalInvoiceRevenue =
      paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0) / 100;
    const totalPaymentRevenue =
      succeededPayments.reduce((sum, pi) => sum + (pi.amount || 0), 0) / 100;
    const lifetimeRevenue = totalInvoiceRevenue + totalPaymentRevenue;

    // Calculate monthly revenue (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentInvoices = paidInvoices.filter(
      (inv) => inv.period_end && new Date(inv.period_end) >= thirtyDaysAgo
    );
    const recentPayments = succeededPayments.filter(
      (pi) => pi.created && new Date(pi.created) >= thirtyDaysAgo
    );

    const monthlyInvoiceRevenue =
      recentInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0) / 100;
    const monthlyPaymentRevenue =
      recentPayments.reduce((sum, pi) => sum + (pi.amount || 0), 0) / 100;
    const monthlyRevenue = monthlyInvoiceRevenue + monthlyPaymentRevenue;

    // Calculate churn rate (using mock data)
    const canceledSubs = 0; // Mock: no canceled subscriptions
    const churnRate =
      activeSubscriptions > 0
        ? (canceledSubs / (activeSubscriptions + canceledSubs)) * 100
        : 0;

    // Get recent activity
    const recentActivity = await getRecentActivity();

    // Get total customers (using total users as proxy)
    const totalCustomers = totalUsers;

    return {
      totalUsers,
      activeSubscriptions,
      monthlyRevenue,
      lifetimeRevenue,
      totalCustomers,
      freeUsers,
      monthlySubscribers,
      annualSubscribers,
      lifetimeCustomers,
      adminUsers,
      trialUsers,
      churnRate,
      recentActivity,
    };
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    throw error;
  }
}

/**
 * Fetches total users count and breakdown
 */
export async function getTotalUsers(): Promise<{
  totalUsers: number;
  freeUsers: number;
  activeSubscriptions: number;
}> {
  try {
    const supabase = await createSupabaseServiceRole();

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("subscription");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    const totalUsers = profiles?.length || 0;

    const subscriptionCounts =
      profiles?.reduce((acc, profile) => {
        const sub = profile.subscription || "none";
        acc[sub] = (acc[sub] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

    const freeUsers = subscriptionCounts.none || 0;
    const monthlySubscribers = subscriptionCounts.monthly || 0;
    const annualSubscribers = subscriptionCounts.annual || 0;
    const activeSubscriptions = monthlySubscribers + annualSubscribers;

    return {
      totalUsers,
      freeUsers,
      activeSubscriptions,
    };
  } catch (error) {
    console.error("Error fetching total users:", error);
    throw error;
  }
}

/**
 * Fetches active subscriptions breakdown
 */
export async function getActiveSubscriptions(): Promise<{
  activeSubscriptions: number;
  monthlySubscribers: number;
  annualSubscribers: number;
}> {
  try {
    const supabase = await createSupabaseServiceRole();

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("subscription");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    const subscriptionCounts =
      profiles?.reduce((acc, profile) => {
        const sub = profile.subscription || "none";
        acc[sub] = (acc[sub] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

    const monthlySubscribers = subscriptionCounts.monthly || 0;
    const annualSubscribers = subscriptionCounts.annual || 0;
    const activeSubscriptions = monthlySubscribers + annualSubscribers;

    return {
      activeSubscriptions,
      monthlySubscribers,
      annualSubscribers,
    };
  } catch (error) {
    console.error("Error fetching active subscriptions:", error);
    throw error;
  }
}

/**
 * Fetches lifetime customers count
 */
export async function getLifetimeCustomers(): Promise<number> {
  try {
    const supabase = await createSupabaseServiceRole();

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("subscription")
      .eq("subscription", "lifetime");

    if (profilesError) {
      console.error("Error fetching lifetime customers:", profilesError);
      throw profilesError;
    }

    return profiles?.length || 0;
  } catch (error) {
    console.error("Error fetching lifetime customers:", error);
    throw error;
  }
}

/**
 * Fetches monthly revenue (last 30 days) using Balance Transactions API
 * This is much more efficient than querying invoices and charges separately
 */
export async function getMonthlyRevenue(): Promise<number> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn(
        "STRIPE_SECRET_KEY not set, returning 0 for monthly revenue"
      );
      return 0;
    }

    // Calculate monthly revenue (last 30 days)
    const thirtyDaysAgo = Math.floor(
      (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000
    );

    let totalRevenue = 0;
    let hasMore = true;
    let startingAfter: string | undefined = undefined;

    // Use Balance Transactions API - aggregates all financial transactions
    while (hasMore) {
      const balanceTransactions: Stripe.Response<
        Stripe.ApiList<Stripe.BalanceTransaction>
      > = await stripe.balanceTransactions.list({
        created: { gte: thirtyDaysAgo },
        limit: 100,
        starting_after: startingAfter,
      });

      for (const transaction of balanceTransactions.data) {
        // Only count charge transactions (not refunds, fees, etc.)
        // Type 'charge' represents successful payments
        if (transaction.type === "charge" && transaction.amount > 0) {
          totalRevenue += transaction.amount;
        }
      }

      hasMore = balanceTransactions.has_more;
      if (balanceTransactions.data.length > 0) {
        startingAfter =
          balanceTransactions.data[balanceTransactions.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }

    // Convert from cents to dollars
    return totalRevenue / 100;
  } catch (error) {
    console.error("Error fetching monthly revenue:", error);
    throw error;
  }
}

/**
 * Fetches lifetime revenue using Balance Transactions API
 * This is much more efficient than querying invoices and charges separately
 */
export async function getLifetimeRevenue(): Promise<number> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn(
        "STRIPE_SECRET_KEY not set, returning 0 for lifetime revenue"
      );
      return 0;
    }

    let totalRevenue = 0;
    let hasMore = true;
    let startingAfter: string | undefined = undefined;

    // Use Balance Transactions API - aggregates all financial transactions
    while (hasMore) {
      const balanceTransactions: Stripe.Response<
        Stripe.ApiList<Stripe.BalanceTransaction>
      > = await stripe.balanceTransactions.list({
        limit: 100,
        starting_after: startingAfter,
      });

      for (const transaction of balanceTransactions.data) {
        // Only count charge transactions (not refunds, fees, etc.)
        // Type 'charge' represents successful payments
        if (transaction.type === "charge" && transaction.amount > 0) {
          totalRevenue += transaction.amount;
        }
      }

      hasMore = balanceTransactions.has_more;
      if (balanceTransactions.data.length > 0) {
        startingAfter =
          balanceTransactions.data[balanceTransactions.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }

    // Convert from cents to dollars
    return totalRevenue / 100;
  } catch (error) {
    console.error("Error fetching lifetime revenue:", error);
    throw error;
  }
}

/**
 * Fetches trial users count
 */
export async function getTrialUsers(): Promise<number> {
  try {
    const supabase = await createSupabaseServiceRole();

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("trial_expiration, subscription");

    if (profilesError) {
      console.error("Error fetching trial users:", profilesError);
      throw profilesError;
    }

    const trialUsers =
      profiles?.filter(
        (p) =>
          p.trial_expiration &&
          new Date(p.trial_expiration) > new Date() &&
          p.subscription === "none"
      ).length || 0;

    return trialUsers;
  } catch (error) {
    console.error("Error fetching trial users:", error);
    throw error;
  }
}

/**
 * Fetches churn rate
 */
export async function getChurnRate(): Promise<number> {
  try {
    const supabase = await createSupabaseServiceRole();

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("subscription");

    if (profilesError) {
      console.error("Error fetching profiles for churn rate:", profilesError);
      throw profilesError;
    }

    const subscriptionCounts =
      profiles?.reduce((acc, profile) => {
        const sub = profile.subscription || "none";
        acc[sub] = (acc[sub] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

    const monthlySubscribers = subscriptionCounts.monthly || 0;
    const annualSubscribers = subscriptionCounts.annual || 0;
    const activeSubscriptions = monthlySubscribers + annualSubscribers;

    // Calculate churn rate (using mock data)
    const canceledSubs = 0; // Mock: no canceled subscriptions
    const churnRate =
      activeSubscriptions > 0
        ? (canceledSubs / (activeSubscriptions + canceledSubs)) * 100
        : 0;

    return churnRate;
  } catch (error) {
    console.error("Error fetching churn rate:", error);
    throw error;
  }
}

/**
 * Fetches admin users count
 */
export async function getAdminUsers(): Promise<number> {
  try {
    const supabase = await createSupabaseServiceRole();

    const { count, error: adminsError } = await supabase
      .from("admins")
      .select("user", { count: "exact", head: true });

    if (adminsError) {
      console.error("Error fetching admin users:", adminsError);
      throw adminsError;
    }

    return count || 0;
  } catch (error) {
    console.error("Error fetching admin users:", error);
    throw error;
  }
}

/**
 * Fetches recent activity for the admin dashboard using Stripe Events API
 * This is much more efficient than querying Supabase tables
 */
export async function getRecentActivity(
  limit: number = 10
): Promise<AdminActivity[]> {
  try {
    const activities: AdminActivity[] = [];

    // Use Stripe Events API for recent payment activity
    if (process.env.STRIPE_SECRET_KEY) {
      const events: Stripe.Response<Stripe.ApiList<Stripe.Event>> =
        await stripe.events.list({
          types: [
            "charge.succeeded",
            "invoice.payment_succeeded",
            "customer.subscription.created",
            "customer.subscription.deleted",
          ],
          limit: limit * 2, // Get more to filter and sort
        });

      for (const event of events.data) {
        const eventData = event.data.object as
          | Stripe.Charge
          | Stripe.Invoice
          | Stripe.Subscription;

        if (event.type === "charge.succeeded") {
          const charge = eventData as Stripe.Charge;
          if (charge.paid && !charge.refunded) {
            let customerEmail = "";
            if (charge.customer && typeof charge.customer === "string") {
              // Fetch customer if needed
              try {
                const customer = await stripe.customers.retrieve(
                  charge.customer
                );
                if (!customer.deleted && "email" in customer) {
                  customerEmail = customer.email || "";
                }
              } catch {
                // Customer might not exist, skip email
              }
            } else if (
              charge.customer &&
              typeof charge.customer === "object" &&
              !charge.customer.deleted &&
              "email" in charge.customer
            ) {
              customerEmail = charge.customer.email || "";
            }
            const amount = charge.amount || 0;

            activities.push({
              id: charge.id,
              type: "payment",
              description: `Payment of $${(amount / 100).toFixed(2)}${
                customerEmail ? ` by ${customerEmail}` : ""
              }`,
              amount: amount / 100,
              currency: charge.currency || "usd",
              timestamp: new Date(charge.created * 1000).toISOString(),
              userEmail: customerEmail,
            });
          }
        } else if (event.type === "invoice.payment_succeeded") {
          const invoice = eventData as Stripe.Invoice;
          if (invoice.status === "paid") {
            let customerEmail = "";
            if (invoice.customer && typeof invoice.customer === "string") {
              // Fetch customer if needed
              try {
                const customer = await stripe.customers.retrieve(
                  invoice.customer
                );
                if (!customer.deleted && "email" in customer) {
                  customerEmail = customer.email || "";
                }
              } catch {
                // Customer might not exist, skip email
              }
            } else if (
              invoice.customer &&
              typeof invoice.customer === "object" &&
              !invoice.customer.deleted &&
              "email" in invoice.customer
            ) {
              customerEmail = invoice.customer.email || "";
            }
            const amount = invoice.amount_paid || 0;

            activities.push({
              id: invoice.id,
              type: "subscription",
              description: `Subscription payment of $${(amount / 100).toFixed(
                2
              )}${customerEmail ? ` by ${customerEmail}` : ""}`,
              amount: amount / 100,
              currency: invoice.currency || "usd",
              timestamp: new Date(invoice.created * 1000).toISOString(),
              userEmail: customerEmail,
            });
          }
        } else if (event.type === "customer.subscription.deleted") {
          const subscription = eventData as Stripe.Subscription;
          let customerEmail = "";
          if (
            subscription.customer &&
            typeof subscription.customer === "string"
          ) {
            // Fetch customer if needed
            try {
              const customer = await stripe.customers.retrieve(
                subscription.customer
              );
              if (!customer.deleted && "email" in customer) {
                customerEmail = customer.email || "";
              }
            } catch {
              // Customer might not exist, skip email
            }
          } else if (
            subscription.customer &&
            typeof subscription.customer === "object" &&
            !subscription.customer.deleted &&
            "email" in subscription.customer
          ) {
            customerEmail = subscription.customer.email || "";
          }

          activities.push({
            id: subscription.id,
            type: "cancellation",
            description: `Subscription cancelled${
              customerEmail ? ` by ${customerEmail}` : ""
            }`,
            timestamp: new Date(subscription.canceled_at! * 1000).toISOString(),
            userEmail: customerEmail,
          });
        }
      }
    }

    // Get recent user signups from Supabase (this is fast)
    const supabase = await createSupabaseServiceRole();
    const { data: recentUsers, error: usersError } = await supabase
      .from("profiles")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (!usersError && recentUsers) {
      for (const user of recentUsers) {
        // Get user email from auth
        const { data: authUser } = await supabase.auth.admin.getUserById(
          user.id
        );
        const userEmail = authUser.user?.email || "";

        activities.push({
          id: user.id,
          type: "user_signup",
          description: `New user signup: ${userEmail}`,
          timestamp: user.updated_at || new Date().toISOString(),
          userId: user.id,
          userEmail: userEmail,
        });
      }
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return activities.slice(0, limit);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }
}

/**
 * Fetches all users with their Stripe data for the CRM
 */
export async function getAllUsersForCRM(
  page: number = 1,
  limit: number = 50,
  searchTerm?: string,
  subscriptionFilter?: string
): Promise<{
  users: UserData[];
  totalCount: number;
  totalPages: number;
}> {
  try {
    const supabase = await createSupabaseServiceRole();

    let query = supabase.from("profiles").select("*", { count: "exact" });

    // Apply subscription filter
    if (subscriptionFilter && subscriptionFilter !== "all") {
      const validSubscriptionTypes: SubscriptionType[] = [
        "none",
        "monthly",
        "annual",
        "lifetime",
      ];
      if (
        validSubscriptionTypes.includes(
          subscriptionFilter as SubscriptionType
        ) ||
        subscriptionFilter === "admin"
      ) {
        query = query.eq(
          "subscription",
          subscriptionFilter as SubscriptionType
        );
      }
    }

    // Get search matching IDs if search term is provided
    let searchMatchingIds: string[] | null = null;
    if (searchTerm && searchTerm.trim().length > 0) {
      const searchLower = searchTerm.trim();
      const allMatchingIds: string[] = [];
      
      try {
        // 1. Search profiles table for name and id matches (efficient DB query)
        // This searches the entire profiles table, not just the current page
        const nameIdQuery = supabase
          .from("profiles")
          .select("id")
          .or(`first_name.ilike.%${searchLower}%,last_name.ilike.%${searchLower}%,id.ilike.%${searchLower}%`);
        
        const { data: nameIdMatches, error: nameIdError } = await nameIdQuery;
        
        if (!nameIdError && nameIdMatches) {
          const nameIdMatchedIds = nameIdMatches.map(p => p.id);
          allMatchingIds.push(...nameIdMatchedIds);
        }
        
        // 2. Search auth.users for email matches (limited to first 5k users for performance)
        // This is slower but necessary for email-only searches
        try {
          const { data: { users }, error: emailError } = await supabase.auth.admin.listUsers({
            page: 1,
            perPage: 5000, // Limit to first 5k users for performance
          });
          
          if (!emailError && users) {
            const searchLowerEmail = searchLower.toLowerCase();
            const emailMatches = users
              .filter(user => user.email?.toLowerCase().includes(searchLowerEmail))
              .map(user => user.id);
            allMatchingIds.push(...emailMatches);
          }
        } catch (emailSearchError) {
          console.error("Error searching emails (non-critical):", emailSearchError);
          // Continue with name/id matches only
        }
        
        // Remove duplicates
        searchMatchingIds = [...new Set(allMatchingIds)];
      } catch (searchError) {
        console.error("Error in search preprocessing:", searchError);
        searchMatchingIds = []; // Empty array means no matches
      }
    }

    // Apply search filter to main query
    if (searchMatchingIds !== null) {
      if (searchMatchingIds.length > 0) {
        // Filter to only valid UUIDs to avoid type errors
        const validUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validIds = searchMatchingIds.filter(id => validUuidPattern.test(id));
        
        if (validIds.length > 0) {
          query = query.in("id", validIds);
        } else {
          // No valid UUIDs found - return empty result by using a UUID that will never match
          query = query.eq("id", "00000000-0000-0000-0000-000000000000");
        }
      } else {
        // No matches found - return empty result by using a UUID that will never match
        query = query.eq("id", "00000000-0000-0000-0000-000000000000");
      }
    }

    // Get total count for pagination (AFTER search filter is applied)
    // Build count query with same filters
    let countQuery = supabase.from("profiles").select("*", { count: "exact", head: true });
    
    // Apply subscription filter to count query
    if (subscriptionFilter && subscriptionFilter !== "all") {
      const validSubscriptionTypes: SubscriptionType[] = [
        "none",
        "monthly",
        "annual",
        "lifetime",
      ];
      if (
        validSubscriptionTypes.includes(
          subscriptionFilter as SubscriptionType
        ) ||
        subscriptionFilter === "admin"
      ) {
        countQuery = countQuery.eq(
          "subscription",
          subscriptionFilter as SubscriptionType
        );
      }
    }
    
    // Apply search filter to count query
    if (searchMatchingIds !== null) {
      if (searchMatchingIds.length > 0) {
        // Filter to only valid UUIDs to avoid type errors
        const validUuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const validIds = searchMatchingIds.filter(id => validUuidPattern.test(id));
        
        if (validIds.length > 0) {
          countQuery = countQuery.in("id", validIds);
        } else {
          // No valid UUIDs found - return empty result by using a UUID that will never match
          countQuery = countQuery.eq("id", "00000000-0000-0000-0000-000000000000");
        }
      } else {
        // No matches found - return empty result by using a UUID that will never match
        countQuery = countQuery.eq("id", "00000000-0000-0000-0000-000000000000");
      }
    }
    
    const { count: totalCount } = await countQuery;

    // Apply pagination to data query
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) {
      console.error("Error fetching profiles for CRM:", profilesError);
      throw profilesError;
    }

    const users: UserData[] = [];

    for (const profile of profiles || []) {
      // Get auth user for email
      const { data: authUser } = await supabase.auth.admin.getUserById(
        profile.id
      );
      const userEmail = authUser.user?.email || "";

      // Note: Search filtering is now done at the database level before pagination
      // All matching users (by name, id, or email) have already been filtered

      // Get last active from user sessions
      let lastActive: string | undefined;
      const { data: userSessions } = await supabase
        .from("user_sessions")
        .select("refreshed_at, updated_at, created_at")
        .eq("user_id", profile.id)
        .order("refreshed_at", { ascending: false, nullsFirst: false })
        .order("updated_at", { ascending: false, nullsFirst: false })
        .limit(1);

      if (userSessions && userSessions.length > 0) {
        const session = userSessions[0];
        // Use the most recent timestamp available
        lastActive =
          session.refreshed_at ||
          session.updated_at ||
          session.created_at ||
          undefined;
      }

      // Calculate total spent
      let totalSpent = 0;
      if (profile.customer_id) {
        // Get total from invoices
        const { data: customerInvoices } = await supabase
          .schema("stripe_tables" as any)
          .from("stripe_invoices")
          .select("total, status")
          .eq("customer", profile.customer_id);

        const invoiceTotal =
          customerInvoices
            ?.filter((inv: any) => inv.status === "paid")
            .reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0;

        // Get total from payment intents
        const { data: customerPayments } = await supabase
          .schema("stripe_tables" as any)
          .from("stripe_payment_intents")
          .select("amount, attrs")
          .eq("customer", profile.customer_id);

        const paymentTotal =
          customerPayments
            ?.filter((pi: any) => {
              const attrs = pi.attrs as any;
              return attrs?.status === "succeeded" && !attrs?.refunded;
            })
            .reduce((sum: number, pi: any) => sum + (pi.amount || 0), 0) || 0;

        totalSpent = (invoiceTotal + paymentTotal) / 100;
      }

      users.push({
        id: profile.id,
        email: userEmail,
        firstName: profile.first_name || undefined,
        lastName: profile.last_name || undefined,
        subscription: profile.subscription || "none",
        customerId: profile.customer_id || undefined,
        subscriptionExpiration: profile.subscription_expiration || undefined,
        trialExpiration: profile.trial_expiration || undefined,
        createdAt: profile.updated_at || new Date().toISOString(),
        lastActive,
        totalSpent,
      });
    }

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return {
      users,
      totalCount: totalCount || 0,
      totalPages,
    };
  } catch (error) {
    console.error("Error fetching users for CRM:", error);
    throw error;
  }
}

/**
 * Fetches monthly revenue trend data
 */
export async function getMonthlyRevenueTrend(months: number = 12): Promise<{
  labels: string[];
  data: number[];
}> {
  try {
    const supabase = await createSupabaseServiceRole();

    const labels: string[] = [];
    const data: number[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      labels.push(
        date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
      );

      // Get invoices for this month
      const { data: invoices } = await supabase
        .schema("stripe_tables" as any)
        .from("stripe_invoices")
        .select("total, status")
        .gte("period_end", monthStart.toISOString())
        .lte("period_end", monthEnd.toISOString())
        .eq("status", "paid");

      // Get payment intents for this month
      const { data: payments } = await supabase
        .schema("stripe_tables" as any)
        .from("stripe_payment_intents")
        .select("amount, attrs")
        .gte("created", monthStart.toISOString())
        .lte("created", monthEnd.toISOString());

      const invoiceRevenue =
        invoices?.reduce(
          (sum: number, inv: any) => sum + (inv.total || 0),
          0
        ) || 0;
      const paymentRevenue =
        payments
          ?.filter((pi: any) => {
            const attrs = pi.attrs as any;
            return attrs?.status === "succeeded" && !attrs?.refunded;
          })
          .reduce((sum: number, pi: any) => sum + (pi.amount || 0), 0) || 0;

      data.push((invoiceRevenue + paymentRevenue) / 100);
    }

    return { labels, data };
  } catch (error) {
    console.error("Error fetching monthly revenue trend:", error);
    return { labels: [], data: [] };
  }
}
