import { AdminHeader } from '@/components/admin/admin-header';
import { DynamicQuestionManagerLoader } from './question-manager-loader';

// Componente da Página Principal (Server Component)
export default function AdminPerguntasPage() {
  return (
    <div className="container mx-auto py-8">
      <AdminHeader 
        title="Gerenciar Perguntas" 
        description="Administre as perguntas disponíveis no sistema"
      />

      <div className="mt-8">
        <DynamicQuestionManagerLoader />
      </div>
    </div>
  );
}

// Configuração para forçar o modo dinâmico
export const dynamic = 'force-dynamic'; 