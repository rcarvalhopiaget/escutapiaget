// Tipos possíveis para as perguntas
export enum QuestionType {
  TEXT = 'text',        // Campo de texto curto
  TEXTAREA = 'textarea',  // Campo de texto longo
  SELECT = 'select',      // Lista suspensa
  MULTISELECT = 'multiselect', // Lista suspensa com seleção múltipla
  RADIO = 'radio',        // Botões de opção (seleção única)
  CHECKBOX = 'checkbox',  // Caixas de seleção (seleção múltipla ou única)
  DATE = 'date',          // Campo de seleção de data
  FILE = 'file'           // Campo para upload de arquivos
}

// Nova interface para representar uma opção com lógica de pulo para múltiplas perguntas
export interface QuestionOption {
  text: string;
  // Campo legado para compatibilidade - será removido no futuro
  nextQuestionId?: string | null; 
  // Novo campo para suportar múltiplas perguntas subsequentes
  nextQuestionsIds?: string[]; 
}

// Interface para representar uma pergunta
export interface Question {
  _id: string;       // ID da pergunta (do MongoDB)
  text: string;      // Texto da pergunta
  type: QuestionType;// Tipo do campo (text, textarea, select, etc.)
  category: string;  // Categoria (identificador do formulário/agrupamento)
  order: number;     // Ordem de exibição
  required: boolean; // Se o campo é obrigatório
  options?: QuestionOption[]; // <<< Alterado de string[] para QuestionOption[]
  createdAt?: Date;
  updatedAt?: Date;
}

// Poderíamos adicionar outras interfaces/tipos relacionados a perguntas aqui no futuro 