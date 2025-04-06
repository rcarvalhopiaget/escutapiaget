import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Question, { IQuestion } from '@/lib/models/question'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { isAdmin } from '@/lib/auth'

// Helper para verificar se o usuário é administrador
async function authorizeAdmin(request: Request): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  return null
}

// GET - Listar todas as perguntas
export async function GET(request: Request) {
  console.log('[API] Iniciando GET /api/admin/questions');
  
  try {
    console.log('[API] Verificando autorização do usuário');
    const unauthorizedResponse = await authorizeAdmin(request);
    
    if (unauthorizedResponse) {
      console.log('[API] Autorização negada: usuário não é administrador');
      return unauthorizedResponse;
    }
    
    console.log('[API] Autorização concedida, conectando ao MongoDB');
    await dbConnect();
    
    console.log('[API] Buscando perguntas no banco de dados');
    const questions = await Question.find({}).sort({ order: 1 });
    
    console.log(`[API] Encontradas ${questions.length} perguntas`);
    return NextResponse.json(questions, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error) {
    console.error('[API] Erro ao buscar perguntas:', error);
    return NextResponse.json({ 
      error: 'Erro interno ao buscar perguntas',
      details: error instanceof Error ? error.message : 'Erro desconhecido' 
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  }
}

// POST - Criar uma nova pergunta
export async function POST(request: Request) {
  const unauthorizedResponse = await authorizeAdmin(request)
  if (unauthorizedResponse) return unauthorizedResponse

  try {
    await dbConnect()
    const body = await request.json() as Omit<IQuestion, '_id' | 'createdAt' | 'updatedAt'>

    // Validação básica (Mongoose fará a validação mais detalhada)
    if (!body.text || !body.type || body.order === undefined) {
        return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    const newQuestion = new Question(body)
    await newQuestion.save()
    return NextResponse.json(newQuestion, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar pergunta:', error)
    // Retorna erros de validação do Mongoose
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno ao criar pergunta' }, { status: 500 })
  }
}

// PUT - Atualizar uma pergunta existente (requer ID na URL, lidaremos com isso depois)
// DELETE - Excluir uma pergunta (requer ID na URL, lidaremos com isso depois) 