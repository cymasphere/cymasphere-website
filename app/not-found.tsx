"use client";

import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16 text-center bg-gray-900 text-white">
      <div className="max-w-md mx-auto">
        <h1 className="text-5xl font-bold mb-6">404</h1>
        <h2 className="text-3xl font-semibold mb-4">Page Not Found</h2>
        <p className="mb-8 text-lg">
          We couldn't find the page you're looking for.
        </p>
        <Link href="/" className="px-6 py-3 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
          Return Home
        </Link>
      </div>
    </div>
  );
} 