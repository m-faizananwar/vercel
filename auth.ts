import 'server-only'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

type LocalSession = {
  user: { id: string; email: string }
}

// JWT secret - in production, use a proper environment variable
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
)

// Simple cache for auth results to reduce database calls
const authCache = new Map<string, { session: LocalSession | null; timestamp: number }>()
const CACHE_DURATION = 5 * 24 * 60 * 60 * 1000 // 5 days (increased from 5 minutes)

// Function to clear auth cache (used during logout)
export const clearAuthCache = () => {
  authCache.clear()
}

/**
 * Create a JWT token for a user
 */
export const createJWT = async (userId: string, email: string): Promise<string> => {
  return await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // 30 days
    .sign(JWT_SECRET)
}

/**
 * Verify and decode a JWT token
 */
export const verifyJWT = async (token: string): Promise<{ userId: string; email: string } | null> => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return { userId: payload.userId as string, email: payload.email as string }
  } catch (error) {
    return null
  }
}

/**
 * Fast auth check using JWT - no database call needed
 */
export const authFast = async ({
  cookieStore
}: {
  cookieStore: ReturnType<typeof cookies>
}): Promise<LocalSession | null> => {
  const jwtToken = cookieStore.get('jwt_token')?.value
  if (!jwtToken) return null

  const decoded = await verifyJWT(jwtToken)
  if (!decoded) return null

  return {
    user: {
      id: decoded.userId,
      email: decoded.email
    }
  }
}

/**
 * Returns a synthesized session-like object from local_users using
 * the httpOnly cookie 'local_user_id'. Returns null if unauthenticated.
 * Now with JWT optimization for reduced database calls.
 */
export const auth = async ({
  cookieStore
}: {
  cookieStore: ReturnType<typeof cookies>
}): Promise<LocalSession | null> => {
  // First try JWT-based auth (fast path)
  const jwtSession = await authFast({ cookieStore })
  if (jwtSession) return jwtSession

  // Fall back to legacy cookie-based auth
  const userId = cookieStore.get('local_user_id')?.value
  if (!userId) return null

  // Check cache first
  const cached = authCache.get(userId)
  const now = Date.now()
  
  if (cached && (now - cached.timestamp < CACHE_DURATION)) {
    return cached.session
  }

  // Anonymous supabase client is fine because local_users currently has no RLS.
  const supabase = createServerComponentClient({ cookies: () => cookieStore })
  
  try {
    const { data, error } = await supabase
      .from('local_users')
      .select('id,email')
      .eq('id', userId)
      .single()

    if (error || !data) {
      // Cache negative result
      authCache.set(userId, { session: null, timestamp: now })
      return null
    }

    const session: LocalSession = { user: { id: data.id, email: data.email } }
    
    // Cache positive result
    authCache.set(userId, { session, timestamp: now })
    
    return session
  } catch (error) {
    console.error('Auth error:', error)
    // Cache negative result on error
    authCache.set(userId, { session: null, timestamp: now })
    return null
  }
}
