import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/user'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST() {
  try {
    // Inicialmente verifica se já existe uma sessão autenticada
    const session = await getServerSession(authOptions)
    
    // Conectar ao banco de dados
    await dbConnect()
    
    // Verificar se o usuário admin já existe
    const existingUser = await User.findOne({ email: 'admin@escolapiaget.com.br' })
    
    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'Usuário admin já existe',
        credentials: {
          email: 'admin@escolapiaget.com.br',
          password: 'admin123'
        }
      })
    }
    
    // Criar o usuário admin se não existir
    const adminUser = await User.create({
      name: 'Administrador',
      email: 'admin@escolapiaget.com.br',
      password: 'admin123', // Será criptografada pelo modelo
      role: 'admin',
      department: 'TI',
      permissions: {
        viewTickets: true,
        respondTickets: true,
        editTickets: true,
        deleteTickets: true,
        manageUsers: true,
        viewDashboard: true,
        viewAllDepartments: true
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Usuário admin criado com sucesso',
      credentials: {
        email: 'admin@escolapiaget.com.br',
        password: 'admin123'
      },
      userId: adminUser._id.toString()
    })
    
  } catch (error) {
    console.error('Erro ao criar admin:', error)
    return NextResponse.json(
      { error: 'Falha ao criar usuário admin', details: (error as Error).message },
      { status: 500 }
    )
  }
} 