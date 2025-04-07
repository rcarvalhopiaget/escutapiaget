'use client'

import { useSearchParams } from 'next/navigation'
import { useCallback, useState, Suspense } from 'react'
import { TicketType, TicketCategory } from '@/app/types/ticket'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { StandardTicketForm } from '@/app/components/standard-ticket-form'
import { DynamicQuestionForm } from '@/app/components/dynamic-question-form'
import { PrivacyQuestionForm } from '@/app/components/privacy-question-form'

// Vamos tentar importar o formulário quando estiver disponível
// import { TicketForm } from '@/app/components/ticket-form'

// Componente wrapper para Suspense
function FormularioContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const tipoParam = searchParams.get('tipo') as TicketType | null
  const categoriaParam = searchParams.get('categoria') as TicketCategory | null

  const [isSubmitted, setIsSubmitted] = useState(false)
  const [protocolInfo, setProtocolInfo] = useState<{
    protocol: string;
    deadlineText: string;
    deadlineFormatted: string;
  } | null>(null)

  // Validar parâmetros e redirecionar se inválido
  const validateParams = useCallback(() => {
    if (!tipoParam || !Object.values(TicketType).includes(tipoParam)) {
      toast.error('Tipo de chamado inválido.')
      router.replace('/chamados')
      return false
    }
    // Categoria é opcional para alguns tipos, mas se fornecida, deve ser válida
    if (categoriaParam && !Object.values(TicketCategory).includes(categoriaParam)) {
       toast.error('Categoria de chamado inválida.')
       router.replace('/chamados')
       return false
    }
    return true
  }, [tipoParam, categoriaParam, router])

  useState(() => {
    if (!validateParams()) {
        // Já redirecionando dentro de validateParams
    }
  })

  const handleSuccess = useCallback((protocol: string, deadlineText: string, deadlineFormatted: string) => {
    setProtocolInfo({ protocol, deadlineText, deadlineFormatted })
    setIsSubmitted(true)
  }, [])

  // Lógica para decidir qual formulário renderizar
  const renderForm = () => {
    if (!tipoParam) {
        return <p className="text-red-500">Erro: Tipo de chamado não especificado.</p>;
    }

    // Mapear tipo para a categoria esperada (se aplicável)
    let targetCategory: TicketCategory | string | null = categoriaParam; // Usar da URL por padrão

    // Definir casos que USAM o formulário dinâmico
    const useDynamicForm = 
      tipoParam === TicketType.DENUNCIA || 
      (tipoParam === TicketType.DUVIDA && categoriaParam === TicketCategory.ATENDIMENTO);
      // Adicionar outros tipos/categorias dinâmicos aqui se necessário

    // Se for um tipo que SEMPRE usa uma categoria específica dinâmica (como Denúncia)
    if (tipoParam === TicketType.DENUNCIA) {
        // Sobrescrever/definir a categoria alvo, ignorando o que veio da URL
        targetCategory = "denuncia"; // <<< Usar a categoria "denuncia" 
    }
    
    // Se for um tipo dinâmico, mas a categoria alvo não foi definida (nem pela URL nem pela lógica acima)
    if (useDynamicForm && !targetCategory) {
        toast.error('Categoria não definida para este formulário dinâmico.');
        router.replace('/chamados');
        return <p className="text-red-500">Erro: Categoria necessária não encontrada.</p>;
    }

    // Se for solicitação de privacidade, renderizar o formulário específico
    if (tipoParam === TicketType.PRIVACIDADE) {
      return (
        <PrivacyQuestionForm 
          onSuccess={handleSuccess} 
        />
      )
    }

    // Renderizar o formulário dinâmico ou padrão
    if (useDynamicForm && targetCategory) {
      return (
        <DynamicQuestionForm 
          ticketType={tipoParam} 
          // Passar a categoria alvo determinada
          ticketCategory={targetCategory as TicketCategory} // Fazer cast se necessário, garantir tipo correto
          onSuccess={handleSuccess} 
        />
      )
    } else {
      // Renderizar o formulário padrão para os outros casos
      return (
        <StandardTicketForm 
          initialType={tipoParam} 
          initialCategory={categoriaParam ?? undefined} 
          onSuccess={handleSuccess} 
        />
      )
    }
  }

  if (isSubmitted && protocolInfo) {
    return (
      <div className="container max-w-3xl py-10">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6 flex items-center justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Chamado enviado com sucesso!</h1>
          <p className="text-neutral-600 mb-6">
            Seu chamado foi registrado em nosso sistema e será analisado pela nossa equipe.
          </p>
          
          <div className="bg-neutral-50 p-6 rounded-lg mb-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-neutral-500">Número do Protocolo</h2>
              <p className="text-xl font-mono">{protocolInfo.protocol}</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-500">Prazo de Resposta</h2>
              <p>Até {protocolInfo.deadlineText} ({protocolInfo.deadlineFormatted})</p>
            </div>
          </div>
          
          <p className="text-sm text-neutral-600 mb-6">
            Guarde o número do protocolo para acompanhar o status do seu chamado.
            Você receberá uma resposta por e-mail dentro do prazo informado.
          </p>
          
          <Button asChild>
            <Link href="/chamados">
              Voltar para Chamados
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Define o título com base no tipo E categoria (se relevante)
  const titulo = getTitulo(tipoParam, categoriaParam);

  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/chamados" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Chamados
          </Link>
        </Button>
      </div>

      {/* Bloco de texto informativo para Denúncia */}
      {tipoParam === TicketType.DENUNCIA && (
        <div className="mb-8 p-6 bg-amber-50 border border-amber-200 rounded-lg text-neutral-800">
          <h2 className="text-xl font-semibold mb-3 text-amber-800">Denúncia de Bullying</h2>
          <p className="mb-4 text-sm">Todas as denúncias de bullying são tratadas com prioridade e confidencialidade por nossa equipe. Sua denúncia será analisada pela coordenação pedagógica e respondida em até 48 horas.</p>
          <p className="mb-4 text-sm">Para fazer uma denúncia, entre em contato diretamente com nossa coordenadora através do e-mail: <a href="mailto:antibullying@escolapiaget.com.br" className="text-blue-600 hover:underline font-medium">antibullying@escolapiaget.com.br</a></p>

          <h3 className="text-lg font-semibold mt-6 mb-2 text-amber-700">O que é Bullying?</h3>
          <p className="mb-4 text-sm">Bullying é caracterizado por comportamentos agressivos intencionais e repetitivos, que ocorrem sem motivação evidente, praticados por um indivíduo ou grupo contra uma ou mais pessoas, causando dor e angústia.</p>
          <p className="mb-4 text-sm">Pode incluir agressões físicas, verbais, psicológicas ou virtuais (cyberbullying).</p>

          <h3 className="text-lg font-semibold mt-6 mb-2 text-amber-700">Como Identificar</h3>
          <ul className="list-disc list-inside mb-4 space-y-1 text-sm">
            <li>Agressões físicas como empurrões, socos e chutes</li>
            <li>Ameaças e intimidações</li>
            <li>Apelidos pejorativos e zombarias</li>
            <li>Isolamento social forçado</li>
            <li>Difamação e disseminação de boatos</li>
            <li>Mensagens ofensivas em redes sociais ou aplicativos</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-2 text-amber-700">Nosso Compromisso</h3>
          <p className="mb-4 text-sm">A 2Clicks está comprometida em proporcionar um ambiente seguro e acolhedor para todos os alunos. Trabalhamos ativamente na prevenção do bullying através de programas educativos e da promoção do respeito mútuo e da empatia.</p>

          <h3 className="text-lg font-semibold mt-6 mb-2 text-amber-700">Precisa de Ajuda Imediata?</h3>
          <p className="text-sm">Para situações que exigem intervenção imediata, procure diretamente nossa coordenadora pedagógica ou ligue para a secretaria da escola: <a href="tel:+551199999999" className="text-blue-600 hover:underline font-medium">(11) 9999-9999</a>.</p>
        </div>
      )}

      {/* Bloco de texto informativo para Privacidade */}
      {tipoParam === TicketType.PRIVACIDADE && (
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg text-neutral-800">
          <h2 className="text-xl font-semibold mb-3 text-blue-800">Proteção de Dados Pessoais</h2>
          <p className="mb-4 text-sm">A 2Clicks está comprometida com a proteção dos seus dados pessoais. De acordo com a Lei Geral de Proteção de Dados (LGPD), você possui diversos direitos relacionados aos seus dados.</p>
          
          <h3 className="text-lg font-semibold mt-6 mb-2 text-blue-700">Seus Direitos</h3>
          <ul className="list-disc list-inside mb-4 space-y-1 text-sm">
            <li><strong>Acesso aos dados:</strong> Você pode solicitar uma cópia dos seus dados que processamos</li>
            <li><strong>Correção:</strong> Pode solicitar a correção de dados incompletos ou imprecisos</li>
            <li><strong>Exclusão:</strong> Em determinadas circunstâncias, pode solicitar a exclusão dos seus dados</li>
            <li><strong>Revogação de consentimento:</strong> Pode retirar o consentimento para processamento de dados a qualquer momento</li>
            <li><strong>Portabilidade:</strong> Solicitar a transferência dos seus dados para outro controlador</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-2 text-blue-700">Como Processamos seu Pedido</h3>
          <p className="mb-4 text-sm">Após o recebimento da sua solicitação, nossa equipe de proteção de dados irá analisá-la e responder em até 10 dias. Para solicitações mais complexas, este prazo pode ser estendido, mas você será informado.</p>
          
          <p className="text-sm">Para dúvidas específicas sobre proteção de dados, entre em contato com nosso Encarregado de Dados (DPO) através do e-mail: <a href="mailto:colegiopiagetsbc@jpiaget.com.br" className="text-blue-600 hover:underline font-medium">colegiopiagetsbc@jpiaget.com.br</a></p>
        </div>
      )}

      {/* Div que contém o título e o formulário */}
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold mb-6">{titulo}</h1>
        {/* Renderiza o formulário correto */}
        {renderForm()}
      </div>
      
      <Toaster position="top-right" richColors />
    </div>
  )
}

// Componente Principal que usa Suspense
export default function FormularioPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        <p className="ml-2">Carregando formulário...</p>
      </div>
    }>
      <FormularioContent />
    </Suspense>
  );
}

// Função auxiliar para gerar o título
function getTitulo(type: TicketType | null, category: TicketCategory | null): string {
  if (!type) return 'Formulário de Chamado'

  switch (type) {
    case TicketType.RECLAMACAO:
      return 'Formulário de Reclamação'
    case TicketType.SUGESTAO:
      return 'Formulário de Sugestão'
    case TicketType.DENUNCIA:
        return 'Formulário de Denúncia' // Título específico
    case TicketType.DUVIDA:
      if (category === TicketCategory.ATENDIMENTO) {
        return 'Formulário de Dúvida - Atendimento'
      }
      return 'Formulário de Dúvida'
    case TicketType.PRIVACIDADE:
      return 'Solicitação de Direitos de Privacidade'
    default:
      return 'Formulário de Chamado'
  }
}