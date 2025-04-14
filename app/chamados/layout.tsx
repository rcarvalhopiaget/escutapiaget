import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sistema de Chamados - Piaget',
  description: 'Envie reclamações, sugestões, dúvidas ou solicite informações sobre privacidade de dados',
}

export default function ChamadosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 