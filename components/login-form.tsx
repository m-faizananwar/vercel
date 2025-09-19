'use client'

import * as React from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { IconSpinner } from '@/components/ui/icons'
import { Input } from './ui/input'
import { Label } from './ui/label'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface LoginFormProps extends React.ComponentPropsWithoutRef<'div'> {
  action?: 'sign-in'
}

export function LoginForm({
  className,
  action = 'sign-in',
  ...props
}: LoginFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()
  // Create a Supabase client configured to use cookies
  const supabase = createClientComponentClient()

  const [formState, setFormState] = React.useState<{
    email: string
    password: string
  }>({
    email: '',
    password: ''
  })

  const signIn = async () => {
    const { email, password } = formState
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return error
  }

  const handleOnSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
    e.preventDefault()
    setIsLoading(true)

    const error = await signIn()

    if (error) {
      setIsLoading(false)
      toast.error(error.message)
      return
    }

    setIsLoading(false)
    router.refresh()
  }

  return (
    <div {...props}>
      <form onSubmit={handleOnSubmit} className="space-y-6">
        <fieldset className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Email</Label>
            <Input
              name="email"
              type="email"
              placeholder="Введите ваш email"
              value={formState.email}
              onChange={e =>
                setFormState(prev => ({
                  ...prev,
                  email: e.target.value
                }))
              }
              className={cn(
                "h-12 rounded-2xl border-border/50 bg-muted/20 px-4",
                "focus:border-primary/50 focus:bg-background/50 focus:ring-1 focus:ring-primary/20",
                "transition-all duration-200 placeholder:text-muted-foreground/50"
              )}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Пароль</Label>
            <Input
              name="password"
              type="password"
              placeholder="Введите ваш пароль"
              value={formState.password}
              onChange={e =>
                setFormState(prev => ({
                  ...prev,
                  password: e.target.value
                }))
              }
              className={cn(
                "h-12 rounded-2xl border-border/50 bg-muted/20 px-4",
                "focus:border-primary/50 focus:bg-background/50 focus:ring-1 focus:ring-primary/20",
                "transition-all duration-200 placeholder:text-muted-foreground/50"
              )}
            />
          </div>
        </fieldset>

        <div className="space-y-4">
          <Button 
            disabled={isLoading || !formState.email || !formState.password}
            className={cn(
              "h-12 w-full rounded-2xl font-medium transition-all duration-200",
              "shadow-sm hover:scale-[1.02] hover:shadow-md active:scale-[0.98]",
              "disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {isLoading && <IconSpinner className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Contact your administrator for access
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
