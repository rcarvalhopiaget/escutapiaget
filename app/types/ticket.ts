export enum TicketType {
  RECLAMACAO = 'reclamacao',
  DENUNCIA = 'denuncia',
  SUGESTAO = 'sugestao',
  DUVIDA = 'duvida',
  PRIVACIDADE = 'privacidade'
}

export enum TicketCategory {
  ATENDIMENTO = 'atendimento',
  ENSINO = 'ensino',
  INFRAESTRUTURA = 'infraestrutura',
  BULLYING = 'bullying',
  FINANCEIRO = 'financeiro',
  PRIVACIDADE_DADOS = 'privacidade_dados',
  ACESSO_DADOS = 'acesso_dados',
  CORRECAO_DADOS = 'correcao_dados',
  EXCLUSAO_DADOS = 'exclusao_dados',
  REVOGACAO_CONSENTIMENTO = 'revogacao_consentimento',
  OUTROS = 'outros'
}

export enum TicketStatus {
  ABERTO = 'aberto',
  EM_ANALISE = 'em_analise',
  RESPONDIDO = 'respondido',
  ENCAMINHADO = 'encaminhado',
  RESOLVIDO = 'resolvido'
}

export interface StatusHistoryItem {
  from: string;
  to: string;
  date: Date | string;
  comments?: string;
}

export interface Ticket {
  id: string;
  protocol: string;
  type: TicketType | string;
  category?: string;
  status: TicketStatus | string;
  name?: string;
  email?: string;
  message?: string;
  response?: string;
  responseDate?: Date | string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  studentName?: string;
  studentGrade?: string;
  isStudent?: boolean;
  internalComments?: string;
  statusHistory?: StatusHistoryItem[];
}

export interface TicketFormData {
  type: TicketType;
  category?: string;
  name?: string;
  email?: string;
  studentName?: string;
  studentGrade?: string;
  isStudent?: boolean;
  message: string;
} 