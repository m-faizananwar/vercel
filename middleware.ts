import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/db_types'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
)

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
  const isPublicRoute =
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/share') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg')

  if (isPublicRoute) {
    return res
  }

  const jwtToken = req.cookies.get('jwt_token')?.value
  let isAuthenticated = false

  if (jwtToken) {
    isAuthenticated = await verifyJWT(jwtToken)
  }

  if (!isAuthenticated) {
    const localUserId = req.cookies.get('local_user_id')?.value
    isAuthenticated = !!localUserId
  }

  if (!isAuthenticated && !isSignIn) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/sign-in'
    redirectUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthenticated && isSignIn) {
    const redirectTarget = req.nextUrl.searchParams.get('redirectedFrom') || '/'
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = redirectTarget
    redirectUrl.search = ''
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ['/((?!share|api|_next/static|_next/image|favicon.ico).*)']
}
