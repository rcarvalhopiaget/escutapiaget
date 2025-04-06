import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Question, { IQuestion } from '@/lib/models/question'
import { URLSearchParams } from 'url'; // Importar URLSearchParams
import { QuestionType } from '@/app/types/question'; // Importar enum para validação

// GET - Listar perguntas filtradas por categoria e/ou tipo
export async function GET(request: Request) {
  // Extrair query parameters da URL
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const type = searchParams.get('type'); // Embora o modelo atual use apenas category

  // Construir o filtro MongoDB
  const filter: any = {};
  if (category) {
    // Incluir perguntas da categoria específica E perguntas aplicáveis a 'all'
    filter.$or = [
        { category: category }, 
        { category: 'all' }
    ];
  }
  // Poderíamos adicionar filtro por `type` aqui se o modelo Question tivesse esse campo.
  // Ex: if (type) filter.type = type;
  
  // Permitir busca sem filtro (retorna todas) se nenhum parâmetro for passado?
  // Se quisermos exigir pelo menos um filtro, podemos adicionar uma verificação aqui.
  // if (!category && !type) {
  //   return NextResponse.json({ error: 'Parâmetro de filtro (category ou type) obrigatório' }, { status: 400 });
  // }

  try {
    await dbConnect()
    // Buscar perguntas que correspondem ao filtro E ordenar por 'order'
    const questions = await Question.find(filter).sort({ order: 1 }).lean()
    return NextResponse.json(questions, { status: 200 })
  } catch (error) {
    console.error('Erro ao buscar perguntas públicas:', error)
    return NextResponse.json({ message: 'Erro interno do servidor ao buscar perguntas.' }, { status: 500 })
  }
}

// --- Função POST para criar uma nova pergunta ---
export async function POST(request: Request) {
  try {
    await dbConnect(); // Conectar ao banco

    // Pegar os dados do corpo da requisição
    const body = await request.json();

    // --- Validação básica dos dados recebidos --- 
    // (Validação mais robusta pode ser feita com Zod aqui ou antes de chamar a API)
    if (!body.text || !body.type || !body.category || body.order === undefined || body.required === undefined) {
      return NextResponse.json({ message: "Campos obrigatórios ausentes." }, { status: 400 });
    }
    if (!Object.values(QuestionType).includes(body.type)) {
        return NextResponse.json({ message: "Tipo de pergunta inválido." }, { status: 400 });
    }
    // Validação de opções (se o tipo exigir)
    if ([QuestionType.SELECT, QuestionType.RADIO, QuestionType.CHECKBOX].includes(body.type) && (!body.options || body.options.length === 0)) {
        return NextResponse.json({ message: "Opções são obrigatórias para este tipo de pergunta." }, { status: 400 });
    }
    if (![QuestionType.SELECT, QuestionType.RADIO, QuestionType.CHECKBOX].includes(body.type) && body.options && body.options.length > 0) {
         return NextResponse.json({ message: "Opções não são permitidas para este tipo de pergunta." }, { status: 400 });
    }
    // --- Fim da Validação ---

    // Criar nova instância do modelo Question
    const newQuestionData: Partial<IQuestion> = {
        text: body.text,
        type: body.type,
        category: body.category,
        order: body.order,
        required: body.required,
        // Incluir opções apenas se existirem e forem válidas para o tipo
        options: [QuestionType.SELECT, QuestionType.RADIO, QuestionType.CHECKBOX].includes(body.type) ? body.options : undefined,
    };

    const newQuestion = new Question(newQuestionData);
    
    // Salvar no banco de dados
    await newQuestion.save();

    // Retornar a pergunta criada com status 201 (Created)
    return NextResponse.json(newQuestion, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar pergunta:", error);
    // Verificar se é erro de validação do Mongoose
    if (error instanceof Error && error.name === 'ValidationError') {
        return NextResponse.json({ message: "Erro de validação", errors: (error as any).errors }, { status: 400 });
    }
    // Erro genérico
    return NextResponse.json(
      { message: "Erro interno do servidor ao criar pergunta." },
      { status: 500 }
    );
  }
}

// TODO: Implementar PUT, DELETE 