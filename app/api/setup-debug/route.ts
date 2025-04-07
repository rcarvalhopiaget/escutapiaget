import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/user'

export async function GET(req: NextRequest) {
  try {
    // Dados de teste - em vez de usar variáveis de ambiente
    const adminEmail = "admin@exemplo.com"
    const adminPassword = "senha123"
    
    console.log('[Setup Debug] Conectando ao banco de dados')
    await dbConnect()
    
    // Verifica se já existe um usuário administrador
    const existingAdmin = await User.findOne({ email: adminEmail })
    
    if (existingAdmin) {
      console.log('[Setup Debug] Administrador já existe:', adminEmail)
      return NextResponse.json(
        { 
          message: 'Usuário administrador já existe.', 
          userId: existingAdmin._id.toString()
        }, 
        { status: 200 }
      )
    }
    
    console.log('[Setup Debug] Criando usuário administrador')
    
    // Cria o usuário administrador inicial
    const adminUser = new User({
      name: 'Administrador',
      email: adminEmail,
      password: adminPassword, // Será criptografado pelo middleware do modelo
      role: 'admin',
      department: 'diretoria'
    })
    
    await adminUser.save()
    console.log('[Setup Debug] Usuário administrador criado com sucesso')
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Usuário administrador criado com sucesso.', 
        userId: adminUser._id.toString()
      }, 
      { status: 201 }
    )
    
  } catch (error) {
    console.error('[Setup Debug] Erro na configuração inicial:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Falha na configuração inicial. Verifique os logs do servidor.'
      }, 
      { status: 500 }
    )
  }
} 