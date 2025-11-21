import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // In development mode, allow all traffic (for local testing)
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  // Get country code from Vercel's geolocation headers
  const country = request.geo?.country || request.headers.get('x-vercel-ip-country')

  // Allow only traffic from Israel (IL)
  // If country is not available (shouldn't happen on Vercel), allow the request
  if (country && country !== 'IL') {
    // Redirect to access denied page
    return NextResponse.redirect(new URL('/access-denied', request.url))
  }

  // Allow the request to proceed
  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  // Apply middleware to all routes except API routes (if you want to allow API access)
  // You can customize this based on your needs
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (if you want to allow API access from anywhere)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

