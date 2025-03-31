import Image from "next/image";
import Link from "next/link";
import React from "react";
import SignIn from "./SignIn";

const Navbar = () => {
  return (
    <header className="bg-gray-900/90 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50 py-1">
      <div className="max-w-7xl mx-auto">
        <nav className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center" aria-label="Home">
              <Image
                src="/next.svg"
                alt="logo"
                width="144"
                height="30"
                className="invert hover:opacity-90 transition-opacity"
                priority
              />
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link
                href="/pricing"
                className="text-gray-300 hover:text-white font-medium"
              >
                Pricing
              </Link>
            </div>
          </div>
          <SignIn />
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
