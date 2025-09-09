import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/db_types'
import { jwtVerify } from 'jose'

// JWT secret - should match auth.ts
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
)

/**
 * Fast JWT verification for middleware
 */
async function verifyJWT(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, JWT_SECRET)
    return true
  } catch {
    return false
  }
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  const pathname = req.nextUrl.pathname
  const isSignIn = pathname.startsWith('/sign-in')
  const isSuperAdminRoute = pathname.startsWith('/super-admin')
  const isPublicRoute = pathname.startsWith('/api') || 
                       pathname.startsWith('/_next') || 
                       pathname.startsWith('/favicon') ||
                       pathname.startsWith('/share') ||
                       pathname.endsWith('.ico') ||
                       pathname.endsWith('.png') ||
                       pathname.endsWith('.jpg') ||
                       pathname.endsWith('.jpeg') ||
                       pathname.endsWith('.svg')

  // Skip auth checks for public routes
  if (isPublicRoute) {
    return res
  }

  // Fast JWT-based auth check first
  const jwtToken = req.cookies.get('jwt_token')?.value
  let isAuthenticated = false
  
  if (jwtToken) {
    isAuthenticated = await verifyJWT(jwtToken)
  }
  
  // Fallback to legacy cookie check if JWT not found or invalid
  if (!isAuthenticated) {
    const localUserId = req.cookies.get('local_user_id')?.value
    isAuthenticated = !!localUserId
  }

  // If no auth and not on sign-in -> redirect to sign-in
  if (!isAuthenticated && !isSignIn) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/sign-in'
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated but on sign-in -> redirect away
  if (isAuthenticated && isSignIn) {
    const redirectTarget = req.nextUrl.searchParams.get('redirectedFrom') || '/'
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = redirectTarget
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  // For super admin routes, we'll check permissions in the page component
  // This avoids expensive database calls in middleware
  
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - share (publicly shared chats)
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!share|api|_next/static|_next/image|favicon.ico).*)'
  ]
}
