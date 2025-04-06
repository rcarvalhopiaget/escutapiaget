'use client'

import { useState, useEffect } from 'react'
import { IQuestion } from '@/lib/models/question'
import { Question, QuestionType } from '@/app/types/question'
import { Button } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog"
import { toast } from 'sonner'
import { PlusCircle, Edit, Trash2, Loader2, ChevronDown, ChevronRight, ExternalLink, AlertCircle } from "lucide-react"
import { QuestionForm } from './question-form'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import React from 'react'

// Interface estendida para incluir _id que vem do MongoDB
interface QuestionWithId extends Omit<IQuestion, '_id'> {
  _id: string;
}

export function QuestionManager() {
  const [questions, setQuestions] = useState<QuestionWithId[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null)
  const [questionToDelete, setQuestionToDelete] = useState<QuestionWithId | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Função para buscar as perguntas da API
  const fetchQuestions = async () => {
    setIsLoading(true)
    setError(null)
    setApiError(null)
    try {
      const response = await fetch('/api/admin/questions', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`)
      }
      
      const data: QuestionWithId[] = await response.json()
      setQuestions(data)
    } catch (err: any) {
      console.error("Erro ao buscar perguntas:", err)
      setError('Falha ao carregar as perguntas.')
      toast.error('Falha ao carregar perguntas', { 
        description: err.message || 'Erro de conexão com o servidor'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Buscar perguntas quando o componente montar
  useEffect(() => {
    fetchQuestions()
  }, [])

  const handleOpenAddModal = () => {
    setEditingQuestion(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (question: QuestionWithId) => {
    if (!question.text) {
      toast.error("Erro ao abrir formulário de edição: Dados incompletos");
      return;
    }
    
    // Converter ObjectId para string antes de passar para o formulário
    const questionForForm: Question = {
      ...question,
      _id: String(question._id),
      options: question.options?.map(opt => ({
        ...opt,
        nextQuestionId: opt.nextQuestionId ? String(opt.nextQuestionId) : null,
        nextQuestionsIds: opt.nextQuestionsIds ? opt.nextQuestionsIds.map(id => String(id)) : undefined
      })) || []
    };
    
    setEditingQuestion(questionForForm); 
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingQuestion(null)
  }

  const handleFormSubmitSuccess = () => {
    handleCloseModal()
    fetchQuestions()
  }

  const handleConfirmDelete = (question: QuestionWithId) => {
    setQuestionToDelete(question)
    setIsDeleteModalOpen(true)
  }

  const handleCancelDelete = () => {
    setQuestionToDelete(null)
    setIsDeleteModalOpen(false)
  }

  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;
    
    setIsDeleting(true)
    setApiError(null)
    try {
      const url = `/api/admin/questions/${questionToDelete._id}`;
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include'
      })

      if (!response.ok) {
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        try {
          if (response.status !== 204) {
            const errorData = await response.json().catch(() => ({}))
            errorMessage = errorData.error || errorMessage;
          }
        } catch (e) {
          console.error("Erro ao processar resposta de erro:", e);
        }
        throw new Error(errorMessage);
      }

      toast.success("Pergunta excluída com sucesso!")
      setQuestions(prevQuestions => prevQuestions.filter(q => q._id !== questionToDelete._id))
      setIsDeleteModalOpen(false)
      setQuestionToDelete(null)
    } catch (err: any) {
      console.error("Erro ao deletar pergunta:", err)
      setApiError(err.message || "Erro desconhecido ao excluir pergunta");
      toast.error("Erro ao excluir pergunta", { description: err.message || "Falha na conexão com o servidor" })
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleExpandQuestion = (id: string) => {
    setExpandedQuestionId(prevId => prevId === id ? null : id)
  }

  // Função para renderizar as opções de uma pergunta de forma legível
  const renderOptions = (question: QuestionWithId) => {
    if (!question.options || question.options.length === 0) {
      return <span className="text-gray-400">Nenhuma opção</span>
    }

    return (
      <div className="space-y-1">
        {question.options.map((option, index) => (
          <div key={index} className="flex items-start">
            <Badge variant="outline" className="mr-2">
              {index + 1}
            </Badge>
            <div className="text-sm">
              <span>{option.text}</span>
              
              {/* Exibir legado - próxima pergunta única */}
              {option.nextQuestionId && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Pula para 1 pergunta
                </Badge>
              )}
              
              {/* Exibir novo - múltiplas perguntas subsequentes */}
              {option.nextQuestionsIds && option.nextQuestionsIds.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Pula para {option.nextQuestionsIds.length} perguntas
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando perguntas...</p>
      </div>
    )
  }

  if (error) {
    return <p className="text-red-500 text-center py-10">{error}</p>
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAddModal}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Pergunta
            </Button>
          </DialogTrigger>
          <DialogContent 
            className="w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto" 
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? 'Editar Pergunta' : 'Adicionar Nova Pergunta'}
              </DialogTitle>
              <DialogDescription>
                Preencha os campos abaixo para {editingQuestion ? 'atualizar' : 'adicionar'} uma pergunta.
              </DialogDescription>
            </DialogHeader>
            <div className="p-2 overflow-y-auto">
              <QuestionForm
                key={editingQuestion?._id || 'new'}
                initialData={editingQuestion}
                onSubmitSuccess={handleFormSubmitSuccess}
                onCancel={handleCloseModal}
              />
              {apiError && (
                <p className="mt-2 text-sm text-red-600">Erro: {apiError}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Ordem</TableHead>
              <TableHead>Texto da Pergunta</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="w-[80px]">Obrig.</TableHead>
              <TableHead className="w-[80px]">Opções</TableHead>
              <TableHead className="w-[100px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.length > 0 ? (
              questions.map((q) => (
                <React.Fragment key={q._id}>
                  <TableRow 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleExpandQuestion(q._id)}
                  >
                    <TableCell className="font-medium">{q.order}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {expandedQuestionId === q._id ? 
                          <ChevronDown className="h-4 w-4 mr-2 text-gray-400" /> : 
                          <ChevronRight className="h-4 w-4 mr-2 text-gray-400" />
                        }
                        {q.text}
                      </div>
                    </TableCell>
                    <TableCell>{q.type}</TableCell>
                    <TableCell>{q.category}</TableCell>
                    <TableCell>{q.required ? 'Sim' : 'Não'}</TableCell>
                    <TableCell>
                      {(q.type === QuestionType.RADIO || q.type === QuestionType.SELECT) ? 
                        (q.options?.length || 0) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(q)}
                          title="Editar pergunta"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleConfirmDelete(q)}
                          title="Excluir pergunta"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedQuestionId === q._id && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-gray-50 p-4">
                        <div className="space-y-4">
                          <h3 className="font-medium">Detalhes da Pergunta</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Texto Completo</h4>
                              <p className="mt-1">{q.text}</p>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Informações</h4>
                              <ul className="mt-1 space-y-1 text-sm">
                                <li>ID: <span className="font-mono text-xs">{q._id}</span></li>
                                <li>Criada em: {new Date(q.createdAt).toLocaleString()}</li>
                                <li>Última atualização: {new Date(q.updatedAt).toLocaleString()}</li>
                              </ul>
                            </div>
                          </div>
                          
                          {(q.type === QuestionType.RADIO || q.type === QuestionType.SELECT) && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">Opções</h4>
                              <div className="mt-2">
                                {renderOptions(q)}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Nenhuma pergunta encontrada. Clique em "Adicionar Pergunta" para criar uma nova.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de confirmação para exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir a pergunta "{questionToDelete?.text}"?<br />
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={handleCancelDelete} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteQuestion} 
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir Pergunta'
              )}
            </Button>
          </div>
          {apiError && (
            <div className="mt-2 p-2 bg-red-50 text-red-600 rounded text-sm">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              {apiError}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 