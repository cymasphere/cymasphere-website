"use client";

import React, { useState, useEffect } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useAuth } from "./AuthContext";

interface SessionsCardProps {
  user: User;
  router: AppRouterInstance;
}

export default function SessionsCard({ router }: SessionsCardProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  // const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionAction, setSessionAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { session, signOut } = useAuth();

  // const fetchSessions = useCallback(async () => {
  //   if (!user) return;

  //   setLoadingSessions(true);
  //   try {
  //     // Get the current session
  //     const { data: sessionData, error: sessionError } =
  //       await supabase.auth.getSession();
  //     if (sessionError) throw sessionError;

  //     // For demo purposes, create a simple array with just the current session
  //     // In a real app, you might use an Admin API with proper backend support to get all sessions
  //     setSessions(sessionData.session ? [sessionData.session] : []);
  //   } catch (err) {
  //     console.error("Error fetching sessions:", err);
  //   } finally {
  //     setLoadingSessions(false);
  //   }
  // }, [supabase.auth, user]);

  // useEffect(() => {
  //   fetchSessions();
  // }, [fetchSessions]);

  useEffect(() => {
    if (session) setSessions([session]);
    else setSessions([]);
  }, [session]);

  const handleLogoutSession = async (isCurrentSession: boolean) => {
    if (!isCurrentSession) {
      setError(
        "Only the current session can be logged out from this interface."
      );
      return;
    }

    setSessionAction("Processing...");
    try {
      const { error } = await signOut("local");
      if (error) throw error;
      router.push("/login");
    } catch (err: unknown) {
      console.error("Logout error:", err);
      setError(err instanceof Error ? err.message : "Failed to logout session");
      setSessionAction(null);
    }
  };

  const handleLogoutOtherSessions = async () => {
    setSessionAction("Processing...");
    try {
      const { error } = await signOut("others");
      if (error) throw error;
      setMessage("All other sessions successfully logged out");
    } catch (err: unknown) {
      console.error("Logout error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to logout other sessions"
      );
    } finally {
      setSessionAction(null);
    }
  };

  const handleLogoutAllSessions = async () => {
    setSessionAction("Processing...");
    try {
      const { error } = await signOut("global");
      if (error) throw error;
      router.push("/login");
    } catch (err: unknown) {
      console.error("Logout error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to logout all sessions"
      );
      setSessionAction(null);
    }
  };

  return (
    <div className="card mt-6">
      <h2 className="text-xl font-semibold mb-4">Active Sessions</h2>

      {error && <div className="error-alert">{error}</div>}
      {message && <div className="success-alert">{message}</div>}

      {sessions.length === 0 ? (
        <div className="text-gray-400">No active sessions found</div>
      ) : (
        <>
          <div className="mb-4">
            <div className="space-y-3">
              {sessions.map((session) => {
                const isCurrentSession = true; // There's only one session in our implementation
                return (
                  <div
                    key={session.access_token}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                  >
                    <div>
                      <div className="flex items-center">
                        <span className="text-gray-200">Current Device</span>
                        <span className="ml-2 px-2 py-1 text-xs bg-primary-500 rounded-full">
                          Current
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Last active: {new Date().toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleLogoutSession(isCurrentSession)}
                      disabled={!!sessionAction}
                      className="btn-danger-sm"
                    >
                      {sessionAction ? sessionAction : "Logout"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleLogoutOtherSessions}
              disabled={!!sessionAction}
              className="btn-secondary"
            >
              {sessionAction === "Processing..."
                ? sessionAction
                : "Logout Other Sessions"}
            </button>
            <button
              onClick={handleLogoutAllSessions}
              disabled={!!sessionAction}
              className="btn-danger"
            >
              {sessionAction === "Processing..."
                ? sessionAction
                : "Logout All Sessions"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
