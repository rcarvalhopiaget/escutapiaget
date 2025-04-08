import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/user'

export async function GET(req: NextRequest) {
  // Esta rota só deve funcionar em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Rota disponível apenas em ambiente de desenvolvimento' },
      { status: 403 }
    )
  }
  
  try {
    // Simular autenticação
    const email = 'admin@2clicks.com.br'
    const password = 'admin123'
    
    console.log(`[Login Test] Tentando fazer login com ${email}`)
    
    // Conectar ao banco de dados
    await dbConnect()
    
    // Buscar o usuário
    const user = await User.findOne({ email }).select('+password')
    
    if (!user) {
      console.log('[Login Test] Usuário não encontrado')
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    
    // Verificar a senha
    const isPasswordValid = await user.comparePassword(password)
    
    if (!isPasswordValid) {
      console.log('[Login Test] Senha inválida')
      return NextResponse.json(
        { error: 'Senha inválida' },
        { status: 401 }
      )
    }
    
    console.log('[Login Test] Login bem-sucedido')
    
    // Retornar informações do usuário (sem a senha)
    const userInfo = user.toObject()
    delete userInfo.password
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Login bem-sucedido',
        user: userInfo
      },
      { status: 200 }
    )
    
  } catch (error) {
    console.error('[Login Test] Erro:', error)
    return NextResponse.json(
      { error: 'Erro ao tentar fazer login' },
      { status: 500 }
    )
  }
} 