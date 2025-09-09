'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { IconSpinner } from '@/components/ui/icons'

interface ChatWrapperProps {
  href: string
  children: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  prefetch?: boolean
  onClick?: () => void
  disabled?: boolean
}

export function ChatWrapper({
  href,
  children,
  variant = 'default',
  size = 'default',
  className,
  prefetch = false,
  onClick,
  disabled = false,
  ...props
}: ChatWrapperProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    setIsLoading(true)
    if (onClick) {
      await onClick()
    }
    router.push(href)
  }

  if (href.startsWith('http') || disabled) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...props}
      >
        {isLoading ? (
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

  return (
    <Link href={href} prefetch={prefetch} onClick={() => setIsLoading(true)}>
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <IconSpinner className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          children
        )}
      </Button>
    </Link>
  )
}
