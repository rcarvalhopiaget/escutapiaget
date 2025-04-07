import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/user';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    await dbConnect();
    
    // Primeiro, verificamos se o usuário existe
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return NextResponse.json(
        { 
          exists: false,
          message: `Usuário com email ${email} não existe` 
        },
        { status: 200 }
      );
    }
    
    // Se não forneceu senha, apenas informamos que o usuário existe
    if (!password) {
      return NextResponse.json(
        { 
          exists: true,
          role: user.role,
          department: user.department,
          permissions: user.permissions,
          message: "Usuário existe, mas senha não foi verificada"
        },
        { status: 200 }
      );
    }
    
    // Se forneceu senha, verificamos se é válida
    const isPasswordValid = await user.comparePassword(password);
    
    return NextResponse.json(
      {
        exists: true,
        passwordValid: isPasswordValid,
        role: user.role,
        department: user.department,
        permissions: user.permissions,
        message: isPasswordValid 
          ? "Usuário existe e senha válida" 
          : "Usuário existe, mas senha inválida"
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
    return NextResponse.json(
      { error: `Erro ao verificar usuário: ${error}` },
      { status: 500 }
    );
  }
} 