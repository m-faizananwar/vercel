"use client"

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/db_types'

let client: SupabaseClient<Database> | null = null

function getCookie(name: string) {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[$()*+./?[\\\]^{|}-]/g, '\\$&') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string) {
  if (typeof document === 'undefined') return
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax${secure}`
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${secure}`
}

export function getSupabaseBrowser(): SupabaseClient<Database> {
  if (client) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.debug('[Supabase] Reusing browser client')
    }
    return client
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    const mask = (value: string) => {
      if (!value) return '""'
      const start = value.slice(0, 6)
      const end = value.slice(-4)
      const maskedMiddle = '*'.repeat(Math.max(0, value.length - 10))
      return `${start}${maskedMiddle}${end}`
    }
    console.info('[Supabase] Public env loaded', {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: mask(supabaseAnonKey),
      NODE_ENV: process.env.NODE_ENV
    })
    console.debug('[Supabase] Creating new browser client')
  }

  client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: false,
      storage: {
        getItem: (key) => getCookie(key),
        setItem: (key, value) => setCookie(key, value),
        removeItem: (key) => removeCookie(key)
      }
    }
  })

  return client
}
