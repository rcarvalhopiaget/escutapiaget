import { NextResponse } from 'next/server';
import dbConnect from "@/lib/mongodb";
import Question, { IQuestion } from "@/lib/models/question";
import { QuestionType } from '@/app/types/question';
import mongoose from 'mongoose';

// --- GET: Buscar uma pergunta específica pelo ID ---
export async function GET(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;

    // Validar se o ID é um ObjectId válido do MongoDB
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }

    try {
        await dbConnect();

        const question = await Question.findById(id).lean();

        if (!question) {
            return NextResponse.json({ message: "Pergunta não encontrada." }, { status: 404 });
        }

        return NextResponse.json(question, { status: 200 });

    } catch (error) {
        console.error("Erro ao buscar pergunta por ID:", error);
        return NextResponse.json(
            { message: "Erro interno do servidor ao buscar pergunta." },
            { status: 500 }
        );
    }
}

// --- PUT: Atualizar uma pergunta existente pelo ID ---
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ message: "ID inválido." }, { status: 400 });
    }

    try {
        await dbConnect();

        const body = await request.json();

        // --- Validação dos dados recebidos (similar ao POST) ---
        if (!body.text || !body.type || !body.category || body.order === undefined || body.required === undefined) {
             return NextResponse.json({ message: "Campos obrigatórios ausentes." }, { status: 400 });
        }
        if (!Object.values(QuestionType).includes(body.type)) {
             return NextResponse.json({ message: "Tipo de pergunta inválido." }, { status: 400 });
        }
        const requiresOptions = [QuestionType.SELECT, QuestionType.RADIO, QuestionType.CHECKBOX].includes(body.type);
        if (requiresOptions && (!body.options || body.options.length === 0)) {
             return NextResponse.json({ message: "Opções são obrigatórias para este tipo de pergunta." }, { status: 400 });
        }
         if (!requiresOptions && body.options && body.options.length > 0) {
             // Limpar opções se o tipo não as exige
             body.options = undefined;
        }
        // --- Fim da Validação ---

        // Construir objeto com dados atualizados
        const updateData: Partial<IQuestion> = {
            text: body.text,
            type: body.type,
            category: body.category,
            order: body.order,
            required: body.required,
            options: body.options,
        };

        // Encontrar e atualizar a pergunta
        // new: true retorna o documento atualizado
        // runValidators: true aplica as validações do schema Mongoose na atualização
        const updatedQuestion = await Question.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        );

        if (!updatedQuestion) {
            return NextResponse.json({ message: "Pergunta não encontrada para atualizar." }, { status: 404 });
        }

        return NextResponse.json(updatedQuestion, { status: 200 });

    } catch (error) {
        console.error("Erro ao atualizar pergunta:", error);
        if (error instanceof Error && error.name === 'ValidationError') {
            return NextResponse.json({ message: "Erro de validação", errors: (error as any).errors }, { status: 400 });
        }
        return NextResponse.json(
            { message: "Erro interno do servidor ao atualizar pergunta." },
            { status: 500 }
        );
    }
}

// TODO: Implementar DELETE
// export async function DELETE(request: Request, { params }: { params: { id: string } }) { ... } 