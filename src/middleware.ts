import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'
import { notFound } from 'next/navigation';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)

  // This will refresh the session cookie if it's expired.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protect admin route
  if (pathname.startsWith('/admin')) {
    if (!user) {
      // Not logged in, redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check user role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      // Not an admin, show 404. We can rewrite to a custom 404 if we had one,
      // for now, Next.js default 404 will be triggered by this rewrite.
      const url = request.nextUrl.clone()
      url.pathname = '/404'
      return NextResponse.rewrite(url)
    }
  }


  // Define public routes
  const publicRoutes = ['/', '/login', '/signup', '/auth/confirm']
  const courseDetailRoutePattern = /^\/courses(\/.*)?$/;

  const isPublicRoute = publicRoutes.includes(pathname) || courseDetailRoutePattern.test(pathname)

  // Define authenticated routes prefix
  const isAuthenticatedRoute = pathname.startsWith('/dashboard')

  // If user is logged in and tries to access login or signup, redirect to dashboard
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If user is not logged in and tries to access a protected route, redirect to login
  if (!user && isAuthenticatedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/callback).*)',
  ],
}
