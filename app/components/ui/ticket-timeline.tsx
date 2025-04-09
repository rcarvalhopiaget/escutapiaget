'use client';

import { useMemo } from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { StatusHistoryItem } from '@/app/types/ticket';
import { cn } from '@/lib/utils';

// Props do componente TicketTimeline
interface TicketTimelineProps {
  currentStatus: string;
  statusHistory?: StatusHistoryItem[];
  createdAt: string | Date;
  resolvedAt?: string | Date;
  className?: string;
}

// Ordem dos status para visualização
const STATUS_ORDER = [
  'aberto',
  'em_analise',
  'encaminhado',
  'respondido',
  'resolvido'
];

// Mapeamento de status para labels e cores
const statusMap: Record<string, { label: string; color: string }> = {
  'aberto': { label: 'Aberto', color: 'text-blue-500 border-blue-500 bg-blue-50' },
  'em_analise': { label: 'Em Análise', color: 'text-amber-500 border-amber-500 bg-amber-50' },
  'encaminhado': { label: 'Encaminhado', color: 'text-purple-500 border-purple-500 bg-purple-50' },
  'respondido': { label: 'Respondido', color: 'text-emerald-500 border-emerald-500 bg-emerald-50' },
  'resolvido': { label: 'Resolvido', color: 'text-neutral-500 border-neutral-500 bg-neutral-50' }
};

export function TicketTimeline({
  currentStatus,
  statusHistory = [],
  createdAt,
  resolvedAt,
  className
}: TicketTimelineProps) {
  // Ordenar os status para exibição visual
  const timelineSteps = useMemo(() => {
    // Status completos (passados)
    const completedStatusIndex = STATUS_ORDER.indexOf(currentStatus);
    
    // Construir os passos baseado no histórico e ordem
    return STATUS_ORDER.map((status, index) => {
      // Verificar se este status já foi alcançado
      const isCompleted = index <= completedStatusIndex;
      
      // Encontrar item do histórico correspondente a este status
      const historyItem = statusHistory.find(item => item.to === status);
      
      // Para o status inicial "aberto", usar a data de criação
      const date = status === 'aberto' 
        ? createdAt 
        : historyItem?.date || '';
        
      // Para o status "resolvido", usar a data específica de resolução se disponível
      const dateToUse = status === 'resolvido' && resolvedAt ? resolvedAt : date;
      
      // Formatação da data, se disponível
      const formattedDate = dateToUse 
        ? new Date(dateToUse).toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit',
            year: 'numeric',
          }) 
        : '';
        
      const formattedTime = dateToUse
        ? new Date(dateToUse).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })
        : '';

      // Determinar se este é o status atual
      const isCurrent = status === currentStatus;
      
      return {
        status,
        label: statusMap[status]?.label || status,
        colorClass: statusMap[status]?.color || '',
        isCompleted,
        isCurrent,
        date: formattedDate,
        time: formattedTime,
        comments: historyItem?.comments || ''
      };
    });
  }, [currentStatus, statusHistory, createdAt, resolvedAt]);

  return (
    <div className={cn("relative", className)}>
      <h3 className="text-lg font-semibold mb-4">Progresso do Chamado</h3>
      
      <div className="space-y-0">
        {timelineSteps.map((step, index) => (
          <div key={step.status} className="relative">
            {/* Linha conectora (exceto no último item) */}
            {index < timelineSteps.length - 1 && (
              <div 
                className={cn(
                  "absolute top-7 left-[18px] h-full w-0.5",
                  step.isCompleted ? "bg-blue-400" : "bg-neutral-200"
                )}
                style={{ height: "calc(100% - 16px)" }}
              />
            )}
            
            <div className="flex items-start mb-6 relative">
              {/* Ícone do indicador de status */}
              <div className={cn(
                "flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full mr-4 border-2",
                step.isCompleted 
                  ? step.isCurrent 
                    ? step.colorClass // Status atual completo
                    : "text-blue-500 border-blue-500 bg-blue-50" // Status completo anterior
                  : "text-neutral-300 border-neutral-200 bg-neutral-50" // Status futuro
              )}>
                {step.isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              
              {/* Conteúdo */}
              <div className="flex-grow pt-1">
                <h4 className={cn(
                  "font-medium text-sm",
                  step.isCurrent 
                    ? "text-neutral-900" 
                    : step.isCompleted 
                      ? "text-neutral-700" 
                      : "text-neutral-400"
                )}>
                  {step.label}
                  
                  {step.isCurrent && (
                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      Atual
                    </span>
                  )}
                </h4>
                
                {step.date && (
                  <div className="flex items-center mt-1 text-xs text-neutral-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{step.date} às {step.time}</span>
                  </div>
                )}
                
                {step.comments && (
                  <p className="mt-1 text-xs text-neutral-500 italic">
                    {step.comments}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 