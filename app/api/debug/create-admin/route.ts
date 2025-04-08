import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/user';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    // Conexão com o banco de dados
    await dbConnect();
    
    // Verificar se o usuário já existe
    const existingAdmin = await User.findOne({ email: 'admin@2clicks.com.br' });
    
    if (existingAdmin) {
      return NextResponse.json({ 
        message: 'Usuário administrador já existe',
        userId: existingAdmin._id
      });
    }

    // Criar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Criar novo usuário administrador
    const newAdmin = new User({
      name: 'Administrador',
      email: 'admin@2clicks.com.br',
      hashedPassword,
      role: 'admin',
      permissions: ['admin', 'viewDashboard', 'answerTickets', 'manageUsers', 'manageQuestions', 'manageTags']
    });

    // Retornar os detalhes do usuário criado (sem a senha)
    return NextResponse.json(
      { 
        success: true, 
        message: 'Usuário admin criado com sucesso',
        user: {
          id: newAdmin._id,
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role,
          department: newAdmin.department,
          permissions: newAdmin.permissions
        }
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Erro ao criar usuário admin:', error);
    return NextResponse.json(
      { error: `Erro ao criar usuário admin: ${error}` },
      { status: 500 }
    );
  }
} 