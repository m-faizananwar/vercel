import 'server-only'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

type LocalSession = {
  user: { id: string; email: string }
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
)

const authCache = new Map<
  string,
  { session: LocalSession | null; timestamp: number }
>()
const CACHE_DURATION = 5 * 24 * 60 * 60 * 1000

export const clearAuthCache = () => {
  authCache.clear()
}

export const createJWT = async (
  userId: string,
  email: string
): Promise<string> => {
  return await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET)
}

export const verifyJWT = async (
  token: string
): Promise<{ userId: string; email: string } | null> => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return { userId: payload.userId as string, email: payload.email as string }
  } catch (error) {
    return null
  }
}

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

export const auth = async ({
  cookieStore
}: {
  cookieStore: ReturnType<typeof cookies>
}): Promise<LocalSession | null> => {
  const jwtSession = await authFast({ cookieStore })
  if (jwtSession) return jwtSession

  const userId = cookieStore.get('local_user_id')?.value
  if (!userId) return null

  const cached = authCache.get(userId)
  const now = Date.now()

  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.session
  }

  const supabase = createServerComponentClient({ cookies: () => cookieStore })

  try {
    const { data, error } = await supabase
      .from('local_users')
      .select('id,email')
      .eq('id', userId)
      .single()

    if (error || !data) {
      authCache.set(userId, { session: null, timestamp: now })
      return null
    }

    const session: LocalSession = { user: { id: data.id, email: data.email } }

    authCache.set(userId, { session, timestamp: now })

    return session
  } catch (error) {
    authCache.set(userId, { session: null, timestamp: now })
    return null
  }
}
