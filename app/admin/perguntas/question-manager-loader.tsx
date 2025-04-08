'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Importar QuestionManager como um componente dinâmico com ssr desativado
// Isso é permitido em um Client Component
const DynamicQuestionManager = dynamic(
  () => import('./question-manager').then(mod => mod.QuestionManager),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        <p className="ml-2">Carregando gerenciador de perguntas...</p>
      </div>
    )
  }
);

// Client Component que serve como wrapper para o componente dinâmico
export function DynamicQuestionManagerLoader() {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          <p className="ml-2">Inicializando gerenciador...</p>
        </div>
      }
    >
      <DynamicQuestionManager />
    </Suspense>
  );
} 