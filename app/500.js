import React from 'react';

export default function Error500Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold text-red-600 mb-4">500 - Server Error</h1>
        <p className="text-gray-600 mb-6">
          We're sorry, but something went wrong on our server.
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded"
        >
          Go back home
        </button>
      </div>
    </div>
  );
} 