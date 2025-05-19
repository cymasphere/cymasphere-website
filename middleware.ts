import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

// List of all supported locales
const locales = ['en', 'es', 'fr', 'de', 'ja'];

// Default locale is English
const defaultLocale = 'en';

// Get the preferred locale
function getLocale(request: NextRequest) {
  // Check if there is a cookie with a saved locale
  const savedLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (savedLocale && locales.includes(savedLocale)) {
    return savedLocale;
  }

  // Check the Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    // Parse the accept-language header
    const parsedLocales = acceptLanguage.split(',')
      .map(l => l.split(';')[0].trim())
      .map(l => l.substring(0, 2).toLowerCase());

    // Find the first locale that is supported
    const matchedLocale = parsedLocales.find(l => locales.includes(l));
    if (matchedLocale) {
      return matchedLocale;
    }
  }

  // Fall back to default locale
  return defaultLocale;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // First, handle the Supabase session
  const response = await updateSession(request);
  
  // Check if the pathname already has a locale
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Skip locale redirect for API routes, static files, etc.
  const isStaticFile = /\.(jpg|jpeg|png|gif|svg|css|js)$/.test(pathname);
  const isApiRoute = pathname.startsWith('/api/');
  const isSpecialRoute = pathname.startsWith('/_next/') || 
    pathname === '/favicon.ico' || 
    pathname.startsWith('/images/');

  if (pathnameHasLocale || isStaticFile || isApiRoute || isSpecialRoute) {
    return response;
  }

  // Redirect if there is no locale
  const locale = getLocale(request);
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  
  // Copy all search params
  request.nextUrl.searchParams.forEach((value, key) => {
    newUrl.searchParams.set(key, value);
  });

  // Create a new response with the redirect
  const redirectResponse = NextResponse.redirect(newUrl);
  
  // Copy over the cookies from the Supabase response
  response.cookies.getAll().forEach(cookie => {
    redirectResponse.cookies.set(cookie.name, cookie.value, {
      domain: cookie.domain,
      expires: cookie.expires,
      httpOnly: cookie.httpOnly,
      maxAge: cookie.maxAge,
      path: cookie.path,
      sameSite: cookie.sameSite as any,
      secure: cookie.secure
    });
  });

  return redirectResponse;
}

export const config = {
  // Match all request paths except for:
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (browser icon)
  // - images/ (local images)
  // - api/ routes
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|api).*)'],
};
