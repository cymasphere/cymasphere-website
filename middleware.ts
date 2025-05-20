import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// List of authentication-related routes
const AUTH_ROUTES = [
  '/login', 
  '/signup', 
  '/reset-password', 
  '/create-password',
  '/signup-success',
  '/signup-account-exists',
  '/checkout-success',
  '/checkout-canceled'
];

export async function middleware(request: NextRequest) {
  // Handle Supabase authentication session
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
