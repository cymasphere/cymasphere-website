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
  hasNfr?: boolean;
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
 * Get total count of users for CRM (separate from pagination)
 */
export async function getUsersForCRMCount(
  searchTerm?: string,
  subscriptionFilter?: string
): Promise<number> {
  try {
    const supabase = await createSupabaseServiceRole();

    // Build count query
    let countQuery = supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Handle admin filter separately
    if (subscriptionFilter === "admin") {
      const { data: admins, error: adminsError } = await supabase
        .from("admins")
        .select("user");

      if (!adminsError && admins && admins.length > 0) {
        const adminIds = admins.map((admin: { user: string }) => admin.user);
        countQuery = countQuery.in("id", adminIds);
      } else {
        return 0;
      }
    } else if (subscriptionFilter && subscriptionFilter !== "all") {
      const validSubscriptionTypes: SubscriptionType[] = [
        "none",
        "monthly",
        "annual",
        "lifetime",
      ];
      if (
        validSubscriptionTypes.includes(subscriptionFilter as SubscriptionType)
      ) {
        countQuery = countQuery.eq(
          "subscription",
          subscriptionFilter as SubscriptionType
        );
      }
    }

    // Apply search filter if provided
    if (searchTerm && searchTerm.trim().length > 0) {
      const searchLower = searchTerm.trim();
      const searchMatchingIds: string[] = [];

      // Search profiles table
      const { data: nameIdMatches } = await supabase
        .from("profiles")
        .select("id")
        .or(
          `first_name.ilike.%${searchLower}%,last_name.ilike.%${searchLower}%,id.ilike.%${searchLower}%`
        );

      if (nameIdMatches) {
        searchMatchingIds.push(...nameIdMatches.map((p) => p.id));
      }

      // Search auth.users for email (limited to 5k for performance)
      try {
        const {
          data: { users },
          error: emailError,
        } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 5000,
        });

        if (!emailError && users) {
          const searchLowerEmail = searchLower.toLowerCase();
          const emailMatches = users
            .filter((user) =>
              user.email?.toLowerCase().includes(searchLowerEmail)
            )
            .map((user) => user.id);
          searchMatchingIds.push(...emailMatches);
        }
      } catch (emailSearchError) {
        // Continue with name/id matches only
      }

      const validIds = [...new Set(searchMatchingIds)].filter((id) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          id
        )
      );

      if (validIds.length > 0) {
        countQuery = countQuery.in("id", validIds);
      } else {
        return 0;
      }
    }

    const { count, error } = await countQuery;

    if (error) {
      console.error("Error fetching users count:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error in getUsersForCRMCount:", error);
    return 0;
  }
}

/**
 * Fetches paginated users with their Stripe data for the CRM
 * Does NOT fetch total count - use getUsersForCRMCount separately
 */
export async function getAllUsersForCRM(
  page: number = 1,
  limit: number = 50,
  searchTerm?: string,
  subscriptionFilter?: string,
  sortField?: string,
  sortDirection?: "asc" | "desc"
): Promise<{
  users: UserData[];
}> {
  try {
    const supabase = await createSupabaseServiceRole();

    // Query from profiles table which now includes email column (synced from auth.users)
    // This allows sorting and filtering by email at the database level
    let query = supabase.from("profiles").select("*", { count: "exact" });

    // Handle admin filter separately (admin is not a subscription type)
    let adminUserIds: string[] | null = null;
    if (subscriptionFilter === "admin") {
      // Get all admin user IDs
      const { data: admins, error: adminsError } = await supabase
        .from("admins")
        .select("user");

      if (!adminsError && admins) {
        adminUserIds = admins.map((admin: { user: string }) => admin.user);
        if (adminUserIds.length > 0) {
          query = query.in("id", adminUserIds);
        } else {
          // No admins found - return empty result
          query = query.eq("id", "00000000-0000-0000-0000-000000000000");
        }
      } else {
        // Error fetching admins - return empty result
        query = query.eq("id", "00000000-0000-0000-0000-000000000000");
      }
    } else if (subscriptionFilter && subscriptionFilter !== "all") {
      // Apply subscription filter for valid subscription types
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

    // Apply search filtering at the database query level
    if (searchTerm && searchTerm.trim().length > 0) {
      const searchLower = searchTerm.trim();

      // Use or() with multiple ilike conditions
      // Search by first name, last name, and email
      const orConditions = [
        `first_name.ilike.%${searchLower}%`,
        `last_name.ilike.%${searchLower}%`,
        `email.ilike.%${searchLower}%`,
      ];

      // For full name search (e.g., "ryan johnson"), split and search for both parts
      const parts = searchLower.trim().split(/\s+/);
      if (parts.length > 1) {
        // If search term has multiple words, also search for "first_name matches part1 AND last_name matches part2"
        // We'll handle this by adding conditions that match any part in first or last name
        for (const part of parts) {
          if (part.length > 0) {
            orConditions.push(`first_name.ilike.%${part}%`);
            orConditions.push(`last_name.ilike.%${part}%`);
          }
        }
      }

      const orConditionsStr = orConditions.join(",");
      query = query.or(orConditionsStr);
    }

    // Map frontend sort fields to database column names
    // All these fields can be sorted at the database level before pagination
    const dbSortableFields: Record<string, string> = {
      firstName: "first_name",
      lastName: "last_name",
      subscription: "subscription",
      createdAt: "updated_at", // Using updated_at as created_at equivalent
      email: "email", // Email is now available in profiles table (synced from auth.users)
    };

    // Apply sorting to the query if the field can be sorted in the database
    // This MUST be done BEFORE pagination to ensure correct results
    if (sortField && sortField in dbSortableFields) {
      const dbSortField = dbSortableFields[sortField];
      const ascending = sortDirection === "asc";

      console.log(
        `Applying database sort: field=${sortField}, dbField=${dbSortField}, direction=${sortDirection}, ascending=${ascending}`
      );

      // For firstName, sort by both first_name and last_name for proper alphabetical sorting
      // Users without names (NULL or empty string) should always appear last
      if (sortField === "firstName") {
        // Include all users but ensure those without names sort last
        // Strategy: Sort by "has a name" first (users with names first), then alphabetically
        // This ensures:
        // - Users WITH names are sorted alphabetically (A-Z or Z-A based on direction)
        // - Users WITHOUT names always appear at the end (regardless of sort direction)

        console.log(
          `Sorting by firstName: users with names will sort ${
            ascending ? "A-Z" : "Z-A"
          }, users without names always last`
        );

        // First order by whether the field is empty/null (0 = has name, 1 = no name)
        // Then order by the actual field value
        query = query
          .order("first_name", {
            ascending,
            nullsFirst: false, // Treat NULL and empty as equal, sort to end
          })
          .order("last_name", {
            ascending,
            nullsFirst: false, // Secondary sort by last name
          });
      } else if (sortField === "lastName") {
        // Similar logic for lastName: sort by lastName first, then firstName
        // Users without either name will appear at the end
        console.log(
          `Sorting by lastName: users with names will sort ${
            ascending ? "A-Z" : "Z-A"
          }, users without names always last`
        );

        query = query
          .order("last_name", {
            ascending,
            nullsFirst: false, // Treat NULL and empty as equal, sort to end
          })
          .order("first_name", {
            ascending,
            nullsFirst: false, // Secondary sort by first name
          });
      } else {
        query = query.order(dbSortField, {
          ascending,
          nullsFirst: false, // NULLs always last
        });
      }
    } else {
      // Default sorting by updated_at desc if no sort specified or field can't be sorted in DB
      // Note: Fields like 'email', 'lastActive', and 'totalSpent' cannot be sorted at DB level
      // as they require data from external sources (auth.users, stripe API, etc)
      if (!sortField) {
        console.log(
          "No sort field specified, using default sort by updated_at desc"
        );
      } else {
        console.log(
          `Sort field ${sortField} cannot be sorted in database (${sortField} field not in dbSortableFields), using default sort`
        );
      }
      query = query.order("updated_at", {
        ascending: false,
        nullsFirst: false,
      });
    }

    // All sorting and filtering happens at the database level
    // Apply pagination at the database level (always, for all sort types)
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: allProfiles, error: profilesError } = await query;

    if (profilesError) {
      console.error("Error fetching profiles for CRM:", profilesError);
      throw profilesError;
    }

    if (!allProfiles || allProfiles.length === 0) {
      console.log("No profiles found for CRM query");
      return { users: [] };
    }

    // Rest of the function uses allProfiles
    const profiles = allProfiles;

    // Fetch NFR status from user_management table for all users
    const userEmails = profiles
      .map((p) => (p as typeof p & { email?: string }).email)
      .filter((email): email is string => !!email && email.length > 0);

    const nfrStatusMap: Record<string, boolean> = {};
    if (userEmails.length > 0) {
      try {
        // Fetch all NFR records and match by normalized email (case-insensitive)
        // This approach is more reliable than trying to filter in the query
        const { data: nfrRecords, error: nfrError } = await supabase
          .from("user_management")
          .select("user_email, pro");

        if (!nfrError && nfrRecords) {
          // Create normalized email sets for efficient lookup
          const normalizedUserEmails = new Set(
            userEmails.map((e) => e.toLowerCase().trim())
          );
          
          // Match records by normalized email
          nfrRecords.forEach((record) => {
            const normalizedRecordEmail = record.user_email.toLowerCase().trim();
            if (normalizedUserEmails.has(normalizedRecordEmail)) {
              nfrStatusMap[normalizedRecordEmail] = record.pro ?? false;
            }
          });
        }
      } catch (nfrErr) {
        console.error("Error fetching NFR status:", nfrErr);
      }
    }

    // Build users array immediately with basic data from profiles
    // This allows the UI to show users right away while additional data loads
    const users: UserData[] = [];

    for (const profile of profiles) {
      const userEmail =
        (profile as typeof profile & { email?: string }).email || "";
      const normalizedEmail = userEmail.toLowerCase().trim();
      const hasNfr = nfrStatusMap[normalizedEmail] ?? false;

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
        lastActive: profile.updated_at || new Date().toISOString(), // Default to join date, will be updated if session data exists
        totalSpent: -1, // -1 indicates loading, will be updated when data loads
        hasNfr,
      });
    }

    // Return users immediately - additional data will be fetched separately
    return {
      users,
    };
  } catch (error) {
    console.error("Error fetching users for CRM:", error);
    // Return empty array instead of throwing to prevent frontend from hanging
    return {
      users: [],
    };
  }
}

/**
 * Fetches additional user data (lastActive, totalSpent) for given user IDs
 * This is called separately after users are displayed to improve perceived performance
 */
export async function getAdditionalUserData(userIds: string[]): Promise<{
  lastActive: Record<string, string>;
  totalSpent: Record<string, number>;
}> {
  const lastActiveMap: Record<string, string> = {};
  const totalSpentMap: Record<string, number> = {};

  if (userIds.length === 0) {
    return { lastActive: lastActiveMap, totalSpent: totalSpentMap };
  }

  try {
    const supabase = await createSupabaseServiceRole();

    // Fetch user sessions for lastActive
    try {
      const { data: allSessions, error: sessionsError } = await supabase
        .from("user_sessions")
        .select("user_id, refreshed_at, updated_at, created_at")
        .in("user_id", userIds);

      if (!sessionsError && allSessions) {
        // Group by user_id and get the most recent session for each user
        const sessionsByUser = new Map<
          string,
          {
            user_id: string;
            refreshed_at?: string | null;
            updated_at?: string | null;
            created_at?: string | null;
          }
        >();
        allSessions.forEach((session) => {
          const existing = sessionsByUser.get(session.user_id);
          if (!existing) {
            sessionsByUser.set(session.user_id, session);
          } else {
            // Compare timestamps to find most recent
            const existingTime =
              existing.refreshed_at ||
              existing.updated_at ||
              existing.created_at;
            const currentTime =
              session.refreshed_at || session.updated_at || session.created_at;
            if (currentTime && (!existingTime || currentTime > existingTime)) {
              sessionsByUser.set(session.user_id, session);
            }
          }
        });

        sessionsByUser.forEach((session, userId) => {
          const lastActive =
            session.refreshed_at || session.updated_at || session.created_at;
          if (lastActive) {
            lastActiveMap[userId] = lastActive;
          }
        });
      }
    } catch (sessionsErr) {
      console.error("Error batch fetching user sessions:", sessionsErr);
    }

    // Fetch customer IDs from profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, customer_id")
      .in("id", userIds);

    if (profilesError) {
      console.error("Error fetching customer IDs:", profilesError);
      return { lastActive: lastActiveMap, totalSpent: totalSpentMap };
    }

    const customerIds =
      profiles?.map((p) => p.customer_id).filter((id): id is string => !!id) ||
      [];

    // Fetch Stripe data for totalSpent
    if (customerIds.length > 0) {
      try {
        const invoicesMap = new Map<string, number>();
        const paymentsMap = new Map<string, number>();

        // Fetch invoices directly from Stripe API for each customer
        const invoicePromises = customerIds.map(async (customerId) => {
          try {
            const invoices = await stripe.invoices.list({
              customer: customerId,
              limit: 100,
            });

            const paidTotal = invoices.data
              .filter((inv) => inv.status === "paid")
              .reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);

            if (paidTotal > 0) {
              invoicesMap.set(customerId, paidTotal);
            }
          } catch (err) {
            console.error(
              `Error fetching invoices for customer ${customerId}:`,
              err
            );
          }
        });

        // Fetch payment intents directly from Stripe API for each customer
        const paymentPromises = customerIds.map(async (customerId) => {
          try {
            const paymentIntents = await stripe.paymentIntents.list({
              customer: customerId,
              limit: 100,
            });

            const succeededTotal = paymentIntents.data
              .filter((pi) => pi.status === "succeeded" && !pi.refunded)
              .reduce((sum, pi) => sum + (pi.amount || 0), 0);

            if (succeededTotal > 0) {
              paymentsMap.set(customerId, succeededTotal);
            }
          } catch (err) {
            console.error(
              `Error fetching payment intents for customer ${customerId}:`,
              err
            );
          }
        });

        await Promise.allSettled([...invoicePromises, ...paymentPromises]);

        // Map customer IDs to user IDs and calculate totalSpent
        profiles?.forEach((profile) => {
          if (profile.customer_id) {
            const invoiceTotal = invoicesMap.get(profile.customer_id) || 0;
            const paymentTotal = paymentsMap.get(profile.customer_id) || 0;
            const total = (invoiceTotal + paymentTotal) / 100;
            if (total > 0) {
              totalSpentMap[profile.id] = total;
            }
          }
        });
      } catch (stripeErr) {
        console.error("Error batch fetching Stripe data:", stripeErr);
      }
    }

    return { lastActive: lastActiveMap, totalSpent: totalSpentMap };
  } catch (error) {
    console.error("Error fetching additional user data:", error);
    return { lastActive: lastActiveMap, totalSpent: totalSpentMap };
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

      // Get invoices for this month directly from Stripe API
      let invoiceRevenue = 0;
      try {
        const invoices = await stripe.invoices.list({
          created: {
            gte: Math.floor(monthStart.getTime() / 1000),
            lte: Math.floor(monthEnd.getTime() / 1000),
          },
          status: "paid",
          limit: 100, // Stripe API limit
        });

        invoiceRevenue = invoices.data.reduce(
          (sum, inv) => sum + (inv.amount_paid || 0),
          0
        );

        // Handle pagination if there are more than 100 invoices
        let hasMore = invoices.has_more;
        let lastInvoiceId = invoices.data[invoices.data.length - 1]?.id;
        while (hasMore && lastInvoiceId) {
          const nextPage = await stripe.invoices.list({
            created: {
              gte: Math.floor(monthStart.getTime() / 1000),
              lte: Math.floor(monthEnd.getTime() / 1000),
            },
            status: "paid",
            limit: 100,
            starting_after: lastInvoiceId,
          });

          invoiceRevenue += nextPage.data.reduce(
            (sum, inv) => sum + (inv.amount_paid || 0),
            0
          );

          hasMore = nextPage.has_more;
          lastInvoiceId = nextPage.data[nextPage.data.length - 1]?.id;
        }
      } catch (err) {
        console.error(
          `Error fetching invoices for month ${labels[labels.length - 1]}:`,
          err
        );
      }

      // Get payment intents for this month directly from Stripe API
      let paymentRevenue = 0;
      try {
        const paymentIntents = await stripe.paymentIntents.list({
          created: {
            gte: Math.floor(monthStart.getTime() / 1000),
            lte: Math.floor(monthEnd.getTime() / 1000),
          },
          limit: 100, // Stripe API limit
        });

        paymentRevenue = paymentIntents.data
          .filter((pi) => pi.status === "succeeded" && !pi.refunded)
          .reduce((sum, pi) => sum + (pi.amount || 0), 0);

        // Handle pagination if there are more than 100 payment intents
        let hasMore = paymentIntents.has_more;
        let lastPaymentId =
          paymentIntents.data[paymentIntents.data.length - 1]?.id;
        while (hasMore && lastPaymentId) {
          const nextPage = await stripe.paymentIntents.list({
            created: {
              gte: Math.floor(monthStart.getTime() / 1000),
              lte: Math.floor(monthEnd.getTime() / 1000),
            },
            limit: 100,
            starting_after: lastPaymentId,
          });

          paymentRevenue += nextPage.data
            .filter((pi) => pi.status === "succeeded" && !pi.refunded)
            .reduce((sum, pi) => sum + (pi.amount || 0), 0);

          hasMore = nextPage.has_more;
          lastPaymentId = nextPage.data[nextPage.data.length - 1]?.id;
        }
      } catch (err) {
        console.error(
          `Error fetching payment intents for month ${
            labels[labels.length - 1]
          }:`,
          err
        );
      }

      data.push((invoiceRevenue + paymentRevenue) / 100);
    }

    return { labels, data };
  } catch (error) {
    console.error("Error fetching monthly revenue trend:", error);
    return { labels: [], data: [] };
  }
}
