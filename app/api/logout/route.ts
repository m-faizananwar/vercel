import { NextResponse } from 'next/server'
import { clearAuthCache } from '@/auth'

export async function POST() {
  clearAuthCache()

  const response = NextResponse.json({ success: true })

  response.cookies.set({
    name: 'jwt_token',
    value: '',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0
  })

  response.cookies.set({
    name: 'local_user_id',
    value: '',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0
  })

  return response
}
