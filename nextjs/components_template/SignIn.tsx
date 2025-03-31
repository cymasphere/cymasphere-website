"use client";

import Link from "next/link";
import { useAuth } from "./AuthContext";

export default function SignIn() {
  const { user } = useAuth();

  // Get the first letter of the name or email for the avatar
  const getInitial = () => {
    if (user?.profile.name) {
      return user.profile.name[0].toUpperCase();
    }
    // Fallback to email if name is not available
    return user?.email ? user.email[0].toUpperCase() : "?";
  };

  return (
    <div className="flex items-center justify-center w-8">
      {user ? (
        <Link href="/dashboard" className="block">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium cursor-pointer">
            {getInitial()}
          </div>
        </Link>
      ) : (
        <Link
          href="/login"
          className="text-gray-300 hover:text-white transition-colors font-medium"
        >
          Login
        </Link>
      )}
    </div>
  );
}
