import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/user';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    // Conexão com o banco de dados
    await dbConnect();
    
    // Verificar se já existe um usuário com o mesmo email
    const existingAdmin = await User.findOne({ email: 'admin@piaget.com.br' });
    
    if (existingAdmin) {
      console.log('[DEBUG] Administrador já existe');
      return NextResponse.json(
        { success: true, message: 'Administrador já existe', id: existingAdmin._id }, 
        { status: 200 }
      );
    }

    // Criar nova conta de administrador
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const newAdmin = new User({
      name: 'Administrador',
      email: 'admin@piaget.com.br',
      password: hashedPassword,
      role: 'admin'
    });
    
    // Salvar o usuário no banco de dados
    await newAdmin.save();
    console.log('[DEBUG] Administrador criado com sucesso');

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
          department: newAdmin.department || 'N/A',
          permissions: newAdmin.permissions || []
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