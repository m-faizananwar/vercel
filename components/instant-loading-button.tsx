'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { IconSpinner } from '@/components/ui/icons'

interface InstantLoadingButtonProps {
  href: string
  children: React.ReactNode
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  prefetch?: boolean
}

export function InstantLoadingButton({
  href,
  children,
  variant = 'default',
  size = 'default',
  className,
  prefetch = false,
  ...props
}: InstantLoadingButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleClick = () => {
    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={isPending}
      onClick={handleClick}
      {...props}
    >
      {isPending ? (
        <>
          <IconSpinner className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        children
      )}
    </Button>
  )
}
