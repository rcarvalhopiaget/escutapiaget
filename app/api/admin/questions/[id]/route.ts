import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Question, { IQuestion } from '@/lib/models/question'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { isAdmin } from '@/lib/auth'
import mongoose from 'mongoose'

// Helper para verificar se o usuário é administrador
async function authorizeAdmin(request: Request): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)
  if (!isAdmin(session)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }
  return null
}

// Validador de ID do MongoDB
function isValidObjectId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id);
}

// PUT - Atualizar uma pergunta existente
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const unauthorizedResponse = await authorizeAdmin(request)
  if (unauthorizedResponse) return unauthorizedResponse

  // Obter os parâmetros de forma assíncrona
  const resolvedParams = await params
  const id = resolvedParams.id

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    await dbConnect()
    const body = await request.json() as Partial<Omit<IQuestion, '_id' | 'createdAt' | 'updatedAt'>>

    // Encontra e atualiza a pergunta
    // { new: true } retorna o documento atualizado
    // runValidators: true garante que as validações do schema sejam aplicadas na atualização
    const updatedQuestion = await Question.findByIdAndUpdate(
        id, 
        body, 
        { new: true, runValidators: true }
    )

    if (!updatedQuestion) {
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })
    }

    return NextResponse.json(updatedQuestion)
  } catch (error: any) {
    console.error('Erro ao atualizar pergunta:', error)
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno ao atualizar pergunta' }, { status: 500 })
  }
}

// DELETE - Excluir uma pergunta
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const unauthorizedResponse = await authorizeAdmin(request)
  if (unauthorizedResponse) return unauthorizedResponse

  // Obter os parâmetros de forma assíncrona
  const resolvedParams = await params
  const id = resolvedParams.id

  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    await dbConnect()

    const deletedQuestion = await Question.findByIdAndDelete(id)

    if (!deletedQuestion) {
      return NextResponse.json({ error: 'Pergunta não encontrada' }, { status: 404 })
    }

    // Retorna uma resposta vazia com status 204 (No Content)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Erro ao excluir pergunta:', error)
    return NextResponse.json({ error: 'Erro interno ao excluir pergunta' }, { status: 500 })
  }
} 