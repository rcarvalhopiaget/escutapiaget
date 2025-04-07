import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/user';

export async function POST(request: NextRequest) {
  try {
    // Conexão com o banco de dados
    await dbConnect();
    
    // Verificar se o usuário admin já existe
    const existingAdmin = await User.findOne({ email: 'admin@escolapiaget.com.br' });
    
    if (existingAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Usuário admin já existe',
          user: {
            id: existingAdmin._id,
            email: existingAdmin.email,
            role: existingAdmin.role,
            department: existingAdmin.department,
          }
        },
        { status: 200 }
      );
    }

    // Criar usuário administrador padrão
    const adminUser = await User.create({
      name: 'Administrador',
      email: 'admin@escolapiaget.com.br',
      password: 'admin123', // Esta senha será criptografada pelo middleware do modelo
      role: 'admin',
      department: 'ti',
      permissions: {
        viewTickets: true,
        respondTickets: true,
        editTickets: true,
        deleteTickets: true,
        manageUsers: true,
        viewDashboard: true,
        viewAllDepartments: true
      }
    });

    // Retornar os detalhes do usuário criado (sem a senha)
    return NextResponse.json(
      { 
        success: true, 
        message: 'Usuário admin criado com sucesso',
        user: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
          department: adminUser.department,
          permissions: adminUser.permissions
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