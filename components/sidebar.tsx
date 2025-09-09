'use client'

import * as React from 'react'
import Link from 'next/link'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet'
import { IconSidebar, IconPlus } from '@/components/ui/icons'

export interface SidebarProps {
  children?: React.ReactNode
  footer?: React.ReactNode
  session?: any
}

export function Sidebar({ children, footer, session }: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="-ml-2 h-9 w-9 rounded-full bg-muted/30 p-0 transition-all duration-200 hover:scale-105 hover:bg-muted/50 active:scale-95">
          <IconSidebar className="h-5 w-5" />
          <span className="sr-only">Переключить боковую панель</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="inset-y-0 flex h-auto w-[320px] flex-col border-r border-border/50 bg-background/95 p-0 backdrop-blur-xl">
        <SheetHeader className="border-b border-border/50 px-6 py-5">
          <SheetTitle className="text-base font-semibold tracking-tight">Чаты команды</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-auto">
          {/* Team chats content - only render when sidebar is opened */}
          {isOpen && children}
        </div>

        {/* Footer */}
        {footer}
      </SheetContent>
    </Sheet>
  )
}
