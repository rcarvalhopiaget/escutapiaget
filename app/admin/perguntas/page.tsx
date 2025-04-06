import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { Question, QuestionType } from '@/app/types/question'; // Importar o tipo
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QuestionManager } from './question-manager';

// Função para buscar as perguntas (Server-side)
// Usaremos fetch diretamente, pois é um Server Component
// Adicionar cache: 'no-store' para sempre buscar dados frescos
async function fetchQuestions(): Promise<Question[]> {
    // TODO: Construir a URL base de forma mais robusta (variável de ambiente?)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; 
    const response = await fetch(`${baseUrl}/api/questions`, { cache: 'no-store' });
    if (!response.ok) {
        console.error("Erro ao buscar perguntas:", response.statusText);
        // Lançar erro ou retornar array vazio dependendo da estratégia de erro
        throw new Error('Falha ao carregar perguntas do servidor.'); 
    }
    const data = await response.json();
    // Garantir que o _id seja string (lean() já deve fazer isso)
    return data.map((q: any) => ({ ...q, _id: String(q._id) }));
}

// Componente que renderiza a lista (pode ser Server Component também)
async function QuestionsList() {
    let questions: Question[] = [];
    let fetchError: string | null = null;

    try {
        questions = await fetchQuestions();
    } catch (error) {
        fetchError = error instanceof Error ? error.message : "Erro desconhecido ao buscar perguntas.";
    }

    if (fetchError) {
        return <p className="text-red-500 text-center">{fetchError}</p>;
    }

    if (questions.length === 0) {
        return <p className="text-neutral-500 text-center">Nenhuma pergunta cadastrada ainda.</p>;
    }

    // Agrupar por categoria para melhor visualização
    const groupedQuestions = questions.reduce((acc, q) => {
        (acc[q.category] = acc[q.category] || []).push(q);
        return acc;
    }, {} as Record<string, Question[]>);

    return (
        <div className="space-y-6">
            {Object.entries(groupedQuestions).map(([category, categoryQuestions]) => (
                <Card key={category}>
                    <CardHeader>
                        <CardTitle className="capitalize">Categoria: {category}</CardTitle>
                        <CardDescription>Perguntas associadas a esta categoria/formulário.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {categoryQuestions.sort((a, b) => a.order - b.order).map((question) => (
                            <div key={question._id} className="flex items-center justify-between p-3 border rounded-md bg-neutral-50/50">
                                <div className="flex-1 mr-4">
                                    <p className="font-medium">{question.order}. {question.text}</p>
                                    <div className="text-sm text-neutral-600 mt-1 space-x-2">
                                        <Badge variant="secondary">{question.type}</Badge>
                                        {question.required && <Badge variant="outline">Obrigatória</Badge>}
                                        {question.options && question.options.length > 0 && 
                                            <span className="text-xs italic">Opções: {question.options.join(', ')}</span>
                                        }
                                    </div>
                                </div>
                                <div className="space-x-2">
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/admin/perguntas/editar/${question._id}`}>
                                            Editar
                                        </Link>
                                    </Button>
                                    <Button variant="destructive" size="sm" disabled>Excluir</Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

// Componente da Página Principal (Server Component)
export default function AdminPerguntasPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gerenciar Perguntas</h1>
                {/* Botão de adicionar removido daqui para evitar duplicação */}
            </div>

            <Suspense fallback={
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                    <p className="ml-2">Carregando perguntas...</p>
                </div>
            }>
                <QuestionManager />
            </Suspense>
        </div>
    );
} 