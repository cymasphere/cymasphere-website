import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white animate-fade-in">
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background: `linear-gradient(to bottom right, var(--gradient-start), var(--gradient-end))`,
          }}
        ></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="flex flex-col items-center text-center animate-slide-up">
            <Image
              className="mb-10 hover:opacity-90 transition-opacity"
              src="/next.svg"
              alt="Next.js logo"
              width={180}
              height={38}
              priority
            />
            <h1 className="gradient-heading text-4xl md:text-6xl mb-6">
              Welcome to Next.js Template
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mb-10 text-gray-300">
              A modern, dark-themed starter template with authentication and a
              beautiful UI
            </p>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-4">
              <Link href="/dashboard" className="btn-primary px-8">
                Get Started
              </Link>
              <Link href="/login" className="btn-secondary px-8">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="feature-card">
            <div className="feature-icon-container">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Fast & Responsive</h3>
            <p className="text-gray-400">
              Built with Next.js for blazing fast performance and modern user
              experiences.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="feature-card">
            <div className="feature-icon-container">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Authentication Ready</h3>
            <p className="text-gray-400">
              Built-in authentication flows for login, registration, and
              password reset.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="feature-card">
            <div className="feature-icon-container">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Modern UI Components</h3>
            <p className="text-gray-400">
              Beautiful and responsive UI components built with Tailwind CSS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
