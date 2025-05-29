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

    // Get revenue data from Stripe tables
    const { data: invoices, error: invoicesError } = await supabase
      .schema("stripe_tables")
      .from("stripe_invoices")
      .select("total, currency, period_end, status");

    if (invoicesError) {
      console.error("Error fetching invoices:", invoicesError);
    }

    // Get payment intents for one-time payments (lifetime purchases)
    const { data: paymentIntents, error: piError } = await supabase
      .schema("stripe_tables")
      .from("stripe_payment_intents")
      .select("amount, currency, created, attrs");

    if (piError) {
      console.error("Error fetching payment intents:", piError);
    }

    // Calculate revenue
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

    // Calculate churn rate (simplified - cancellations vs active subscriptions)
    const { data: subscriptions, error: subsError } = await supabase
      .schema("stripe_tables")
      .from("stripe_subscriptions")
      .select("attrs");

    const canceledSubs =
      subscriptions?.filter((sub) => {
        const attrs = sub.attrs as any;
        return attrs?.status === "canceled";
      }).length || 0;

    const churnRate =
      activeSubscriptions > 0
        ? (canceledSubs / (activeSubscriptions + canceledSubs)) * 100
        : 0;

    // Get recent activity
    const recentActivity = await getRecentActivity();

    // Get total customers from Stripe
    const { data: customers, error: customersError } = await supabase
      .schema("stripe_tables")
      .from("stripe_customers")
      .select("id");

    const totalCustomers = customers?.length || 0;

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
 * Fetches recent activity for the admin dashboard
 */
export async function getRecentActivity(
  limit: number = 10
): Promise<AdminActivity[]> {
  try {
    const supabase = await createSupabaseServiceRole();

    const activities: AdminActivity[] = [];

    // Get recent payment intents
    const { data: paymentIntents, error: piError } = await supabase
      .schema("stripe_tables")
      .from("stripe_payment_intents")
      .select("*")
      .order("created", { ascending: false })
      .limit(limit);

    if (!piError && paymentIntents) {
      for (const pi of paymentIntents) {
        const attrs = pi.attrs as any;
        if (attrs?.status === "succeeded") {
          // Get customer email
          let customerEmail = "";
          if (pi.customer) {
            const { data: customer } = await supabase
              .schema("stripe_tables")
              .from("stripe_customers")
              .select("email")
              .eq("id", pi.customer)
              .single();
            customerEmail = customer?.email || "";
          }

          activities.push({
            id: pi.id || "",
            type:
              attrs?.metadata?.purchase_type === "lifetime"
                ? "payment"
                : "payment",
            description:
              attrs?.metadata?.purchase_type === "lifetime"
                ? `Lifetime purchase by ${customerEmail}`
                : `Payment of $${((pi.amount || 0) / 100).toFixed(
                    2
                  )} by ${customerEmail}`,
            amount: (pi.amount || 0) / 100,
            currency: pi.currency || "usd",
            timestamp: pi.created || new Date().toISOString(),
            userEmail: customerEmail,
          });
        }
      }
    }

    // Get recent invoices
    const { data: invoices, error: invoicesError } = await supabase
      .schema("stripe_tables")
      .from("stripe_invoices")
      .select("*")
      .order("period_end", { ascending: false })
      .limit(limit);

    if (!invoicesError && invoices) {
      for (const invoice of invoices) {
        if (invoice.status === "paid") {
          // Get customer email
          let customerEmail = "";
          if (invoice.customer) {
            const { data: customer } = await supabase
              .schema("stripe_tables")
              .from("stripe_customers")
              .select("email")
              .eq("id", invoice.customer)
              .single();
            customerEmail = customer?.email || "";
          }

          activities.push({
            id: invoice.id || "",
            type: "subscription",
            description: `Subscription payment of $${(
              (invoice.total || 0) / 100
            ).toFixed(2)} by ${customerEmail}`,
            amount: (invoice.total || 0) / 100,
            currency: invoice.currency || "usd",
            timestamp: invoice.period_end || new Date().toISOString(),
            userEmail: customerEmail,
          });
        }
      }
    }

    // Get recent user signups
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
        validSubscriptionTypes.includes(subscriptionFilter as SubscriptionType)
      ) {
        query = query.eq(
          "subscription",
          subscriptionFilter as SubscriptionType
        );
      }
    }

    // Get total count for pagination
    const { count: totalCount } = await query;

    // Apply pagination
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

      // Filter by search term if provided
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          userEmail.toLowerCase().includes(searchLower) ||
          (profile.first_name &&
            profile.first_name.toLowerCase().includes(searchLower)) ||
          (profile.last_name &&
            profile.last_name.toLowerCase().includes(searchLower)) ||
          profile.id.toLowerCase().includes(searchLower);

        if (!matchesSearch) continue;
      }

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
          .schema("stripe_tables")
          .from("stripe_invoices")
          .select("total, status")
          .eq("customer", profile.customer_id);

        const invoiceTotal =
          customerInvoices
            ?.filter((inv) => inv.status === "paid")
            .reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

        // Get total from payment intents
        const { data: customerPayments } = await supabase
          .schema("stripe_tables")
          .from("stripe_payment_intents")
          .select("amount, attrs")
          .eq("customer", profile.customer_id);

        const paymentTotal =
          customerPayments
            ?.filter((pi) => {
              const attrs = pi.attrs as any;
              return attrs?.status === "succeeded" && !attrs?.refunded;
            })
            .reduce((sum, pi) => sum + (pi.amount || 0), 0) || 0;

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
        .schema("stripe_tables")
        .from("stripe_invoices")
        .select("total, status")
        .gte("period_end", monthStart.toISOString())
        .lte("period_end", monthEnd.toISOString())
        .eq("status", "paid");

      // Get payment intents for this month
      const { data: payments } = await supabase
        .schema("stripe_tables")
        .from("stripe_payment_intents")
        .select("amount, attrs")
        .gte("created", monthStart.toISOString())
        .lte("created", monthEnd.toISOString());

      const invoiceRevenue =
        invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
      const paymentRevenue =
        payments
          ?.filter((pi) => {
            const attrs = pi.attrs as any;
            return attrs?.status === "succeeded" && !attrs?.refunded;
          })
          .reduce((sum, pi) => sum + (pi.amount || 0), 0) || 0;

      data.push((invoiceRevenue + paymentRevenue) / 100);
    }

    return { labels, data };
  } catch (error) {
    console.error("Error fetching monthly revenue trend:", error);
    return { labels: [], data: [] };
  }
}
