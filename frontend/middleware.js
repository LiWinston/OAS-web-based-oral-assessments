import { NextResponse } from 'next/server';

/**
 * Next.js Middleware
 * 
 * Handles authentication and route protection for the application.
 * Runs before every request to check authentication status and enforce
 * role-based access control.
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Get JWT token from cookies
  const token = request.cookies.get('auth-token')?.value;
  
  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/superadmin-login'];
  
  // Check if it's a public route
  if (publicRoutes.includes(pathname)) {
    // Allow access to login pages regardless of authentication status
    // Users should be able to switch accounts or access different login portals
    return NextResponse.next();
  }
  
  // Protected routes - require authentication
  if (!token && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Role-based route protection mapping
  const roleRoutes = {
    '/student': ['STUDENT'],
    '/examiner': ['EXAMINER'],
    '/admin': ['COURSE_ADMIN'],
    '/superadmin': ['SUPER_ADMIN'],
  };
  
  // Get the base route (first segment after /)
  const baseRoute = '/' + pathname.split('/')[1];
  
  // If route has role restrictions, check them
  if (roleRoutes[baseRoute]) {
    // TODO: In production, decode and validate JWT to check user role
    // For now, we'll allow access and let the client-side handle role verification
    // This is a security consideration that should be addressed before deployment
  }
  
  return NextResponse.next();
}

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};