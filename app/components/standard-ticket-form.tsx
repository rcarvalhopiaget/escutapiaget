'use client'

import { useForm, Controller, ControllerRenderProps, FieldValues, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ticketFormSchema } from '@/lib/validations'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from "@/components/ui/checkbox"
import { TicketCategory, TicketType } from '../types/ticket'
import { toast } from 'sonner'
import { generateProtocol, calculateDeadlineDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface StandardTicketFormProps {
  initialType: TicketType
  initialCategory?: TicketCategory
  onSuccess?: (protocol: string, deadlineText: string, deadlineFormatted: string) => void
}

type FormValues = z.infer<typeof ticketFormSchema>

export function StandardTicketForm({ 
  initialType, 
  initialCategory,
  onSuccess 
}: StandardTicketFormProps) {
  const [isStudentLocal, setIsStudentLocal] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<FormValues>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: {
      type: initialType,
      category: initialCategory || TicketCategory.OUTROS,
      name: '',
      email: '',
      isStudent: true,
      studentName: '',
      studentGrade: '',
      message: ''
    },
    mode: 'onChange'
  })

  const watchedIsStudent = form.watch("isStudent")
  useEffect(() => {
    setIsStudentLocal(watchedIsStudent)
    if (!watchedIsStudent) {
       form.setValue('studentName', '', { shouldValidate: true })
       form.setValue('studentGrade', '', { shouldValidate: true })
    } else {
        form.trigger(['studentName', 'studentGrade'])
    }
  }, [watchedIsStudent, form])

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setIsSubmitting(true)
    
    try {
      console.log("Form Submitted:", values)
      
      // Criar o objeto de dados para enviar à API
      const ticketData = {
        type: values.type,
        category: values.category,
        name: values.name,
        email: values.email,
        isStudent: values.isStudent,
        studentName: values.studentName || '',
        studentGrade: values.studentGrade || '',
        message: values.message,
        status: 'aberto' // Status inicial sempre é aberto
      }
      
      // Enviar para a API
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticketData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar chamado')
      }
      
      // Usar o protocolo retornado pela API em vez de gerar localmente
      const protocol = data.ticket.protocol
      const deadlineDate = calculateDeadlineDate(values.type)
      const deadlineText = values.type === TicketType.DENUNCIA ? '48 horas' : '15 dias'
      const deadlineFormatted = deadlineDate.toLocaleDateString('pt-BR')
      
      toast.success('Chamado enviado com sucesso!', {
        description: `Seu protocolo: ${protocol}`
      })
      
      if (onSuccess) {
        onSuccess(protocol, deadlineText, deadlineFormatted)
      }
    } catch (error) {
      console.error('Erro ao enviar formulário padrão:', error)
      toast.error('Erro ao enviar o chamado', {
        description: 'Por favor, tente novamente mais tarde'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Controller
          control={form.control}
          name="type"
          render={({ field, fieldState: { error } }) => (
            <FormItem>
              <FormLabel>Tipo de Chamado</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de chamado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem key="reclamacao" value={TicketType.RECLAMACAO}>Reclamação</SelectItem>
                  <SelectItem key="sugestao" value={TicketType.SUGESTAO}>Sugestão</SelectItem>
                  <SelectItem key="duvida" value={TicketType.DUVIDA}>Dúvida</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage>{error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <Controller
          control={form.control}
          name="category"
          render={({ field, fieldState: { error } }) => (
            <FormItem>
              <FormLabel>Categoria</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem key="ensino" value={TicketCategory.ENSINO}>Ensino Pedagógico</SelectItem>
                  <SelectItem key="financeiro" value={TicketCategory.FINANCEIRO}>Financeiro</SelectItem>
                  <SelectItem key="atendimento" value={TicketCategory.ATENDIMENTO}>Atendimento</SelectItem>
                  <SelectItem key="outros" value={TicketCategory.OUTROS}>Outros</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage>{error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState: { error } }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Digite seu nome completo" {...field} />
                </FormControl>
                <FormMessage>{error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState: { error } }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Digite seu e-mail" {...field} />
                </FormControl>
                <FormMessage>{error?.message}</FormMessage>
              </FormItem>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="isStudent"
          render={({ field, fieldState: { error } }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={field.disabled}
                  ref={field.ref}
                  name={field.name}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  É responsável por aluno?
                </FormLabel>
              </div>
              <FormMessage className="mt-1">{error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <div className={cn("grid gap-6 md:grid-cols-2", !isStudentLocal && "opacity-50 pointer-events-none")}>
          <Controller
            control={form.control}
            name="studentName"
            render={({ field, fieldState: { error } }) => (
              <FormItem>
                <FormLabel>Nome do Aluno</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Digite o nome do aluno" 
                    {...field} 
                    disabled={!isStudentLocal || field.disabled}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage>{error?.message}</FormMessage>
              </FormItem>
            )}
          />

          <Controller
            control={form.control}
            name="studentGrade"
            render={({ field, fieldState: { error } }) => (
              <FormItem>
                <FormLabel>Série/Turma</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Exemplo: 5º ano" 
                    {...field} 
                    disabled={!isStudentLocal || field.disabled}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage>{error?.message}</FormMessage>
              </FormItem>
            )}
          />
        </div>

        <Controller
          control={form.control}
          name="message"
          render={({ field, fieldState: { error } }) => (
            <FormItem>
              <FormLabel>Mensagem</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva detalhadamente sua solicitação"
                  className="min-h-32"
                  {...field}
                />
              </FormControl>
              <FormMessage>{error?.message}</FormMessage>
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting || !form.formState.isValid}
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Enviar Chamado'}
        </Button>
      </form>
    </Form>
  )
} 