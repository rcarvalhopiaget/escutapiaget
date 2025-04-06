import { NextRequest, NextResponse } from 'next/server'
import { isValidObjectId } from 'mongoose'
import { verifyAdminRole } from '@/lib/auth-utils'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/user'
import bcrypt from 'bcrypt'

// Função para verificar autorização
async function checkAuthorization() {
  const isAdmin = await verifyAdminRole()
  
  if (!isAdmin) {
    return NextResponse.json(
      { error: 'Não autorizado' },
      { status: 403 }
    )
  }
  
  return null
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obter os parâmetros de forma assíncrona
    const resolvedParams = await params
    console.log(`[API] Iniciando DELETE /api/admin/users/${resolvedParams.id}`)
    
    // Verificar autorização
    const unauthorizedResponse = await checkAuthorization()
    if (unauthorizedResponse) return unauthorizedResponse
    
    const id = resolvedParams.id
    
    // Validar o ID
    if (!isValidObjectId(id)) {
      console.log(`[API] ID inválido: ${id}`)
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    
    // Conectar ao banco de dados
    await dbConnect()
    
    // Verificar se o usuário existe
    const user = await User.findById(id)
    if (!user) {
      console.log(`[API] Usuário não encontrado: ${id}`)
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    
    // Impedir a exclusão do próprio usuário que faz a solicitação
    // (Lógica a ser implementada quando tivermos a funcionalidade de obter o ID do usuário atual)
    
    // Excluir o usuário
    console.log(`[API] Excluindo usuário: ${id}`)
    await User.findByIdAndDelete(id)
    
    // Retornar sucesso
    return NextResponse.json(
      { success: true, message: 'Usuário excluído com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error(`[API] Erro ao excluir usuário:`, error)
    
    return NextResponse.json(
      { error: 'Ocorreu um erro ao excluir o usuário' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obter os parâmetros de forma assíncrona
    const resolvedParams = await params
    console.log(`[API] Iniciando GET /api/admin/users/${resolvedParams.id}`)
    
    // Verificar autorização
    const unauthorizedResponse = await checkAuthorization()
    if (unauthorizedResponse) return unauthorizedResponse
    
    const id = resolvedParams.id
    
    // Validar o ID
    if (!isValidObjectId(id)) {
      console.log(`[API] ID inválido: ${id}`)
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    
    // Conectar ao banco de dados
    await dbConnect()
    
    // Buscar o usuário, excluindo a senha
    const user = await User.findById(id).select('-password')
    
    if (!user) {
      console.log(`[API] Usuário não encontrado: ${id}`)
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    
    console.log(`[API] Usuário encontrado: ${id}`)
    
    // Retornar o usuário
    return NextResponse.json(
      { success: true, user },
      { status: 200 }
    )
  } catch (error) {
    console.error(`[API] Erro ao buscar usuário:`, error)
    
    return NextResponse.json(
      { error: 'Ocorreu um erro ao buscar o usuário' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obter os parâmetros de forma assíncrona
    const resolvedParams = await params
    console.log(`[API] Iniciando PUT /api/admin/users/${resolvedParams.id}`)
    
    // Verificar autorização
    const unauthorizedResponse = await checkAuthorization()
    if (unauthorizedResponse) return unauthorizedResponse
    
    const id = resolvedParams.id
    
    // Validar o ID
    if (!isValidObjectId(id)) {
      console.log(`[API] ID inválido: ${id}`)
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    
    // Obter dados do corpo da requisição
    const userData = await request.json()
    
    // Validar campos obrigatórios
    if (!userData.name || !userData.email || !userData.role || !userData.department) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      )
    }
    
    // Conectar ao banco de dados
    await dbConnect()
    
    // Verificar se o usuário existe
    const existingUser = await User.findById(id)
    
    if (!existingUser) {
      console.log(`[API] Usuário não encontrado: ${id}`)
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    
    // Verificar se o email está sendo alterado e se já existe outro usuário com esse email
    if (userData.email !== existingUser.email) {
      const duplicateEmail = await User.findOne({ 
        email: userData.email,
        _id: { $ne: id }
      })
      
      if (duplicateEmail) {
        return NextResponse.json(
          { error: 'Já existe outro usuário com este email' },
          { status: 400 }
        )
      }
    }
    
    // Preparar os dados de atualização
    const updateData: any = {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      department: userData.department,
      permissions: userData.permissions || existingUser.permissions,
      updatedAt: new Date()
    }
    
    // Se uma nova senha foi fornecida, criptografá-la
    if (userData.password) {
      const salt = await bcrypt.genSalt(10)
      updateData.password = await bcrypt.hash(userData.password, salt)
    }
    
    // Atualizar o usuário
    console.log(`[API] Atualizando usuário: ${id}`)
    
    // O { new: true } retorna o documento atualizado em vez do antigo
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select('-password')
    
    console.log(`[API] Usuário atualizado: ${id}`)
    
    // Retornar o usuário atualizado
    return NextResponse.json(
      { 
        success: true, 
        message: 'Usuário atualizado com sucesso',
        user: updatedUser 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error(`[API] Erro ao atualizar usuário:`, error)
    
    return NextResponse.json(
      { error: 'Ocorreu um erro ao atualizar o usuário' },
      { status: 500 }
    )
  }
} 