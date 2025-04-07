'use client';

import React from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-16 text-center bg-gray-900 text-white">
      <div className="max-w-md mx-auto">
        <h1 className="text-5xl font-bold mb-6">Something went wrong</h1>
        <p className="mb-8 text-lg">
          An error occurred while processing your request.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Try again
          </button>
          <Link href="/" className="px-6 py-3 bg-gray-600 rounded-md hover:bg-gray-700 transition-colors">
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
} 