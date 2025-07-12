import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define routes that require authentication (interactive actions)
const protectedRoutes = ['/ask', '/answer', '/profile', '/settings', '/dashboard']

// Define routes that should redirect to home if user is already authenticated
const authRoutes = ['/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get the token from cookies or headers
  const token = request.cookies.get('accessToken')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')
  
  // Check if user is authenticated (has a valid token)
  const isAuthenticated = !!token

  // If trying to access protected routes without authentication
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // If trying to access auth routes while already authenticated
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Allow all other routes to be accessed publicly
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}
