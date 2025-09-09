import { NextResponse } from 'next/server'
import { clearAuthCache } from '@/auth'

export async function POST() {
  // Clear the auth cache
  clearAuthCache()
  
  const response = NextResponse.json({ success: true })
  
  // Clear JWT token
  response.cookies.set({
    name: 'jwt_token',
    value: '',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0
  })
  
  // Clear legacy cookie
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
