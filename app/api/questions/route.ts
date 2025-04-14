import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Question, { IQuestion } from '@/lib/models/question'
import { URLSearchParams } from 'url'; // Importar URLSearchParams
import { QuestionType } from '@/app/types/question'; // Importar enum para validação

// GET - Listar perguntas filtradas por categoria e/ou tipo
export async function GET(request: Request) {
  try {
    // Extrair query parameters da URL
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type'); // Embora o modelo atual use apenas category

    console.log(`[API Questions] Iniciando busca - category: ${category}, type: ${type}`);

    // Se a categoria não for fornecida, retornar erro para evitar busca desnecessária
    if (!category) {
      console.log('[API Questions] Erro: Parâmetro category não fornecido');
      return NextResponse.json({ error: 'Parâmetro category é obrigatório' }, { status: 400 });
    }

    // Construir o filtro MongoDB
    const filter: any = {};
    if (category) {
      // Incluir perguntas da categoria específica E perguntas aplicáveis a 'all'
      filter.$or = [
          { category: category }, 
          { category: 'all' }
      ];
    }

    console.log(`[API Questions] Conectando ao MongoDB com filtro: ${JSON.stringify(filter)}`);
    
    try {
      // Conectar ao MongoDB
      await dbConnect();
      
      console.log('[API Questions] Conexão com MongoDB estabelecida, buscando perguntas...');

      // Buscar perguntas que correspondem ao filtro E ordenar por 'order'
      const questions = await Question.find(filter).sort({ order: 1 }).lean();
      
      console.log(`[API Questions] Perguntas encontradas: ${questions.length}`);

      // Retornar as perguntas encontradas
      return NextResponse.json(questions, { status: 200 });
    } catch (dbError) {
      console.error('[API Questions] Erro de conexão com o MongoDB:', dbError);
      return NextResponse.json({
        error: 'Erro ao conectar com o banco de dados',
        details: dbError instanceof Error ? dbError.message : 'Erro desconhecido de conexão',
        connectionError: true
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[API Questions] Erro ao buscar perguntas:', error);
    
    // Tratamento mais detalhado do erro
    let errorMessage = 'Erro interno do servidor ao buscar perguntas.';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = `${errorMessage} Detalhes: ${error.message}`;
      
      // Verificar se é um erro de conexão com o MongoDB
      if (error.message.includes('MONGODB_URI') || error.message.includes('connect')) {
        errorMessage = 'Erro de conexão com o banco de dados. Por favor, tente novamente mais tarde.';
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      timestamp: new Date().toISOString(),
      requestInfo: {
        url: request.url,
        method: request.method
      }
    }, { status: statusCode });
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