'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminHeaderProps {
  title: string
  description?: string
}

export function AdminHeader({ title, description }: AdminHeaderProps) {
  const pathname = usePathname()
  
  // Verificar se estamos em uma subpágina administrativa
  const isSubPage = pathname !== '/admin' && pathname.startsWith('/admin')
  
  return (
    <div className="flex flex-col gap-4 pb-4 mb-6 border-b">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        
        {isSubPage && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-md",
              "bg-secondary hover:bg-secondary/80 transition-colors"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <LayoutDashboard className="h-4 w-4 mr-1" />
            Voltar ao Painel
          </Link>
        )}
      </div>
    </div>
  )
} 