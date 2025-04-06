'use client'

import { useRouter } from 'next/navigation';
import { QuestionForm } from '../question-form';
import { toast } from 'sonner';

export default function NovaPerguntaPage() {
    const router = useRouter();

    // Callback para quando a criação for bem-sucedida
    const handleSuccess = () => {
        toast.success("Pergunta criada com sucesso!");
        router.push('/admin/perguntas');
    };

    // Callback para cancelar
    const handleCancel = () => {
        router.push('/admin/perguntas');
    };

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Criar Nova Pergunta</h1>
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-gray-100 p-4 border-b border-gray-200 mb-2">
                        <h2 className="text-xl font-semibold">Formulário de Pergunta</h2>
                        <p className="text-gray-600">Preencha todos os campos obrigatórios para criar uma nova pergunta</p>
                    </div>
                    <div className="p-4">
                        <QuestionForm
                            initialData={null}
                            onSubmitSuccess={handleSuccess}
                            onCancel={handleCancel}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
} 