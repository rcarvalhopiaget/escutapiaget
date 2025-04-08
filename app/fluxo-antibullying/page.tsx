'use client'

import { useState, useCallback, Suspense } from 'react'
import { Metadata } from 'next'
import { ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { DynamicQuestionForm } from '@/app/components/dynamic-question-form'
import { TicketType, TicketCategory } from '@/app/types/ticket'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

// Metadata ainda pode ser exportada de um client component, mas é menos comum.
// Alternativamente, definir no layout.tsx se for estático.
// export const metadata: Metadata = {
//   title: 'Formulário de Denúncia Anti-Bullying - 2Clicks',
//   description: 'Use este formulário para denunciar casos de bullying.',
// }

export default function AntiBullyingFormPage() {
  const router = useRouter()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [protocolInfo, setProtocolInfo] = useState<{
    protocol: string;
    deadlineText: string;
    deadlineFormatted: string;
  } | null>(null)

  const handleSuccess = useCallback((protocol: string, deadlineText: string, deadlineFormatted: string) => {
    setProtocolInfo({ protocol, deadlineText, deadlineFormatted })
    setIsSubmitted(true)
    // O toast já é chamado dentro do DynamicQuestionForm no onSubmit?
    // Se não, podemos chamar aqui:
    // toast.success('Denúncia enviada com sucesso!', { description: `Protocolo: ${protocol}` })
  }, [])

  if (isSubmitted && protocolInfo) {
    return (
      <div className="container max-w-3xl py-10">
        {/* Tela de Sucesso - Similar à de /chamados/formulario */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6 flex items-center justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Denúncia enviada com sucesso!</h1>
          <p className="text-neutral-600 mb-6">
            Sua denúncia foi registrada e será analisada confidencialmente pela nossa equipe.
          </p>
          
          <div className="bg-neutral-50 p-6 rounded-lg mb-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-neutral-500">Número do Protocolo</h2>
              <p className="text-xl font-mono">{protocolInfo.protocol}</p>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-500">Prazo de Análise</h2>
              <p>Até {protocolInfo.deadlineText} ({protocolInfo.deadlineFormatted})</p>
            </div>
          </div>
          
          <p className="text-sm text-neutral-600 mb-6">
            Guarde o número do protocolo para referência. Entraremos em contato se necessário.
          </p>
          
          <Button asChild>
            <Link href="/chamados">
              Voltar para Chamados
            </Link>
          </Button>
        </div>
        <Toaster position="top-right" richColors /> {/* Garante que Toaster está presente */}
      </div>
    )
  }

  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-6">
        {/* Manter o botão de voltar */}
        <Link href="/chamados" className="flex items-center text-sm font-medium text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Chamados
        </Link>
      </div>

      {/* Div principal do conteúdo da página */}
      <div className="bg-white rounded-lg shadow-md p-8">
        
        {/* Manter o título principal */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Programa Anti-Bullying</h1>
          <p className="text-neutral-600">
            Denuncie casos de bullying e comportamentos inadequados
          </p>
        </div>

        {/* Bloco de Texto Informativo (Restaurado e Corrigido) */}
        <div className="space-y-6 mb-8"> 
          <div className="bg-red-50 p-6 rounded-lg border border-red-100">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Denúncia de Bullying</h2>
            <p className="text-red-700 mb-4">
              Todas as denúncias de bullying são tratadas com prioridade e confidencialidade por nossa equipe. 
              Sua denúncia será analisada pela coordenação pedagógica e respondida em até 48 horas.
            </p>
            <p className="text-red-700">
              Para fazer uma denúncia, entre em contato diretamente com nossa coordenadora através do e-mail: 
              <a href="mailto:antibullying@2clicks.com.br" className="font-medium underline ml-1">
                antibullying@2clicks.com.br
              </a>
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">O que é Bullying?</h2>
            <p className="mb-4">
              Bullying é caracterizado por comportamentos agressivos intencionais e repetitivos, que 
              ocorrem sem motivação evidente, praticados por um indivíduo ou grupo contra uma ou mais 
              pessoas, causando dor e angústia.
            </p>
            <p>
              Pode incluir agressões físicas, verbais, psicológicas ou virtuais (cyberbullying).
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Como Identificar</h2>
            <ul className="list-disc list-inside space-y-2 text-neutral-700">
              <li>Agressões físicas como empurrões, socos e chutes</li>
              <li>Ameaças e intimidações</li>
              <li>Apelidos pejorativos e zombarias</li>
              <li>Isolamento social forçado</li>
              <li>Difamação e disseminação de boatos</li>
              <li>Mensagens ofensivas em redes sociais ou aplicativos</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Nosso Compromisso</h2>
            <p>
              A 2Clicks está comprometida em proporcionar um ambiente seguro e 
              acolhedor para todos os alunos. Trabalhamos ativamente na prevenção do bullying 
              através de programas educativos e da promoção do respeito mútuo e da empatia.
            </p>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <h2 className="text-xl font-semibold text-blue-800 mb-2">Precisa de Ajuda Imediata?</h2>
            <p className="text-blue-700">
              Para situações que exigem intervenção imediata, procure diretamente nossa coordenadora 
              pedagógica ou ligue para a secretaria da escola: <a href="tel:+551143678300" className="font-medium underline">(11) 4367-8300</a>.
            </p>
          </div>
        </div>

        {/* Div separada para o formulário */}
        <div className="border-t pt-8"> 
          <h2 className="text-xl font-semibold mb-4">Registrar Denúncia Online</h2>
          <p className="text-neutral-600 mb-6">Use o formulário abaixo para registrar sua denúncia de forma segura. Sua identidade pode ser mantida anônima se desejar.</p>
          {/* Renderizar o Formulário Dinâmico com Suspense */}
          <Suspense fallback={
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
              <p className="ml-2">Carregando formulário...</p>
            </div>
          }>
            <DynamicQuestionForm 
              ticketType={TicketType.DENUNCIA} 
              ticketCategory={"denuncia" as TicketCategory} // Passar a categoria específica
              onSuccess={handleSuccess} 
            />
          </Suspense>
        </div>

      </div>
      <Toaster position="top-right" richColors />
    </div>
  )
} 