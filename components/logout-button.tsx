'use client'

import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  return (
    <Button 
      variant="ghost" 
      className="justify-start w-full text-left"
      onClick={() => signOut({ callbackUrl: '/' })}
    >
      Sair
    </Button>
  )
} 