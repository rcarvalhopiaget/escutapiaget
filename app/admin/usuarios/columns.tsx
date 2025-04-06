'use client'

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash } from "lucide-react"
import Link from "next/link"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mapeamento dos departamentos para texto
const departmentMap: Record<string, string> = {
  'diretoria': 'Diretoria',
  'juridico': 'Jurídico',
  'pedagogico': 'Pedagógico',
  'secretaria': 'Secretaria',
  'ti': 'TI',
  'administrativo': 'Administrativo',
  'financeiro': 'Financeiro'
}

// Mapeamento das roles para texto
const roleMap: Record<string, { text: string; variant: 'default' | 'outline' | 'secondary' | 'destructive' }> = {
  'admin': { 
    text: 'Administrador', 
    variant: 'destructive' 
  },
  'director': { 
    text: 'Diretor', 
    variant: 'secondary' 
  },
  'manager': { 
    text: 'Gerente', 
    variant: 'outline' 
  },
  'staff': { 
    text: 'Funcionário', 
    variant: 'default' 
  }
}

// Definindo a interface para usuários
export interface UserData {
  _id: string
  name: string
  email: string
  role: string
  department: string
  createdAt: string
  permissions: {
    viewTickets: boolean
    respondTickets: boolean
    editTickets: boolean
    deleteTickets: boolean
    manageUsers: boolean
    viewDashboard: boolean
    viewAllDepartments: boolean
  }
}

export const userColumns: ColumnDef<UserData>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "email",
    header: "E-mail",
  },
  {
    accessorKey: "department",
    header: "Departamento",
    cell: ({ row }) => {
      const department = row.getValue("department") as string
      return <span>{departmentMap[department] || department}</span>
    },
  },
  {
    accessorKey: "role",
    header: "Função",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      const roleInfo = roleMap[role] || { text: role, variant: 'default' as const }
      
      return (
        <Badge variant={roleInfo.variant}>
          {roleInfo.text}
        </Badge>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/admin/usuarios/${user._id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
] 