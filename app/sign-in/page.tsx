'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IconSpinner } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const router = useRouter()

  const isFormValid = useMemo(() => {
    return formData.email.trim() !== '' && formData.password !== ''
  }, [formData.email, formData.password])

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, email: e.target.value }))
    },
    []
  )

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, password: e.target.value }))
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!isFormValid || isLoading) return

      setIsLoading(true)

      try {
        const formData_ = new FormData()
        formData_.append('email', formData.email.trim().toLowerCase())
        formData_.append('password', formData.password)

        const response = await fetch('/api/auth/sign-in', {
          method: 'POST',
          body: formData_
        })

        const result = await response.json()

        if (!response.ok || result.error) {
          toast.error(result.error || 'Произошла ошибка при входе')
          setIsLoading(false)
          return
        }

        window.location.href = '/'
      } catch (error) {
        toast.error('Произошла ошибка сети. Попробуйте снова.')
        setIsLoading(false)
      }
    },
    [formData.email, formData.password, isFormValid, isLoading]
  )

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 fade-in">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-border/50 bg-background/80 p-8 shadow-lg backdrop-blur-sm">
          <h1 className="mb-6 text-2xl font-semibold text-center">Войти</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <Input
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleEmailChange}
                className={cn(
                  'h-12 rounded-2xl border-border/50 bg-muted/20 px-4',
                  'focus:border-primary/50 focus:bg-background/50 focus:ring-1 focus:ring-primary/20',
                  'transition-all duration-200 placeholder:text-muted-foreground/50'
                )}
                placeholder="вы@example.com"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Пароль</Label>
              <Input
                type="password"
                required
                autoComplete="current-password"
                value={formData.password}
                onChange={handlePasswordChange}
                className={cn(
                  'h-12 rounded-2xl border-border/50 bg-muted/20 px-4',
                  'focus:border-primary/50 focus:bg-background/50 focus:ring-1 focus:ring-primary/20',
                  'transition-all duration-200 placeholder:text-muted-foreground/50'
                )}
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !isFormValid}
              className={cn(
                'h-12 w-full rounded-2xl font-medium transition-all duration-200',
                'shadow-sm hover:scale-[1.02] hover:shadow-md active:scale-[0.98]',
                'disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {isLoading && (
                <IconSpinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isLoading ? 'Выполняется вход...' : 'Войти'}
            </Button>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Обратитесь к администратору для получения доступа
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
