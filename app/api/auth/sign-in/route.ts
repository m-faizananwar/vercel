import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createJWT } from '@/auth'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const email = ((formData.get('email') as string) || '').trim().toLowerCase()
    const password = (formData.get('password') as string) || ''

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Требуются email и пароль.' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: user, error } = await supabase
      .from('local_users')
      .select('id,email,password')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Неверные учетные данные.' },
        { status: 401 }
      )
    }

    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Неверные учетные данные.' },
        { status: 401 }
      )
    }

    const jwtToken = await createJWT(user.id, user.email)

    const response = NextResponse.json({ success: true })

    response.cookies.set({
      name: 'jwt_token',
      value: jwtToken,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30
    })

    response.cookies.set({
      name: 'local_user_id',
      value: user.id,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Произошла ошибка при входе.' },
      { status: 500 }
    )
  }
}
