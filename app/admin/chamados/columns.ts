import { ColumnDef } from "@tanstack/react-table"
import { Ticket } from "@/app/types/ticket"

// Mapeia tipos de chamado para nomes mais amigáveis
const typeMap: Record<string, string> = {
  'reclamacao': 'Reclamação',
  'denuncia': 'Denúncia',
  'sugestao': 'Sugestão',
  'duvida': 'Dúvida',
  'privacidade': 'Privacidade'
}

// Mapeia status para nomes mais amigáveis
const statusMap: Record<string, string> = {
  'aberto': 'Aberto',
  'em_analise': 'Em Análise',
  'respondido': 'Respondido',
  'encaminhado': 'Encaminhado',
  'resolvido': 'Resolvido'
}

// Versão extremamente simplificada das colunas para evitar erros de parsing
export const ticketColumns: ColumnDef<Ticket>[] = [
  {
    accessorKey: "protocol",
    header: "Protocolo",
    cell: ({ row }) => row.getValue("protocol")
  },
  {
    accessorKey: "createdAt",
    header: "Data",
    cell: ({ row }) => {
      const createdAt = new Date(row.getValue("createdAt"))
      return createdAt.toLocaleDateString('pt-BR')
    }
  },
  {
    accessorKey: "type",
    header: "Tipo",
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      return typeMap[type] || type
    }
  },
  {
    accessorKey: "name",
    header: "Nome",
    cell: ({ row }) => {
      const name = row.getValue("name") as string
      return name || "Não informado"
    }
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const email = row.getValue("email") as string
      return email || "Não informado"
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return statusMap[status] || status
    }
  }
] 