'use server'

import { toast } from 'sonner';
import { z } from 'zod';

interface ApiErrorResponse {
  error?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Processa a resposta de erro da API extraindo a mensagem de erro
 */
export async function handleApiError(response: Response): Promise<string> {
  let errorMessage = `Erro ${response.status}: ${response.statusText}`;
  
  try {
    const errorData: ApiErrorResponse = await response.json();
    
    // Usar a mensagem de erro mais específica disponível
    if (errorData.message) {
      errorMessage = errorData.message;
    } else if (errorData.error) {
      errorMessage = errorData.error;
    } else if (errorData.errors) {
      // Se houver múltiplos erros, concatená-los
      const errorMessages = Object.entries(errorData.errors)
        .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
        .join('; ');
      
      if (errorMessages) {
        errorMessage = errorMessages;
      }
    }
  } catch (error) {
    console.error('Erro ao processar resposta de erro:', error);
  }
  
  return errorMessage;
}

/**
 * Função para validar dados do formulário com Zod e retornar erros formatados
 */
export function validateFormData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    // Formatar os erros para fácil exibição
    const errors: Record<string, string> = {};
    
    result.error.issues.forEach((issue) => {
      const path = issue.path.join('.');
      errors[path] = issue.message;
    });
    
    return { success: false, errors };
  }
  
  return { success: true, data: result.data };
}

/**
 * Função para submeter dados de formulário para uma API
 */
export async function submitFormData<T>(
  url: string,
  data: unknown,
  method: 'POST' | 'PUT' = 'POST',
  schema?: z.ZodSchema<T>
): Promise<{ success: true; data: any } | { success: false; errors: Record<string, string> }> {
  // Validar com schema se fornecido
  if (schema) {
    const validation = validateFormData(schema, data);
    if (!validation.success) {
      return validation;
    }
    data = validation.data;
  }
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      const errorMessage = await handleApiError(response);
      toast.error('Erro ao submeter formulário', {
        description: errorMessage,
      });
      
      return {
        success: false,
        errors: {
          _form: errorMessage,
        },
      };
    }
    
    const responseData = await response.json();
    return { success: true, data: responseData };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao submeter formulário';
    
    toast.error('Falha na requisição', {
      description: errorMessage,
    });
    
    return {
      success: false,
      errors: {
        _form: errorMessage,
      },
    };
  }
} 