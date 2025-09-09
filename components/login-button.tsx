'use client'

import * as React from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'
import { IconGitHub, IconSpinner } from '@/components/ui/icons'

interface LoginButtonProps extends ButtonProps {
  showGithubIcon?: boolean
  text?: string
}

export function LoginButton({
  text = 'Login',
  showGithubIcon = true,
  className,
  ...props
}: LoginButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  // Create a Supabase client configured to use cookies
  const supabase = createClientComponentClient()

  if (process.env.NEXT_PUBLIC_AUTH_GITHUB !== 'true') {
    return null
  }

  return (
    <Button
      variant="outline"
      onClick={async () => {
        setIsLoading(true)
        await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: { redirectTo: `${location.origin}/api/auth/callback` }
        })
      }}
      disabled={isLoading}
      className={cn(
        "h-12 w-full rounded-2xl border-border/50 bg-muted/20 hover:bg-muted/40",
        "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
        "font-medium shadow-sm hover:shadow-md",
        "disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <IconSpinner className="mr-3 h-4 w-4 animate-spin" />
      ) : showGithubIcon ? (
        <IconGitHub className="mr-3 h-5 w-5" />
      ) : null}
      {text}
    </Button>
  )
}
