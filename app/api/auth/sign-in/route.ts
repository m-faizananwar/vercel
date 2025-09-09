import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createJWT } from '@/auth'

/**
 * Optimized sign-in API endpoint with JWT support
 * 
 * Performance improvements:
 * - Uses API route instead of server actions for better client-side handling
 * - Direct database query to local_users table (no Supabase auth overhead)
 * - Creates JWT tokens to eliminate database calls on subsequent auth checks
 * - Efficient error handling and response structure
 * - Proper HTTP status codes for better client-side error handling
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const email = (formData.get('email') as string || '').trim().toLowerCase()
    const password = formData.get('password') as string || ''

    if (!email || !password) {
      return NextResponse.json({ error: 'Требуются email и пароль.' }, { status: 400 })
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Query the local_users table for authentication
    const { data: user, error } = await supabase
      .from('local_users')
      .select('id,email,password')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Неверные учетные данные.' }, { status: 401 })
    }

    if (user.password !== password) {
      return NextResponse.json({ error: 'Неверные учетные данные.' }, { status: 401 })
    }

    // Create JWT token for fast authentication
    const jwtToken = await createJWT(user.id, user.email)

    // Set both JWT and legacy cookies for compatibility
    const response = NextResponse.json({ success: true })
    
    // JWT cookie for fast auth
    response.cookies.set({
      name: 'jwt_token',
      value: jwtToken,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })
    
    // Legacy cookie for backward compatibility
    response.cookies.set({
      name: 'local_user_id',
      value: user.id,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    return response
  } catch (error) {
    console.error('Sign-in error:', error)
    return NextResponse.json({ error: 'Произошла ошибка при входе.' }, { status: 500 })
  }
} 