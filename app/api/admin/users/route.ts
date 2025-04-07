import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/user'
import { verifyAdminRole } from '@/lib/auth-utils'
import bcrypt from 'bcrypt'

export async function GET(req: NextRequest) {
  try {
    // Verificar se o usuário é administrador (em produção)
    // Em modo de desenvolvimento, permitir acesso para diagnóstico
    if (process.env.NODE_ENV !== 'development') {
      const isAdmin = await verifyAdminRole()
      if (!isAdmin) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
      }
    }
    
    // Conectar ao banco de dados
    await dbConnect()
    
    // Buscar todos os usuários admin
    const admins = await User.find({ role: 'admin' }).select('-password')
    
    return NextResponse.json({ admins }, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('[API] Iniciando POST /api/admin/users')
  
  try {
    // Verificar se o usuário é administrador
    console.log('[API] Verificando autorização do usuário')
    const isAdmin = await verifyAdminRole()
    
    if (!isAdmin) {
      console.log('[API] Usuário não autorizado')
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 403 }
      )
    }
    
    // Obter dados do corpo da requisição
    const userData = await request.json()
    
    // Validar campos obrigatórios
    if (!userData.name || !userData.email || !userData.password || !userData.role || !userData.department) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      )
    }
    
    // Conectar ao banco de dados
    await dbConnect()
    
    // Verificar se já existe um usuário com o mesmo email
    const existingUser = await User.findOne({ email: userData.email })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Já existe um usuário com este email' },
        { status: 400 }
      )
    }
    
    // Criar um novo usuário
    console.log('[API] Criando novo usuário')
    const newUser = new User(userData)
    await newUser.save()
    
    // Remover o campo password do objeto retornado
    const userResponse = newUser.toObject()
    delete userResponse.password
    
    console.log(`[API] Novo usuário criado: ${newUser.email}`)
    
    // Retornar o usuário criado
    return NextResponse.json(
      { 
        success: true, 
        message: 'Usuário criado com sucesso',
        user: userResponse
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API] Erro ao criar usuário:', error)
    
    return NextResponse.json(
      { error: 'Ocorreu um erro ao criar o usuário' },
      { status: 500 }
    )
  }
} 