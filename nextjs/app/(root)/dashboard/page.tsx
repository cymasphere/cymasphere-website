"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components_template/AuthContext";
import { useRouter } from "next/navigation";
import SessionsCard from "@/components_template/SessionsCard";

export default function DashboardPage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push("/login");
      return;
    }

    // Set initial values
    if (user?.profile?.name) {
      setName(user.profile.name);
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);

    try {
      // Update user metadata in Supabase auth
      if (!user) {
        setError("Not logged in");
        return;
      }
      const profile = { ...user.profile, name };

      const { error } = await updateProfile(profile);
      if (error) {
        setError(error);
        return;
      }
      setMessage("Profile updated successfully");
    } catch (err) {
      console.error("Profile update error:", err);
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="card max-w-md mx-auto mt-10 animate-fade-in">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 animate-fade-in">
      <h1 className="gradient-heading">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Account</h2>
            <div className="mb-2">
              <span className="text-gray-400">Email:</span>
              <div className="text-gray-200">{user.email}</div>
            </div>
            <div className="mb-2">
              <span className="text-gray-400">Member since:</span>
              <div className="text-gray-200">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>

            {error && <div className="error-alert">{error}</div>}

            {message && <div className="success-alert">{message}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                />
              </div>

              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving..." : "Update Profile"}
              </button>
            </form>
          </div>

          <SessionsCard user={user} router={router} />
        </div>
      </div>
    </div>
  );
}
