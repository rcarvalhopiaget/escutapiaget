'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TicketType } from "../types/ticket"
import Link from "next/link"
import { useCallback } from "react"

interface TicketTypeCardProps {
  title: string
  description: string
  type: TicketType
  icon: React.ReactNode
  onSelect?: (type: TicketType) => void
  redirectUrl?: string
}

export function TicketTypeCard({
  title,
  description,
  type,
  icon,
  onSelect,
  redirectUrl
}: TicketTypeCardProps) {
  const handleClick = useCallback(() => {
    if (onSelect) {
      onSelect(type)
    }
  }, [onSelect, type])

  const content = (
    <Card className="h-full transition-all cursor-pointer hover:shadow-md hover:scale-105">
      <CardHeader>
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary-50 mb-2">
          {icon}
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-neutral-500">{getDeadlineMessage(type)}</p>
      </CardContent>
    </Card>
  )

  if (redirectUrl) {
    return (
      <Link href={redirectUrl} className="block h-full">
        {content}
      </Link>
    )
  }

  return <div onClick={handleClick}>{content}</div>
}

function getDeadlineMessage(type: TicketType): string {
  if (type === TicketType.DENUNCIA) {
    return "Prazo de resposta: até 48 horas"
  }
  return "Prazo de resposta: até 15 dias"
} 