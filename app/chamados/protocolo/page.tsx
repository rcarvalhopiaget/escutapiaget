'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { Ticket, TicketStatus, TicketType } from '@/app/types/ticket'

// Mapeamento dos status para texto em português
const statusText: Record<TicketStatus, string> = {
  [TicketStatus.ABERTO]: 'Aberto',
  [TicketStatus.EM_ANALISE]: 'Em Análise',
  [TicketStatus.RESPONDIDO]: 'Respondido',
  [TicketStatus.ENCAMINHADO]: 'Encaminhado',
  [TicketStatus.RESOLVIDO]: 'Resolvido'
}

// Mapeamento dos tipos para texto em português
const typeText: Record<TicketType, string> = {
  [TicketType.RECLAMACAO]: 'Reclamação',
  [TicketType.DENUNCIA]: 'Denúncia',
  [TicketType.SUGESTAO]: 'Sugestão',
  [TicketType.DUVIDA]: 'Dúvida'
}

// Componente interno que usa useSearchParams
function ProtocoloPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [isLoading, setIsLoading] = useState(true)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const protocol = searchParams.get('protocolo')
  
  useEffect(() => {
    if (!protocol) {
      setError('Protocolo não informado')
      setIsLoading(false)
      return
    }
    
    async function fetchTicket() {
      try {
        const response = await fetch(`/api/ticket/protocol?protocol=${protocol}`)
        const result = await response.json()
        
        if (!response.ok) {
          setError(result.error || 'Erro ao buscar protocolo')
          toast.error('Erro ao buscar protocolo', {
            description: result.error || 'Protocolo não encontrado'
          })
          return
        }
        
        if (result.success && result.ticket) {
          setTicket(result.ticket)
        } else {
          setError('Protocolo não encontrado')
        }
      } catch (error) {
        console.error('Erro ao buscar protocolo:', error)
        setError('Erro de conexão ao servidor')
        toast.error('Erro de conexão', {
          description: 'Não foi possível conectar ao servidor'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTicket()
  }, [protocol])
  
  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-10 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-lg">Carregando informações do protocolo...</p>
        </div>
      </div>
    )
  }
  
  if (error || !ticket) {
    return (
      <div className="container max-w-4xl mx-auto py-10 px-4 sm:px-6">
        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="text-2xl text-red-700">Protocolo não encontrado</CardTitle>
            <CardDescription className="text-red-600">
              {error || 'Não foi possível encontrar o protocolo informado'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="mb-4">
              Verifique se o número do protocolo foi digitado corretamente e tente novamente.
            </p>
            <p className="text-sm text-neutral-600">
              Protocolo consultado: <span className="font-mono">{protocol}</span>
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para a página inicial
              </Link>
            </Button>
            <Button asChild>
              <Link href="/chamados">
                Ir para Sistema de Chamados
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  // Formatar data de criação
  const createdDate = new Date(ticket.createdAt)
  const formattedDate = createdDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  
  return (
    <div className="container max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <Card className="overflow-hidden border-t-4 shadow-md"
        style={{
          borderTopColor: ticket.type === TicketType.DENUNCIA 
            ? '#ef4444' 
            : ticket.type === TicketType.RECLAMACAO 
              ? '#f97316' 
              : ticket.type === TicketType.SUGESTAO 
                ? '#22c55e' 
                : '#3b82f6'
        }}>
        <CardHeader className="bg-gray-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                <span>Protocolo</span>
                <span className="font-mono text-base md:text-lg bg-gray-100 px-2 py-1 rounded">
                  {ticket.protocol}
                </span>
              </CardTitle>
              <CardDescription className="mt-2">
                Acompanhe o status do seu chamado
              </CardDescription>
            </div>
            
            <div className={`px-4 py-2 rounded-full text-sm font-medium self-start md:self-center
              ${ticket.status === TicketStatus.ABERTO ? 'bg-blue-100 text-blue-700' : ''}
              ${ticket.status === TicketStatus.EM_ANALISE ? 'bg-yellow-100 text-yellow-700' : ''}
              ${ticket.status === TicketStatus.RESPONDIDO ? 'bg-green-100 text-green-700' : ''}
              ${ticket.status === TicketStatus.ENCAMINHADO ? 'bg-purple-100 text-purple-700' : ''}
              ${ticket.status === TicketStatus.RESOLVIDO ? 'bg-slate-100 text-slate-700' : ''}
            `}>
              {statusText[ticket.status]}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded">
              <h3 className="text-sm font-semibold text-gray-500">Tipo</h3>
              <p className="font-medium">{typeText[ticket.type]}</p>
            </div>
            
            <div className="p-3 bg-gray-50 rounded">
              <h3 className="text-sm font-semibold text-gray-500">Data de Criação</h3>
              <p className="font-medium">{formattedDate}</p>
            </div>
            
            {ticket.name && (
              <div className="p-3 bg-gray-50 rounded">
                <h3 className="text-sm font-semibold text-gray-500">Nome</h3>
                <p className="font-medium">{ticket.name}</p>
              </div>
            )}
            
            {ticket.email && (
              <div className="p-3 bg-gray-50 rounded">
                <h3 className="text-sm font-semibold text-gray-500">Email</h3>
                <p className="font-medium">{ticket.email}</p>
              </div>
            )}
          </div>
          
          {ticket.message && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-base font-semibold text-gray-700 mb-3">Detalhes do Chamado</h3>
              
              {/* Verificar se a mensagem parece ser um formulário com respostas */}
              {ticket.message.startsWith('Respostas do formulário:') ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 italic mb-2">Informações preenchidas no formulário:</p>
                  
                  {/* Extrair e formatar as respostas do formulário */}
                  {(() => {
                    // Extrair as respostas após o cabeçalho
                    const conteudo = ticket.message.replace('Respostas do formulário:', '').trim();
                    
                    // Definir as perguntas do formulário em ordem
                    const perguntas = [
                      "Deseja se identificar?",
                      "Nome da pessoa envolvida",
                      "Série/turma da pessoa",
                      "Local da ocorrência",
                      "Data da ocorrência",
                      "Testemunhas",
                      "Já comunicou a situação a alguém?",
                      "Ocorreu mais de uma vez?",
                      "Descrição da situação",
                      "Houve consequências?"
                    ];
                    
                    // Dividir as respostas - considerando o padrão usado (podem ter vários "Resposta: ")
                    const respostas = conteudo.split('Resposta:')
                      .filter(item => item.trim() !== '') // Remover itens vazios
                      .map(item => item.trim());  // Remover espaços extras
                    
                    // Renderizar cada par pergunta/resposta
                    return perguntas.map((pergunta, index) => {
                      // Usar a resposta correspondente se existir
                      const resposta = index < respostas.length ? respostas[index] : '';
                      const valorLimpo = resposta.replace(/Resposta:\s*/g, '').trim();
                      const isValid = valorLimpo !== '';
                      
                      // Formatar data se parecer ser uma data
                      let valorFormatado = valorLimpo;
                      if (valorLimpo.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        const data = new Date(valorLimpo);
                        valorFormatado = data.toLocaleDateString('pt-BR');
                      }
                      
                      return (
                        <div key={index} className={`p-3 rounded border ${isValid ? 'bg-white' : 'bg-gray-50 border-gray-100'}`}>
                          <p className="font-medium text-gray-700">{pergunta}</p>
                          <p className={`mt-1 ${!isValid ? 'text-gray-400 italic' : ''}`}>
                            {isValid ? valorFormatado : 'Não informado'}
                          </p>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <p className="whitespace-pre-wrap p-4 bg-white border rounded">{ticket.message}</p>
              )}
            </div>
          )}
          
          {ticket.response && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-base font-semibold text-green-700 mb-3">Resposta da Instituição</h3>
              <div className="bg-green-50 border border-green-100 p-4 rounded-md">
                <p className="whitespace-pre-wrap text-gray-700">{ticket.response}</p>
                <p className="mt-3 text-sm text-gray-500 italic">
                  Respondido em: {new Date(ticket.updatedAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between bg-gray-50 mt-4 border-t">
          <Button variant="outline" asChild>
            <Link href="/chamados">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </CardFooter>
      </Card>
      
      <Toaster position="top-right" richColors />
    </div>
  )
}

// Componente principal que envolve o conteúdo em um Suspense
export default function ProtocoloPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-4xl mx-auto py-10 px-4 sm:px-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-lg">Carregando página...</p>
        </div>
      </div>
    }>
      <ProtocoloPageContent />
    </Suspense>
  )
} 