'use client'

import { useForm, Controller, SubmitHandler, ControllerRenderProps } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { TicketCategory, TicketType } from '@/app/types/ticket'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { createTicketWithAnswers } from '@/app/actions/dynamic-ticket'
import { Question, QuestionType } from '@/app/types/question'
import { FileUpload } from '@/components/ui/file-upload'
import { QuestionLoadingError } from './question-loading-error'

interface DynamicQuestionFormProps {
  ticketType: TicketType
  ticketCategory: TicketCategory
  onSuccess?: (protocol: string, deadlineText: string, deadlineFormatted: string) => void
}

type DynamicFormValues = {
  name: string
  email: string
  answers: Record<string, any>
}

const baseDynamicFormSchema = z.object({
  name: z.string().min(1, { message: 'Nome é obrigatório.' }).or(z.literal('')),
  email: z.string().email({ message: 'Email inválido.' }).or(z.literal('')),
  answers: z.record(z.any())
}).superRefine((data, ctx) => {
  console.log("Validando formulário com dados:", data);
});

// Adicionar um identificador único para a pergunta de identificação
const IDENTIFICATION_QUESTION_TEXT = "Voce deseja se identificar?";

export function DynamicQuestionForm({ 
  ticketType, 
  ticketCategory, 
  onSuccess 
}: DynamicQuestionFormProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [identificationQuestionId, setIdentificationQuestionId] = useState<string | null>(null);
  
  // Para acompanhar todas as respostas e perguntas a serem exibidas
  const [activeQuestionIds, setActiveQuestionIds] = useState<Set<string>>(new Set());

  const [loadError, setLoadError] = useState<string | null>(null)

  const form = useForm<DynamicFormValues>({
    resolver: zodResolver(baseDynamicFormSchema),
    defaultValues: {
      name: '',
      email: '',
      answers: {}
    },
    mode: 'onSubmit',
    criteriaMode: 'all',
    shouldUnregister: false
  })

  useEffect(() => {
    async function fetchQuestions() {
      setIsLoadingQuestions(true)
      setLoadError(null)
      console.log(`Buscando perguntas para tipo: ${ticketType}, categoria: ${ticketCategory}`)

      // Número máximo de tentativas
      const MAX_RETRIES = 3;
      let attempts = 0;
      let lastError = null;

      while (attempts < MAX_RETRIES) {
        try {
          attempts++;
          console.log(`Tentativa ${attempts} de ${MAX_RETRIES} para buscar perguntas...`);

          // Adicionar um timestamp para evitar cache
          const timestamp = new Date().getTime();
          const apiUrl = `/api/questions?category=${encodeURIComponent(ticketCategory)}&_t=${timestamp}`;
          
          console.log(`[DEBUG] Chamando API: ${apiUrl}`);
          
          // Chamar a API route
          const response = await fetch(apiUrl, {
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            let errorInfo;
            try {
              errorInfo = JSON.parse(errorText);
            } catch (e) {
              errorInfo = { error: errorText || 'Resposta não disponível' };
            }
            
            const errorMessage = `Erro ao buscar perguntas: ${response.status} - ${response.statusText}`;
            console.error(errorMessage, errorInfo);
            
            throw new Error(`${errorMessage}. Detalhes: ${JSON.stringify(errorInfo)}`);
          }
          
          const data: Question[] = await response.json();
          
          console.log(`[DEBUG] API retornou ${data.length} perguntas para categoria "${ticketCategory}":`, data);
          
          // Sucesso! Saímos do loop
          
          // Ordenar por 'order' (API já deve retornar ordenado, mas é bom garantir)
          data.sort((a, b) => a.order - b.order);

          setQuestions(data);

          // Encontrar o ID da pergunta de identificação
          const idQ = data.find(q => q.text === IDENTIFICATION_QUESTION_TEXT)?._id || null;
          setIdentificationQuestionId(idQ);
          console.log('[useEffect] identificationQuestionId encontrado:', idQ);
          if (ticketType === TicketType.DENUNCIA && !idQ) {
              console.warn(`Pergunta de identificação ("${IDENTIFICATION_QUESTION_TEXT}") não encontrada para a categoria "${ticketCategory}". Nome/Email serão mostrados por padrão.`);
          }

          // Inicializar perguntas ativas com todas as perguntas, exceto as que estão em um fluxo de pulo
          const initialActiveQuestions = new Set<string>();
          data.forEach(question => {
            // Adicionar a pergunta de identificação sempre
            if (question._id === idQ) {
              initialActiveQuestions.add(question._id);
              return;
            }
            
            // Verificar se a pergunta está no fluxo de pulo de outra pergunta
            const isPartOfSkipFlow = data.some(q => 
              q.options?.some(opt => 
                opt.nextQuestionId === question._id || 
                (opt.nextQuestionsIds && opt.nextQuestionsIds.includes(question._id))
              )
            );
            
            // Se não for parte de um fluxo de pulo, adicionar como pergunta ativa inicial
            if (!isPartOfSkipFlow) {
              initialActiveQuestions.add(question._id);
            }
          });
          
          setActiveQuestionIds(initialActiveQuestions);

          // Pré-registrar campos e setar defaults
          const defaultAnswers: Record<string, any> = {}
          data.forEach(q => {
              if (q._id === idQ && q.type === QuestionType.RADIO) {
                  // Encontrar a opção "NAO" e usar seu texto
                  const naoOption = q.options?.find(opt => opt.text === 'NAO');
                  defaultAnswers[q._id] = naoOption?.text || 'NAO';
              } else if (q.type === QuestionType.CHECKBOX) {
                  defaultAnswers[q._id] = []; // Array vazio para checkbox
              } else {
                  defaultAnswers[q._id] = '';
              }
          });
          form.reset({ 
              ...form.getValues(), 
              answers: defaultAnswers 
          }, { keepDefaultValues: true });

          // Sucesso, saímos da função
          break;
          
        } catch (error) {
          console.error(`Tentativa ${attempts} falhou:`, error);
          lastError = error;
          
          // Se não for a última tentativa, esperar antes de tentar novamente
          if (attempts < MAX_RETRIES) {
            const waitTime = Math.pow(2, attempts) * 1000; // Backoff exponencial: 2s, 4s, 8s...
            console.log(`Aguardando ${waitTime/1000}s antes da próxima tentativa...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      // Se chegamos aqui e ainda temos um lastError, significa que todas as tentativas falharam
      if (lastError) {
        console.error("Todas as tentativas de buscar perguntas falharam:", lastError);
        setLoadError(lastError instanceof Error 
          ? lastError.message 
          : "Não foi possível buscar as perguntas após várias tentativas."
        );
        toast.error("Erro ao carregar formulário", {
          description: lastError instanceof Error 
            ? lastError.message 
            : "Não foi possível buscar as perguntas após várias tentativas."
        });
      }
      
      setIsLoadingQuestions(false);
    }
    if (ticketCategory) {
        fetchQuestions()
    }
  }, [ticketType, ticketCategory, form])

  // Observar mudanças nas respostas para atualizar as perguntas ativas
  useEffect(() => {
    // Função auxiliar para processar o fluxo de perguntas baseado nas respostas
    const updateActiveQuestions = () => {
      const answersObj = form.getValues().answers;
      if (!answersObj) return;
      
      // Criar um novo conjunto de perguntas ativas
      const newActiveQuestions = new Set<string>();
      
      // Adicionar a pergunta de identificação sempre
      if (identificationQuestionId) {
        newActiveQuestions.add(identificationQuestionId);
      }
      
      // Processar as respostas para determinar quais perguntas devem ser mostradas
      questions.forEach(question => {
        // Se a pergunta já for a de identificação, pular (já foi adicionada)
        if (question._id === identificationQuestionId) return;
        
        // Adicionar perguntas que não dependem de respostas anteriores (perguntas raiz)
        const isPartOfSkipFlow = questions.some(q => 
          q.options?.some(opt => 
            opt.nextQuestionId === question._id || 
            (opt.nextQuestionsIds && opt.nextQuestionsIds.includes(question._id))
          )
        );
        
        if (!isPartOfSkipFlow) {
          newActiveQuestions.add(question._id);
        }
      });
      
      // Para cada resposta, verificar se ela aciona alguma(s) pergunta(s) subsequente(s)
      Object.entries(answersObj).forEach(([questionId, answer]) => {
        const question = questions.find(q => q._id === questionId);
        if (!question || !question.options) return;
        
        // Para perguntas do tipo RADIO e SELECT, que permitem selecionar uma opção
        if ((question.type === QuestionType.RADIO || question.type === QuestionType.SELECT) && answer) {
          // Encontrar a opção selecionada
          const selectedOption = question.options.find(opt => opt.text === answer);
          if (selectedOption) {
            // Se houver uma única próxima pergunta (campo legado)
            if (selectedOption.nextQuestionId) {
              newActiveQuestions.add(selectedOption.nextQuestionId);
            }
            
            // Se houver múltiplas próximas perguntas (novo campo)
            if (selectedOption.nextQuestionsIds && selectedOption.nextQuestionsIds.length > 0) {
              selectedOption.nextQuestionsIds.forEach(id => {
                newActiveQuestions.add(id);
              });
            }
          }
        }
      });
      
      // Verificar condições especiais para mostrar/esconder perguntas de identificação
      const identificationAnswer = identificationQuestionId ? answersObj[identificationQuestionId] : undefined;
      
      if (identificationAnswer === 'NAO') {
        // Filtrar perguntas de nome e email
        questions.forEach(q => {
          if (q.text.toLowerCase().includes('nome') || 
              q.text.toLowerCase().includes('completo') ||
              q.text.toLowerCase().includes('email') ||
              q.text.toLowerCase().includes('e-mail')) {
            newActiveQuestions.delete(q._id);
          }
        });
      }
      
      setActiveQuestionIds(newActiveQuestions);
    };
    
    // Executar a atualização quando o formulário mudar
    const subscription = form.watch((value, { name, type }) => {
      // Apenas processar quando mudar uma resposta
      if (name && name.startsWith('answers.')) {
        updateActiveQuestions();
      }
    });
    
    // Executa uma vez inicialmente
    updateActiveQuestions();
    
    // Limpar assinatura
    return () => subscription.unsubscribe();
  }, [form, questions, identificationQuestionId]);
  
  // --- Abordagem Alternativa para Watch ---
  // Observar o campo específico APENAS se o ID existir
  const watchedIdentificationAnswer = identificationQuestionId 
                                       ? form.watch(`answers.${identificationQuestionId}` as const)
                                       : undefined;

  // Calcular wantsToIdentify baseado no valor observado diretamente
  const wantsToIdentify = watchedIdentificationAnswer === 'SIM';

  // Calcular showNameEmailFields como antes
  const showNameEmailFields = 
      ticketType !== TicketType.DENUNCIA || 
      (ticketType === TicketType.DENUNCIA && wantsToIdentify);

  // --- Logs para Depuração (Mantidos) ---
  console.log('[Render] identificationQuestionId:', identificationQuestionId);
  // console.log('[Render] watchedAnswers (objeto completo - opcional):', JSON.stringify(form.watch('answers'))); // Pode descomentar se precisar
  console.log('[Render] watchedIdentificationAnswer (direto):', watchedIdentificationAnswer);
  console.log('[Render] wantsToIdentify calculado:', wantsToIdentify);
  console.log('[Render] showNameEmailFields calculado:', showNameEmailFields);
  console.log('[Render] activeQuestionIds:', Array.from(activeQuestionIds));

  const onSubmit: SubmitHandler<DynamicFormValues> = async (values) => {
    setIsSubmitting(true)
    console.log("Submetendo formulário dinâmico:", values);
    
    // Determinar a categoria correta a ser enviada
    const submissionCategory = ticketType === TicketType.DENUNCIA 
        ? TicketCategory.BULLYING // Usar BULLYING para denúncias
        : ticketCategory; // Usar a categoria original para outros tipos
        
    if (!submissionCategory) {
        toast.error("Erro interno: Categoria do chamado não definida.");
        setIsSubmitting(false);
        return;
    }

    try {
      const result = await createTicketWithAnswers({
        type: ticketType,
        category: submissionCategory, // Enviar a categoria correta
        name: values.name,
        email: values.email,
        answers: values.answers
      });

      console.log("Resultado da action:", result);

      if (result.success && result.data) {
        toast.success('Chamado enviado com sucesso!', {
          description: `Seu protocolo: ${result.data.protocol}`
        });
        if (onSuccess) {
          onSuccess(result.data.protocol, result.data.deadlineText, result.data.deadlineFormatted);
        }
      } else {
        // Usar a mensagem de erro da action, se disponível
        throw new Error(result.error || 'Erro desconhecido ao enviar chamado');
      }
    } catch (error) {
      console.error('Erro ao enviar chamado (formulário dinâmico):', error);
      toast.error('Erro ao enviar o chamado', {
        description: error instanceof Error ? error.message : 'Por favor, tente novamente mais tarde.'
      });
    } finally {
      setIsSubmitting(false)
    }
  };

  const renderAnswerField = (question: Question, field: ControllerRenderProps<DynamicFormValues, `answers.${string}`>) => {
    const { type, options = [] } = question;

    switch(type) {
        case QuestionType.TEXTAREA:
            return <Textarea placeholder="Sua resposta detalhada" {...field} />;
        
        case QuestionType.SELECT:
            return (
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma opção" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {options.map((option, index) => (
                    <SelectItem 
                      key={`${question._id}-option-${index}`}
                      value={option.text}
                    >
                      {option.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
            
        case QuestionType.MULTISELECT:
            return (
              <div className="flex flex-col space-y-2">
                <div className="p-2 border rounded-md bg-white">
                  <div className="mb-2 font-medium text-sm text-gray-600">Selecione uma ou mais opções:</div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {options.map((option, index) => (
                      <div key={`${question._id}-option-${index}`} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${field.name}-${option.text}`}
                          checked={Array.isArray(field.value) ? field.value.includes(option.text) : false}
                          onCheckedChange={(checked) => {
                            const currentValue = Array.isArray(field.value) ? [...field.value] : [];
                            if (checked) {
                              // Adicionar a opção se estiver marcada
                              field.onChange([...currentValue, option.text]);
                            } else {
                              // Remover a opção se estiver desmarcada
                              field.onChange(currentValue.filter(v => v !== option.text));
                            }
                          }}
                        />
                        <label 
                          htmlFor={`${field.name}-${option.text}`}
                          className="text-sm cursor-pointer"
                        >
                          {option.text}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                {Array.isArray(field.value) && field.value.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Selecionados: <span className="font-medium">{field.value.length}</span>
                  </div>
                )}
              </div>
            );

        case QuestionType.RADIO:
            return (
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-col space-y-1"
              >
                {options.map((option, index) => (
                  <FormItem 
                    key={`${question._id}-option-${index}`} 
                    className="flex items-center space-x-3 space-y-0"
                  >
                    <FormControl>
                      <RadioGroupItem value={option.text} id={`${field.name}-${option.text}`} />
                    </FormControl>
                    <FormLabel htmlFor={`${field.name}-${option.text}`} className="font-normal">
                      {option.text}
                    </FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            );

        case QuestionType.CHECKBOX:
            return (
              <div className="flex flex-col space-y-2">
                {options.map((option, index) => (
                  <div key={`${question._id}-option-${index}`} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${field.name}-${option.text}`}
                      checked={Array.isArray(field.value) ? field.value.includes(option.text) : false}
                      onCheckedChange={(checked) => {
                        const currentValue = Array.isArray(field.value) ? [...field.value] : [];
                        if (checked) {
                          // Adicionar a opção se estiver marcada
                          field.onChange([...currentValue, option.text]);
                        } else {
                          // Remover a opção se estiver desmarcada
                          field.onChange(currentValue.filter(v => v !== option.text));
                        }
                      }}
                    />
                    <FormLabel 
                      htmlFor={`${field.name}-${option.text}`}
                      className="font-normal"
                    >
                      {option.text}
                    </FormLabel>
                  </div>
                ))}
              </div>
            );
            
        case QuestionType.DATE:
            return (
              <Input
                type="date"
                className="w-full"
                {...field}
                onChange={(e) => {
                  // Formato ISO para data (YYYY-MM-DD)
                  field.onChange(e.target.value);
                }}
              />
            );
            
        case QuestionType.FILE:
            return (
              <FileUpload 
                multiple={true}
                helperText="Formatos aceitos: imagens, vídeos, PDFs, documentos do Office e arquivos compactados. Tamanho máximo: 10MB por arquivo."
                onFileSelect={(files) => {
                  // Armazenar apenas os metadados dos arquivos para envio posterior
                  const fileData = files.map(file => ({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified
                  }));
                  
                  // Aqui você poderia fazer o upload imediato ou armazenar os arquivos 
                  // para envio junto com o resto do formulário
                  field.onChange(fileData);
                }}
              />
            );

        case QuestionType.TEXT:
        default:
            return <Input placeholder="Sua resposta" {...field} />;
    }
  }

  // Obter a pergunta de identificação separadamente
  const identificationQuestion = identificationQuestionId 
    ? questions.find(q => q._id === identificationQuestionId)
    : questions.find(q => q.text === IDENTIFICATION_QUESTION_TEXT);
    
  // Obter todas as perguntas ativas, exceto a de identificação
  const activeQuestions = questions.filter(q => 
    activeQuestionIds.has(q._id) && 
    q._id !== identificationQuestionId
  ).sort((a, b) => a.order - b.order);

  // Se houver erro de carregamento, exibir o componente de erro
  if (loadError) {
    return (
      <QuestionLoadingError 
        message={loadError}
        onRetry={() => {
          if (ticketCategory) {
            fetchQuestions();
          }
        }}
      />
    );
  }

  // Se estiver carregando, mostrar o indicador de carregamento
  if (isLoadingQuestions) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        <p className="ml-2">Carregando formulário...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-orange-50 p-3 mb-4 rounded-md border border-orange-200 text-sm">
          <h3 className="font-medium text-orange-700">Modo de Desenvolvimento</h3>
          <p className="mb-2 text-xs text-orange-600">
            Validação desativada temporariamente para facilitar testes. Preencha os campos obrigatórios antes de enviar em produção.
          </p>
        </div>
      )}
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* PARTE 1: Apenas a pergunta de identificação */}
        {identificationQuestion && (
          <Controller
            key={identificationQuestion._id}
            control={form.control}
            name={`answers.${identificationQuestion._id}` as const} 
            rules={{ required: false }} // Desabilitado temporariamente
            render={({ field, fieldState: { error } }) => (
              <FormItem>
                <FormLabel>{identificationQuestion.text} {identificationQuestion.required && '*'}</FormLabel>
                <FormControl>
                  {renderAnswerField(identificationQuestion, field)}
                </FormControl>
                <FormMessage>{error?.message}</FormMessage>
              </FormItem>
            )}
          />
        )}

        {/* PARTE 2: Todas as perguntas ativas (controladas pelo fluxo) */}
        {activeQuestions.map((q) => (
          <Controller
            key={q._id}
            control={form.control}
            name={`answers.${q._id}` as const} 
            rules={{ required: false }} // Desabilitado temporariamente para testes
            render={({ field, fieldState: { error } }) => (
              <FormItem>
                <FormLabel>{q.text} {q.required && '*'}</FormLabel>
                <FormControl>
                  {renderAnswerField(q, field)}
                </FormControl>
                <FormMessage>{error?.message}</FormMessage>
              </FormItem>
            )}
          />
        ))}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting || isLoadingQuestions}
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enviar Chamado'}
        </Button>
        
        {/* Debug: Estado do formulário */}
        <div className="text-xs text-gray-500 mt-2">
          {process.env.NODE_ENV === 'development' && (
            <>
              <div>Carregando perguntas: {isLoadingQuestions ? 'Sim' : 'Não'}</div>
              <div>Enviando: {isSubmitting ? 'Sim' : 'Não'}</div>
              <div>Formulário válido: {form.formState.isValid ? 'Sim' : 'Não'}</div>
              {!form.formState.isValid && (
                <div>
                  Erros: {Object.keys(form.formState.errors).length > 0 
                    ? JSON.stringify(form.formState.errors, null, 2) 
                    : 'Nenhum erro específico identificado'}
                </div>
              )}
            </>
          )}
        </div>
      </form>
    </Form>
  )
} 