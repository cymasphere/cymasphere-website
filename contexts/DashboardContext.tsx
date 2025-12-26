/**
 * @fileoverview Dashboard context provider for managing shared dashboard data.
 * @module contexts/DashboardContext
 * @description Provides centralized data fetching for dashboard pages to avoid duplicate API calls.
 * Each data type has its own loading state so components can render as data becomes available.
 */

"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { fetchUserSessions } from '@/utils/supabase/actions';

/**
 * @brief Type definitions for dashboard data
 */
interface StripePrices {
  monthly: { amount: number; discount?: number };
  annual: { amount: number; discount?: number };
  lifetime: { amount: number; discount?: number };
}

interface UpcomingInvoice {
  amount: number | null;
  due_date: Date | null;
  error: string | null;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  created: number;
  [key: string]: any;
}

interface Device {
  name: string;
  type: "mobile" | "tablet" | "desktop";
  location: string;
  lastActive: string;
}

/**
 * @brief Type definition for the dashboard context
 */
interface DashboardContextType {
  // Prices data
  prices: {
    monthly: number | null;
    yearly: number | null;
    lifetime: number | null;
    monthlyDiscount?: { percent_off?: number; amount_off?: number; promotion_code?: string };
    yearlyDiscount?: { percent_off?: number; amount_off?: number; promotion_code?: string };
    lifetimeDiscount?: { percent_off?: number; amount_off?: number; promotion_code?: string };
  };
  isLoadingPrices: boolean;
  priceError: string | null;
  refreshPrices: () => Promise<void>;

  // NFR status
  hasNfr: boolean | null;
  isLoadingNfr: boolean;
  refreshNfr: () => Promise<void>;

  // Device count and sessions
  deviceCount: number;
  devices: Device[];
  isLoadingDevices: boolean;
  refreshDevices: () => Promise<void>;

  // Upcoming invoice
  upcomingInvoice: UpcomingInvoice;
  isLoadingUpcomingInvoice: boolean;
  refreshUpcomingInvoice: () => Promise<void>;

  // Invoice history
  invoices: Invoice[];
  isLoadingInvoices: boolean;
  refreshInvoices: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

/**
 * @brief Dashboard context provider component.
 * @description Manages shared dashboard data with individual loading states.
 * @param {Object} props - Component props.
 * @param {ReactNode} props.children - Child components to wrap with dashboard context.
 * @returns {JSX.Element} DashboardContext provider wrapping children.
 */
export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Prices state
  const [prices, setPrices] = useState<{
    monthly: number | null;
    yearly: number | null;
    lifetime: number | null;
    monthlyDiscount?: { percent_off?: number; amount_off?: number; promotion_code?: string };
    yearlyDiscount?: { percent_off?: number; amount_off?: number; promotion_code?: string };
    lifetimeDiscount?: { percent_off?: number; amount_off?: number; promotion_code?: string };
  }>({
    monthly: null,
    yearly: null,
    lifetime: null,
    monthlyDiscount: undefined,
    yearlyDiscount: undefined,
    lifetimeDiscount: undefined,
  });
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  // NFR status state
  const [hasNfr, setHasNfr] = useState<boolean | null>(null);
  const [isLoadingNfr, setIsLoadingNfr] = useState(false);

  // Device state
  const [deviceCount, setDeviceCount] = useState(0);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const hasFetchedDevicesRef = useRef(false);

  // Upcoming invoice state
  const [upcomingInvoice, setUpcomingInvoice] = useState<UpcomingInvoice>({
    amount: null,
    due_date: null,
    error: null,
  });
  const [isLoadingUpcomingInvoice, setIsLoadingUpcomingInvoice] = useState(false);

  // Invoice history state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

  /**
   * Fetch prices from Stripe
   */
  const refreshPrices = useCallback(async () => {
    if (isLoadingPrices) return; // Prevent duplicate calls
    
    setIsLoadingPrices(true);
    setPriceError(null);
    
    try {
      const response = await fetch("/api/stripe/prices");
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON");
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();

      if (result.error) {
        setPriceError(result.error);
        return;
      }

      if (result.success && result.prices) {
        setPrices({
          monthly: Math.round(result.prices.monthly.amount / 100),
          yearly: Math.round(result.prices.annual.amount / 100),
          lifetime: Math.round(result.prices.lifetime.amount / 100),
          // Discounts are not returned by the prices API - they come from promotions
          monthlyDiscount: undefined,
          yearlyDiscount: undefined,
          lifetimeDiscount: undefined,
        });
      }
    } catch (err) {
      console.error("Error fetching prices:", err);
      setPriceError("Failed to load pricing information");
    } finally {
      setIsLoadingPrices(false);
    }
  }, [isLoadingPrices]);

  /**
   * Fetch NFR status
   */
  const refreshNfr = useCallback(async () => {
    if (!user?.id || isLoadingNfr) return; // Prevent duplicate calls
    
    setIsLoadingNfr(true);
    
    try {
      const response = await fetch("/api/user/nfr-status");
      
      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON");
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setHasNfr(data.hasNfr || false);
    } catch (err) {
      console.error("Error fetching NFR status:", err);
      setHasNfr(false);
    } finally {
      setIsLoadingNfr(false);
    }
  }, [user?.id, isLoadingNfr]);

  /**
   * Fetch device count and sessions
   */
  const refreshDevices = useCallback(async () => {
    if (!user?.id || isLoadingDevices) return; // Prevent duplicate calls
    
    setIsLoadingDevices(true);
    
    try {
      const { sessions, error } = await fetchUserSessions();

      if (error) {
        console.error("Error fetching device count:", error);
        return;
      }

      const count = sessions?.length || 0;
      setDeviceCount(count);

      // Transform sessions to devices
      if (sessions && sessions.length > 0) {
        const deviceData: Device[] = sessions.map((sessionData) => {
          let deviceType: "mobile" | "tablet" | "desktop" = "desktop";
          const deviceName = sessionData.device_name;

          if (
            deviceName.includes("Mobile") ||
            deviceName.includes("Android") ||
            deviceName.includes("iPhone")
          ) {
            deviceType = "mobile";
          } else if (
            deviceName.includes("iPad") ||
            deviceName.includes("Tablet")
          ) {
            deviceType = "tablet";
          }

          // Format last active time
          const lastUsed = new Date(sessionData.last_used);
          const now = new Date();
          const diffMs = now.getTime() - lastUsed.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);

          let formattedTime = "";
          if (diffMins < 1) {
            formattedTime = "Just now";
          } else if (diffMins < 60) {
            formattedTime = `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
          } else if (diffHours < 24) {
            formattedTime = `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
          } else {
            formattedTime = `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
          }

          return {
            name: deviceName,
            type: deviceType,
            location: sessionData.ip || "Unknown",
            lastActive: formattedTime,
          };
        });

        setDevices(deviceData);
      } else {
        setDevices([]);
      }
      
      hasFetchedDevicesRef.current = true;
    } catch (err) {
      console.error("Error in fetchDeviceCount:", err);
    } finally {
      setIsLoadingDevices(false);
    }
  }, [user?.id, isLoadingDevices]);

  /**
   * Fetch upcoming invoice
   */
  const refreshUpcomingInvoice = useCallback(async () => {
    if (!user?.profile?.customer_id || isLoadingUpcomingInvoice) return;
    
    setIsLoadingUpcomingInvoice(true);
    setUpcomingInvoice({ amount: null, due_date: null, error: null });
    
    try {
      // Use the same function that billing page was using
      const { getUpcomingInvoice } = await import("@/utils/stripe/actions");
      const { amount, error, due_date } = await getUpcomingInvoice(user.profile.customer_id);

      if (error) {
        setUpcomingInvoice({
          amount: null,
          due_date: null,
          error: error,
        });
        return;
      }

      setUpcomingInvoice({
        amount: amount,
        due_date: due_date,
        error: null,
      });
    } catch (err) {
      console.error("Error fetching upcoming invoice:", err);
      setUpcomingInvoice({
        amount: null,
        due_date: null,
        error: "Failed to load upcoming invoice",
      });
    } finally {
      setIsLoadingUpcomingInvoice(false);
    }
  }, [user?.profile?.customer_id, isLoadingUpcomingInvoice]);

  /**
   * Fetch invoice history
   */
  const refreshInvoices = useCallback(async () => {
    if (!user?.profile?.customer_id || isLoadingInvoices) return;
    
    setIsLoadingInvoices(true);
    
    try {
      // Use the same function that billing page was using
      const { getCustomerInvoices } = await import("@/utils/stripe/supabase-stripe");
      const { invoices, error } = await getCustomerInvoices(user.profile.customer_id);

      if (error) {
        console.error("Error fetching invoices:", error);
        setInvoices([]);
        return;
      }

      if (invoices) {
        setInvoices(invoices);
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setInvoices([]);
    } finally {
      setIsLoadingInvoices(false);
    }
  }, [user?.profile?.customer_id, isLoadingInvoices]);

  // Auto-fetch prices on mount (needed by multiple pages)
  useEffect(() => {
    if (!prices.monthly && !isLoadingPrices) {
      refreshPrices();
    }
  }, [prices.monthly, isLoadingPrices, refreshPrices]);

  // Auto-fetch NFR status on mount if user is available
  useEffect(() => {
    if (user?.id && hasNfr === null && !isLoadingNfr) {
      refreshNfr();
    }
  }, [user?.id, hasNfr, isLoadingNfr, refreshNfr]);

  // Auto-fetch devices on mount if user is available (only once per user)
  useEffect(() => {
    if (user?.id && !hasFetchedDevicesRef.current && !isLoadingDevices) {
      refreshDevices();
    }
  }, [user?.id, isLoadingDevices, refreshDevices]);
  
  // Reset fetch flag when user changes
  useEffect(() => {
    hasFetchedDevicesRef.current = false;
  }, [user?.id]);

  const value = useMemo(
    () => ({
      prices,
      isLoadingPrices,
      priceError,
      refreshPrices,
      hasNfr,
      isLoadingNfr,
      refreshNfr,
      deviceCount,
      devices,
      isLoadingDevices,
      refreshDevices,
      upcomingInvoice,
      isLoadingUpcomingInvoice,
      refreshUpcomingInvoice,
      invoices,
      isLoadingInvoices,
      refreshInvoices,
    }),
    [
      prices,
      isLoadingPrices,
      priceError,
      refreshPrices,
      hasNfr,
      isLoadingNfr,
      refreshNfr,
      deviceCount,
      devices,
      isLoadingDevices,
      refreshDevices,
      upcomingInvoice,
      isLoadingUpcomingInvoice,
      refreshUpcomingInvoice,
      invoices,
      isLoadingInvoices,
      refreshInvoices,
    ]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

/**
 * @brief Custom hook to access the dashboard context.
 * @description Provides access to shared dashboard data and refresh functions.
 * @returns {DashboardContextType} Dashboard context value.
 * @throws {Error} If used outside of DashboardProvider.
 */
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

