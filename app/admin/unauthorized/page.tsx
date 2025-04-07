'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UnauthorizedPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-16 w-16 text-red-500 mx-auto mb-4" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Acesso Negado</h1>
        <p className="text-gray-600 mb-6">
          Você não tem permissões suficientes para acessar esta página.
        </p>
        
        {session ? (
          <div className="bg-gray-50 p-4 rounded-md mb-6 text-left">
            <p className="text-sm text-gray-700 mb-1">Conectado como:</p>
            <p className="font-medium">{session.user?.name || 'Usuário'}</p>
            <p className="text-sm text-gray-500">{session.user?.email}</p>
            <p className="text-sm text-gray-500 mt-2">
              Função: {session.user?.role || 'Não definida'}
            </p>
          </div>
        ) : null}
        
        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded transition-colors"
          >
            Voltar à página anterior
          </button>
          
          <Link href="/"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            Ir para a página inicial
          </Link>
        </div>
      </div>
    </div>
  )
} 