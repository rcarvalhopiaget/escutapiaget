'use client'

import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray, FieldValues, ControllerRenderProps, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Question, QuestionType, QuestionOption } from '@/app/types/question'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from 'sonner'
import { Trash2, PlusCircle, Loader2, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'

// --- Schema de Validação Simplificado ---
const questionOptionSchema = z.object({
  text: z.string().min(1, { message: 'Texto da opção é obrigatório' }),
  nextQuestionId: z.string().nullable().optional(),
  nextQuestionsIds: z.array(z.string()).optional()
});

const questionFormSchema = z.object({
  _id: z.string().optional(),
  text: z.string().min(5, { message: 'Mínimo 5 caracteres' }),
  type: z.nativeEnum(QuestionType),
  category: z.string().min(1, { message: 'Categoria obrigatória' }),
  order: z.coerce.number().int().min(0, { message: 'Deve ser um número positivo' }),
  required: z.boolean().default(false),
  options: z.array(questionOptionSchema).default([])
}).superRefine((data, ctx) => {
  // Validação para tipos que exigem opções
  if ((data.type === QuestionType.RADIO || data.type === QuestionType.SELECT || data.type === QuestionType.MULTISELECT) && 
      (!data.options || data.options.length < 2)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `${data.type === QuestionType.RADIO ? 'Perguntas de múltipla escolha' : data.type === QuestionType.MULTISELECT ? 'Perguntas de seleção múltipla' : 'Perguntas de seleção'} exigem pelo menos 2 opções`,
      path: ['options']
    });
  }
});

type QuestionFormData = z.infer<typeof questionFormSchema>;

// Componente QuestionForm simplificado
interface QuestionFormProps {
  initialData?: Question | null
  onSubmitSuccess: () => void
  onCancel?: () => void
}

export function QuestionForm({ 
  initialData,
  onSubmitSuccess,
  onCancel
}: QuestionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otherQuestions, setOtherQuestions] = useState<Question[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  
  const isEditing = !!initialData?._id;
  
  // Inicialização do formulário com react-hook-form + zod
  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      _id: initialData?._id,
      text: initialData?.text || '',
      type: initialData?.type || QuestionType.TEXT,
      category: initialData?.category || '',
      order: initialData?.order || 0,
      required: initialData?.required || false,
      options: initialData?.options || []
    },
    mode: 'onChange' // Validação em tempo real
  });
  
  // Sincronizar o formulário quando initialData mudar (importante para edição)
  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      form.reset({
        _id: initialData._id,
        text: initialData.text || '',
        type: initialData.type || QuestionType.TEXT,
        category: initialData.category || '',
        order: initialData.order || 0,
        required: initialData.required || false,
        options: initialData.options || []
      });
    }
  }, [initialData, form]);
  
  // Buscar outras perguntas para uso nos dropdown de "próxima pergunta"
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        // Usando URL relativa ao invés de absoluta
        const response = await fetch('/api/admin/questions', {
          // Adicionar cabeçalhos para evitar problemas de cache
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const questions: Question[] = await response.json();
        // Filtrar a pergunta atual da lista, se for o caso de edição
        const filtered = isEditing 
          ? questions.filter(q => q._id !== initialData?._id)
          : questions;
        setOtherQuestions(filtered);
      } catch (error) {
        console.error('Erro ao buscar perguntas:', error);
        toast.error('Erro ao carregar perguntas para o dropdown', {
          description: error instanceof Error ? error.message : 'Falha na conexão com o servidor'
        });
      }
    };
    
    fetchQuestions();
  }, [initialData?._id, isEditing]);
  
  // Setup para gerenciar o array de opções
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options"
  });
  
  // Observar o tipo para mostrar/esconder campos de opções
  const questionType = form.watch('type');
  const needsOptions = questionType === QuestionType.RADIO || questionType === QuestionType.SELECT || questionType === QuestionType.MULTISELECT;
  
  // Adicionar opções iniciais se o tipo mudar para um tipo que precisa de opções
  useEffect(() => {
    if (needsOptions && fields.length === 0) {
      // Adicionar duas opções vazias por padrão
      append({ text: '', nextQuestionId: null });
      append({ text: '', nextQuestionId: null });
    }
  }, [needsOptions, fields.length, append]);
  
  // Enviar o formulário
  const onSubmit = async (data: QuestionFormData) => {
    console.log("== INICIANDO ENVIO DO FORMULÁRIO ==");
    console.log("onSubmit foi chamado com dados:", data);
    console.log("Texto da pergunta:", data.text);
    console.log("Valor mais recente do texto:", form.getValues().text);
    
    // Certificar-se que estamos usando o valor mais recente do texto
    const formValues = form.getValues();
    data.text = formValues.text;
    
    try {
      setFormError(null);
      setIsSubmitting(true);
      
      // Log para debug
      console.log("Tipo da questão:", data.type);
      console.log("Opções da questão:", data.options);
      console.log("needsOptions:", needsOptions);
      
      // Validação adicional para tipos que exigem opções
      if ((data.type === QuestionType.RADIO || data.type === QuestionType.SELECT || data.type === QuestionType.MULTISELECT) && 
          (!data.options || data.options.length < 2)) {
        toast.error('Tipos que exigem opções precisam de pelo menos 2 opções');
        setIsSubmitting(false);
        return;
      }
      
      // Remover opções se não forem necessárias
      if (!needsOptions) {
        data.options = [];
      }
      
      // Determinar URL e método com base se é edição ou criação
      const url = isEditing
        ? `/api/admin/questions/${data._id}`
        : '/api/admin/questions';
        
      const method = isEditing ? 'PUT' : 'POST';
      
      console.log("Enviando requisição para:", url, "com método:", method);
      console.log("Dados finais enviados:", JSON.stringify(data));
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache' 
        },
        body: JSON.stringify(data)
      });
      
      console.log("Resposta recebida:", response.status, response.statusText);
      
      if (!response.ok) {
        // Tentar extrair mensagem de erro da resposta
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }
      
      console.log("Sucesso! Pergunta salva.");
      toast.success(isEditing ? 'Pergunta atualizada com sucesso!' : 'Pergunta criada com sucesso!');
      onSubmitSuccess();
      
    } catch (error) {
      console.error('Erro ao salvar pergunta:', error);
      setFormError(error instanceof Error ? error.message : 'Erro ao salvar pergunta');
      toast.error('Falha ao salvar pergunta', { 
        description: error instanceof Error ? error.message : 'Erro de conexão com o servidor'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Para debug - log quando o formulário muda
  useEffect(() => {
    const subscription = form.watch((value) => {
      console.log("Formulário mudou:", value);
      console.log("Estado do formulário:", {
        isDirty: form.formState.isDirty,
        isValid: form.formState.isValid,
        errors: form.formState.errors
      });
    });
    return () => subscription.unsubscribe();
  }, [form, form.watch]);

  // Função de submit com debug
  const handleFormSubmit = (e: React.FormEvent) => {
    console.log("Form submit event triggered");
    const currentValues = form.getValues();
    console.log("Valores atuais do formulário:", currentValues);
    
    // Verificar validação manual
    const validationResult = questionFormSchema.safeParse(currentValues);
    console.log("Resultado de validação:", validationResult);
    
    // Continuar com submit normal
    form.handleSubmit(onSubmit)(e);
  };
  
  // Para teste e desenvolvimento - preencher o formulário com dados de exemplo
  const handleAutoFill = () => {
    const questionTypes = [
      {
        type: QuestionType.TEXT,
        text: 'Qual é o seu nome completo?',
        options: []
      },
      {
        type: QuestionType.TEXTAREA,
        text: 'Descreva o que aconteceu em detalhes.',
        options: []
      },
      {
        type: QuestionType.RADIO,
        text: 'Onde ocorreu o incidente?',
        options: [
          { text: 'Sala de aula', nextQuestionId: null },
          { text: 'Pátio', nextQuestionId: null },
          { text: 'Refeitório', nextQuestionId: null },
          { text: 'Outro local', nextQuestionId: null }
        ]
      },
      {
        type: QuestionType.SELECT,
        text: 'Qual o período em que você estuda?',
        options: [
          { text: 'Manhã', nextQuestionId: null },
          { text: 'Tarde', nextQuestionId: null },
          { text: 'Noite', nextQuestionId: null }
        ]
      }
    ];
    
    // Escolher aleatoriamente um exemplo de pergunta
    const example = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    
    form.reset({
      text: example.text,
      type: example.type,
      category: 'incidente',
      order: Math.floor(Math.random() * 10),
      required: true,
      options: example.options
    });
    
    toast.info('Formulário preenchido com dados de exemplo');
  };
  
  // Isso é necessário para garantir que o formulário seja interativo
  const enhancedOnChange = (field: ControllerRenderProps<any, any>, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    console.log(`Campo ${field.name} alterado:`, e.target.value);
    field.onChange(e);
  }
  
  return (
    <div className="space-y-4 p-2 border-2 border-gray-200 rounded-lg bg-white">
      <h2 className="text-lg font-bold border-b pb-2 mb-2">Informações da Pergunta</h2>
      
      {/* Erro geral do formulário */}
      {formError && (
        <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{formError}</p>
        </div>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Campo de texto da pergunta */}
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <div className="space-y-2">
              <label className="text-base font-medium">
                Texto da Pergunta <span className="text-red-500">*</span>
              </label>
              <textarea 
                placeholder="Digite a pergunta que será exibida para o usuário" 
                className={`w-full p-2 min-h-[60px] border-2 rounded-md ${
                  form.formState.errors.text ? 'border-red-500 bg-red-50' : 'bg-white'
                }`}
                value={form.getValues().text || ''}
                onChange={(e) => {
                  console.log("Alterando texto para:", e.target.value);
                  form.setValue('text', e.target.value, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true
                  });
                }}
              />
              {form.formState.errors.text && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.text.message}
                </p>
              )}
              <p className="text-sm text-gray-500">
                Seja claro e específico na formulação da pergunta.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campo de tipo da pergunta */}
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="space-y-2">
                <label className="text-base font-medium">
                  Tipo de Resposta <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full p-2 border-2 rounded-md ${
                    form.formState.errors.type ? 'border-red-500 bg-red-50' : 'bg-white'
                  }`}
                  value={form.getValues().type || ''}
                  onChange={(e) => {
                    console.log("Alterando tipo para:", e.target.value);
                    form.setValue('type', e.target.value as QuestionType, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true
                    });
                  }}
                >
                  <option value="">Selecione o tipo de resposta</option>
                  <option value={QuestionType.TEXT}>Texto Curto</option>
                  <option value={QuestionType.TEXTAREA}>Texto Longo</option>
                  <option value={QuestionType.RADIO}>Múltipla Escolha</option>
                  <option value={QuestionType.SELECT}>Lista Suspensa</option>
                  <option value={QuestionType.MULTISELECT}>Lista Suspensa Múltipla</option>
                  <option value={QuestionType.CHECKBOX}>Caixas de Seleção</option>
                  <option value={QuestionType.DATE}>Data</option>
                  <option value={QuestionType.FILE}>Upload de Arquivo</option>
                </select>
                {form.formState.errors.type && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.type.message}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Define como o usuário poderá responder esta pergunta.
                </p>
              </div>
            </div>
            
            {/* Campo de categoria */}
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="space-y-2">
                <label className="text-base font-medium">
                  Categoria <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: denuncia, contato"
                  className={`w-full p-2 border-2 rounded-md ${
                    form.formState.errors.category ? 'border-red-500 bg-red-50' : 'bg-white'
                  }`}
                  value={form.getValues().category || ''}
                  onChange={(e) => {
                    console.log("Alterando categoria para:", e.target.value);
                    form.setValue('category', e.target.value, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true
                    });
                  }}
                  onFocus={(e) => e.target.select()}
                />
                {form.formState.errors.category && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.category.message}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Agrupa perguntas relacionadas (sem espaços, acentos ou maiúsculas).
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campo de ordem */}
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="space-y-2">
                <label className="text-base font-medium">
                  Ordem <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  className={`w-full p-2 border-2 rounded-md ${
                    form.formState.errors.order ? 'border-red-500 bg-red-50' : 'bg-white'
                  }`}
                  value={form.getValues().order || 0}
                  onChange={(e) => {
                    console.log("Alterando ordem para:", e.target.value);
                    form.setValue('order', parseInt(e.target.value) || 0, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true
                    });
                  }}
                />
                {form.formState.errors.order && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.order.message}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Determina a sequência de exibição das perguntas.
                </p>
              </div>
            </div>
            
            {/* Campo obrigatório */}
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="flex items-start space-x-2 mt-5">
                <input
                  type="checkbox"
                  className="mt-1 border-2 w-5 h-5"
                  checked={form.getValues().required || false}
                  onChange={(e) => {
                    console.log("Alterando campo obrigatório para:", e.target.checked);
                    form.setValue('required', e.target.checked, {
                      shouldDirty: true,
                      shouldTouch: true,
                      shouldValidate: true
                    });
                  }}
                />
                <div>
                  <label className="text-base font-medium">Resposta Obrigatória</label>
                  <p className="text-sm text-gray-500">
                    Se marcado, o usuário deve responder esta pergunta.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Seção de Opções (aparece apenas para tipos SELECT e RADIO) */}
          {needsOptions && (
            <div className="space-y-3 bg-gray-50 p-3 rounded-md border border-gray-200">
              <div className="flex justify-between items-center">
                <label className="text-base font-medium">
                  Opções <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-500">
                  {fields.length === 0
                    ? 'Adicione pelo menos 2 opções'
                    : fields.length === 1
                      ? 'Adicione mais 1 opção'
                      : `${fields.length} opções definidas`}
                </p>
              </div>
              
              {/* Lista de opções atuais */}
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-2 bg-white border rounded-lg">
                    <div className="grid grid-cols-[1fr,auto] gap-2">
                      <div className="space-y-2">
                        {/* Texto da opção */}
                        <div className="space-y-1">
                          <label className="text-sm">Texto da Opção {index + 1}</label>
                          <input 
                            type="text"
                            placeholder="Digite o texto da opção"
                            className="w-full p-2 border bg-white rounded-md"
                            defaultValue={form.getValues().options?.[index]?.text || ''}
                            onBlur={(e) => {
                              const newOptions = [...(form.getValues().options || [])];
                              if (!newOptions[index]) {
                                newOptions[index] = { text: '', nextQuestionId: null };
                              }
                              newOptions[index].text = e.target.value;
                              form.setValue('options', newOptions, {
                                shouldDirty: true,
                                shouldValidate: true
                              });
                            }}
                          />
                        </div>
                        
                        {/* Próxima pergunta (lógica de pulo) */}
                        <div className="space-y-1">
                          <label className="text-sm">Próximas Perguntas</label>
                          
                          {/* Seleção única (legado) */}
                          <div className="mb-2">
                            <p className="text-xs text-gray-500 mb-1">Modo Compatibilidade (legado):</p>
                            <select
                              className="w-full p-2 border bg-white rounded-md"
                              value={form.getValues().options?.[index]?.nextQuestionId || ''}
                              onChange={(e) => {
                                const newOptions = [...(form.getValues().options || [])];
                                if (!newOptions[index]) {
                                  newOptions[index] = { text: '', nextQuestionId: null, nextQuestionsIds: [] };
                                }
                                newOptions[index].nextQuestionId = e.target.value || null;
                                form.setValue('options', newOptions);
                              }}
                            >
                              <option value="">Seguir sequência normal</option>
                              {otherQuestions.map((q) => (
                                <option key={q._id} value={q._id}>
                                  ({q.order}) {q.text.substring(0, 30)}...
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          {/* Seleção múltipla (novo) */}
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Múltiplas perguntas subsequentes:</p>
                            <div className="border rounded-md p-2 bg-white">
                              <div className="max-h-36 overflow-y-auto">
                                {otherQuestions.map((q) => {
                                  // Verificar se esta pergunta está na lista de próximas perguntas
                                  const isSelected = form.getValues().options?.[index]?.nextQuestionsIds?.includes(q._id);
                                  
                                  return (
                                    <div key={q._id} className="flex items-center space-x-2 py-1">
                                      <input
                                        type="checkbox"
                                        id={`next-question-${index}-${q._id}`}
                                        checked={!!isSelected}
                                        onChange={(e) => {
                                          const newOptions = [...(form.getValues().options || [])];
                                          if (!newOptions[index]) {
                                            newOptions[index] = { text: '', nextQuestionId: null, nextQuestionsIds: [] };
                                          }
                                          
                                          if (!newOptions[index].nextQuestionsIds) {
                                            newOptions[index].nextQuestionsIds = [];
                                          }
                                          
                                          if (e.target.checked) {
                                            // Adicionar à lista se não estiver
                                            if (!newOptions[index].nextQuestionsIds.includes(q._id)) {
                                              newOptions[index].nextQuestionsIds.push(q._id);
                                            }
                                          } else {
                                            // Remover da lista se estiver
                                            newOptions[index].nextQuestionsIds = 
                                              newOptions[index].nextQuestionsIds.filter(id => id !== q._id);
                                          }
                                          
                                          form.setValue('options', newOptions);
                                        }}
                                      />
                                      <label 
                                        htmlFor={`next-question-${index}-${q._id}`}
                                        className="text-xs cursor-pointer"
                                      >
                                        ({q.order}) {q.text.substring(0, 40)}...
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-500 mt-1">
                            Define para quais perguntas pular se esta opção for selecionada.
                          </p>
                        </div>
                      </div>
                      
                      {/* Botão remover opção */}
                      <button 
                        type="button"
                        className="mt-7 h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                        onClick={() => remove(index)}
                        disabled={fields.length <= 2} // Impede remover se só há 2 opções
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Botão adicionar opção */}
              <button
                type="button"
                className="w-full p-2 border flex items-center justify-center bg-white rounded-md"
                onClick={() => append({ text: '', nextQuestionId: null })}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Opção
              </button>
            </div>
          )}
          
          {/* Botões de ação */}
          <div className="sticky bottom-0 left-0 right-0 flex flex-col sm:flex-row gap-3 pt-4 mt-6 border-t border-gray-200 bg-white pb-2">
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-black text-white p-2 rounded-md hover:bg-gray-800 disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Atualizando...' : 'Criando...'}
                </>
              ) : (
                isEditing ? 'Atualizar Pergunta' : 'Criar Pergunta'
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleAutoFill}
            >
              Preencher Auto (DEV)
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 