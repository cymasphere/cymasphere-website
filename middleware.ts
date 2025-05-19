import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { languages as configLanguages, defaultLanguage as configDefaultLanguage } from "@/app/i18n/config";

// Fallback in case the import fails
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'ja'];
const DEFAULT_LANGUAGE = 'en';

// Use imported values if available, otherwise use fallbacks
const languages = Array.isArray(configLanguages) ? configLanguages : SUPPORTED_LANGUAGES;
const defaultLanguage = configDefaultLanguage || DEFAULT_LANGUAGE;

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // 1. First handle authentication session
  const response = await updateSession(request);
  
  // 2. Check if the pathname is missing a locale
  const pathnameHasLocale = languages.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  // 3. If it doesn't have a locale and it's not a special path, redirect to default locale
  if (!pathnameHasLocale && 
      !pathname.startsWith('/_next') && 
      !pathname.startsWith('/api/') && 
      !pathname.includes('.') && 
      pathname !== '/') {
    
    // Redirect to the default locale version
    const locale = defaultLanguage;
    return NextResponse.redirect(
      new URL(`/${locale}${pathname}`, request.url)
    );
  }
  
  // 4. If the pathname is exactly '/', redirect to default language
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(`/${defaultLanguage}`, request.url)
    );
  }
  
  return response;
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
