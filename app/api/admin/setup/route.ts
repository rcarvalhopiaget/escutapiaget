import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/user'

export async function GET(req: NextRequest) {
  try {
    console.log('[API] Iniciando configuração inicial')
    
    // Verifica se as variáveis de ambiente estão definidas
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD
    
    console.log('[API] Verificando variáveis de ambiente:', adminEmail ? 'Email definido' : 'Email não definido', adminPassword ? 'Senha definida' : 'Senha não definida')
    
    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { 
          error: 'ADMIN_EMAIL e ADMIN_PASSWORD devem ser definidos no arquivo .env.local'
        }, 
        { status: 400 }
      )
    }
    
    console.log('[API] Conectando ao banco de dados')
    await dbConnect()
    
    // Verifica se já existe um usuário administrador com o mesmo email
    const existingAdmin = await User.findOne({ email: adminEmail })
    
    if (existingAdmin) {
      console.log('[API] Administrador já existe:', adminEmail)
      return NextResponse.json(
        { message: 'Usuário administrador já existe.' }, 
        { status: 200 }
      )
    }
    
    console.log('[API] Criando usuário administrador')
    
    // Cria o usuário administrador inicial
    const adminUser = new User({
      name: 'Administrador',
      email: adminEmail,
      password: adminPassword, // Será criptografado pelo middleware do modelo
      role: 'admin',
      department: 'diretoria'
    })
    
    await adminUser.save()
    console.log('[API] Usuário administrador criado com sucesso')
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Usuário administrador criado com sucesso.' 
      }, 
      { status: 201 }
    )
    
  } catch (error) {
    console.error('[API] Erro na configuração inicial:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Falha na configuração inicial. Verifique os logs do servidor.'
      }, 
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log('[API] Iniciando criação do primeiro usuário')
    
    // Conectar ao MongoDB
    console.log('[API] Conectando ao banco de dados')
    await dbConnect()
    
    // Verificar se já existem usuários no sistema
    const existingUsers = await User.countDocuments()
    
    // Se já existem usuários, não permitir a criação via este endpoint
    if (existingUsers > 0) {
      console.log('[API] Já existem usuários no sistema. Operação negada.')
      return NextResponse.json(
        { 
          error: 'Já existem usuários no sistema. Use a interface administrativa para criar novos usuários.' 
        }, 
        { status: 403 }
      )
    }
    
    // Obter dados do corpo da requisição
    const userData = await req.json()
    console.log('[API] Dados recebidos:', { ...userData, password: '***' })
    
    // Validar campos obrigatórios
    if (!userData.name || !userData.email || !userData.password || !userData.role || !userData.department) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      )
    }
    
    // Criar usuário administrador
    console.log('[API] Criando primeiro usuário...')
    const user = new User({
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      department: userData.department,
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
    
    await user.save()
    console.log('[API] Primeiro usuário criado com sucesso:', user.email)
    
    // Remover o campo password do objeto retornado
    const userResponse = user.toObject()
    delete userResponse.password
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Primeiro usuário criado com sucesso',
        user: userResponse
      },
      { status: 201 }
    )
    
  } catch (error) {
    console.error('[API] Erro ao criar o primeiro usuário:', error)
    
    return NextResponse.json(
      { error: 'Ocorreu um erro ao criar o usuário' },
      { status: 500 }
    )
  }
} 