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
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  // Print env values in browser console (dev only) to verify loading
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    const maskedAnon = supabaseAnonKey.length > 12
      ? `${supabaseAnonKey.slice(0, 6)}...${supabaseAnonKey.slice(-4)}`
      : supabaseAnonKey
    // Avoid leaking full key in logs
    console.log('[Supabase] NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
    console.log('[Supabase] NEXT_PUBLIC_SUPABASE_ANON_KEY:', maskedAnon)
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
