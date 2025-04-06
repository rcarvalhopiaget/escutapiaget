import mongoose, { Schema, Document, models, Model } from 'mongoose'
import { QuestionType } from '@/app/types/question'

// Definir o Schema para as opções, permitindo o encadeamento
const questionOptionSchema = new Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  // Campo legado - mantido para compatibilidade
  nextQuestionId: {
    type: Schema.Types.ObjectId, // Referência a outra pergunta
    ref: 'Question',          // Nome do modelo referenciado
    required: false,         // Opcional
    default: null
  },
  // Novo campo para múltiplas perguntas subsequentes
  nextQuestionsIds: [{
    type: Schema.Types.ObjectId, // Array de referências a perguntas
    ref: 'Question',          // Nome do modelo referenciado
    required: false         // Opcional
  }]
}, { _id: false }); // Não criar _id para subdocumentos de opção por padrão

export interface IQuestion extends Document {
  text: string                 // O texto da pergunta (ex: "Qual o nome do aluno?")
  type: QuestionType           // O tipo de input (text, select, etc.)
  category: string             // Categoria de chamado associada ('all' para todas)
  options?: { 
    text: string; 
    nextQuestionId?: mongoose.Types.ObjectId | null;
    nextQuestionsIds?: mongoose.Types.ObjectId[]; 
  }[]; // Atualizado para incluir nextQuestionsIds
  required: boolean            // Se a resposta é obrigatória
  order: number                // Ordem de exibição no formulário
  createdAt: Date
  updatedAt: Date
}

// Garantir que temos todos os valores do enum atualizados para validação
const questionTypeValues = Object.values(QuestionType);
console.log("Tipos de pergunta disponíveis:", questionTypeValues);

const questionSchema: Schema = new Schema<IQuestion>(
  {
    text: {
      type: String,
      required: [true, 'O texto da pergunta é obrigatório'],
      trim: true,
      minlength: [5, 'O texto deve ter pelo menos 5 caracteres.']
    },
    type: {
      type: String,
      required: [true, 'O tipo da pergunta é obrigatório'],
      enum: {
        values: questionTypeValues,
        message: 'Tipo de pergunta inválido: {VALUE}'
      },
    },
    category: {
      type: String,
      required: [true, 'A categoria é obrigatória (use "all" para todas)'],
      trim: true,
      default: 'all',
      index: true
    },
    options: {
      type: [questionOptionSchema],
      default: undefined // Não terá valor padrão, será validado abaixo
    },
    required: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      required: [true, 'A ordem é obrigatória'],
      default: 0, // Começar com ordem 0
      min: [0, 'A ordem deve ser um número positivo.']
    },
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
  }
);

// Índice para ordenar por 'order' eficientemente
questionSchema.index({ order: 1 });
questionSchema.index({ category: 1, order: 1 });

// Validação condicional para 'options' (movida para fora da definição direta)
questionSchema.path('options').validate(function (value: any[] | undefined): boolean {
  const question = this as IQuestion; // Cast para acessar 'type'
  if (question.type === QuestionType.SELECT || question.type === QuestionType.RADIO) {
    return Array.isArray(value) && value.length >= 2;
  }
  return true; // Não obrigatório para outros tipos
}, 'Tipos SELECT e RADIO devem ter pelo menos 2 opções.');

// Middleware pré-save para remover options se não aplicável
questionSchema.pre('save', function (next) {
  if (this.type !== QuestionType.SELECT && 
      this.type !== QuestionType.RADIO && 
      this.type !== QuestionType.CHECKBOX) {
    this.options = undefined;
  }
  next();
});

// Remover o modelo existente se estiver em modo de desenvolvimento
if (process.env.NODE_ENV === 'development' && models.Question) {
  mongoose.deleteModel('Question');
}

// Criar o modelo
const Question: Model<IQuestion> = models.Question || mongoose.model<IQuestion>('Question', questionSchema);

export default Question; 