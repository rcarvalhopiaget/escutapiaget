'use client'

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { QuestionForm } from '../../question-form'; // Importar o formulário
import { Question } from '@/app/types/question'; // Importar o tipo
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Interface para os dados formatados para o formulário
interface QuestionFormDataForEdit extends Partial<Omit<Question, '_id'> & { _id?: string }> {}

export default function EditarPerguntaPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string; // Pegar o ID da URL

    const [questionData, setQuestionData] = useState<QuestionFormDataForEdit | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return; // Não fazer nada se o ID não estiver disponível ainda

        async function fetchQuestionData() {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(`/api/questions/${id}`);
                if (!response.ok) {
                     const errorData = await response.json().catch(() => ({}));
                     throw new Error(errorData.message || `Erro ao buscar dados da pergunta: ${response.statusText}`);
                }
                const data: Question = await response.json();
                // Formatar os dados para o QuestionForm (garantir que _id é string)
                setQuestionData({ ...data, _id: String(data._id) });
            } catch (err) {
                console.error(err);
                setError(err instanceof Error ? err.message : "Erro desconhecido ao carregar pergunta.");
                toast.error("Erro ao carregar dados", { description: err instanceof Error ? err.message : undefined });
            } finally {
                setIsLoading(false);
            }
        }

        fetchQuestionData();
    }, [id]);

    // Callback para quando a atualização for bem-sucedida
    const handleSuccess = () => {
        toast.success("Pergunta atualizada com sucesso!");
        router.push('/admin/perguntas'); // Voltar para a lista
        // router.refresh(); // Revalidar dados da lista
    };

    // Callback para cancelar
    const handleCancel = () => {
        router.push('/admin/perguntas');
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400 mr-2" />
                Carregando dados da pergunta...
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-8 text-center text-red-500">
                <p>Erro ao carregar pergunta: {error}</p>
                <Button onClick={() => router.push('/admin/perguntas')} className="mt-4">
                    Voltar para a Lista
                </Button>
            </div>
        );
    }

    if (!questionData) {
         // Pode acontecer se o fetch falhar silenciosamente ou ID for inválido inicialmente
        return (
             <div className="container mx-auto py-8 text-center text-neutral-500">
                <p>Não foi possível carregar os dados da pergunta.</p>
                 <Button onClick={() => router.push('/admin/perguntas')} className="mt-4">
                    Voltar para a Lista
                </Button>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Editar Pergunta</h1>
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
                {/* Renderizar o formulário com dados iniciais */}
                <QuestionForm 
                    initialData={questionData} 
                    onSubmitSuccess={handleSuccess} 
                    onCancel={handleCancel} 
                />
            </div>
        </div>
    );
} 