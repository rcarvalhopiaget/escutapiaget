'use client'

import { useState, useEffect } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { toast, Toaster } from 'sonner'
import { AlertCircle, CheckCircle2, UserCheck, Lock, Database, Server, Settings, LoaderCircle, UserPlus } from 'lucide-react'

export default function AuthDebugPage() {
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [creatingAdmin, setCreatingAdmin] = useState(false)
  const [dbCheck, setDbCheck] = useState<any>(null)
  const [loginAttemptResult, setLoginAttemptResult] = useState<any>(null)
  const [authConfig, setAuthConfig] = useState<any>(null)
  const [loadingConfig, setLoadingConfig] = useState(false)

  useEffect(() => {
    fetchAuthConfig()
  }, [])

  const fetchAuthConfig = async () => {
    try {
      setLoadingConfig(true)
      const response = await fetch('/api/debug/auth-config')
      const data = await response.json()
      setAuthConfig(data)
    } catch (error) {
      console.error('Erro ao buscar configurações de autenticação:', error)
      toast.error(`Erro ao buscar configurações: ${error}`)
    } finally {
      setLoadingConfig(false)
    }
  }

  const checkUserInDatabase = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/debug/check-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      setDbCheck(data)
      
      if (data.error) {
        toast.error(data.error)
      } else if (data.exists) {
        toast.success(data.message)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error)
      toast.error(`Erro ao verificar usuário: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const createAdminUser = async () => {
    try {
      setCreatingAdmin(true)
      const response = await fetch('/api/debug/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()
      
      if (data.error) {
        toast.error(`Erro ao criar admin: ${data.error}`)
      } else if (data.success) {
        toast.success('Administrador criado com sucesso!')
        // Preencher os campos com as credenciais do admin
        setEmail('admin@escolapiaget.com.br')
        setPassword('admin123')
      } else {
        toast.info(data.message)
        // Preencher os campos com as credenciais do admin existente
        setEmail('admin@escolapiaget.com.br')
        setPassword('admin123')
      }
    } catch (error) {
      console.error('Erro ao criar administrador:', error)
      toast.error(`Erro ao criar administrador: ${error}`)
    } finally {
      setCreatingAdmin(false)
    }
  }

  const tryCredentialsLogin = async () => {
    try {
      setLoading(true)
      console.log('Tentando login com:', { email, password })
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      })
      
      setLoginAttemptResult(result)
      
      if (result?.error) {
        console.error('Erro no login:', result.error)
        toast.error(`Falha na autenticação: ${result.error}`)
      } else {
        toast.success('Login bem-sucedido!')
      }
      
    } catch (error) {
      console.error('Erro ao fazer login:', error)
      toast.error(`Erro ao fazer login: ${error}`)
      setLoginAttemptResult({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Toaster richColors />
      <h1 className="text-2xl font-bold mb-6">Depuração de Autenticação</h1>
      
      <Tabs defaultValue="login">
        <TabsList className="mb-4">
          <TabsTrigger value="login">Teste de Login</TabsTrigger>
          <TabsTrigger value="session">Sessão Atual</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <div className="mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus size={20} />
                  Criar Usuário Administrador
                </CardTitle>
                <CardDescription>
                  Cria um usuário administrador padrão para teste inicial do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-2">
                  Isso criará um usuário administrador com as seguintes credenciais:
                </p>
                <ul className="text-sm text-gray-500 list-disc list-inside mb-4">
                  <li>Email: admin@escolapiaget.com.br</li>
                  <li>Senha: admin123</li>
                  <li>Função: admin</li>
                  <li>Departamento: ti</li>
                </ul>
                <p className="text-sm text-gray-500">
                  Se o usuário já existir, você será notificado e as credenciais serão preenchidas automaticamente para teste.
                </p>
              </CardContent>
              <CardFooter>
                <Button onClick={createAdminUser} disabled={creatingAdmin} variant="secondary">
                  {creatingAdmin ? 'Criando...' : 'Criar Administrador'}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database size={20} />
                  Verificação no Banco de Dados
                </CardTitle>
                <CardDescription>
                  Verifica se o usuário existe no banco de dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="db-email" className="text-sm font-medium">Email</label>
                    <Input 
                      id="db-email" 
                      type="email" 
                      placeholder="usuario@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="db-password" className="text-sm font-medium">Senha</label>
                    <Input 
                      id="db-password" 
                      type="password" 
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={checkUserInDatabase} disabled={loading}>
                  {loading ? 'Verificando...' : 'Verificar no Banco'}
                </Button>
              </CardFooter>
            </Card>
            
            {dbCheck && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {dbCheck.exists ? <CheckCircle2 size={20} className="text-green-500" /> : <AlertCircle size={20} className="text-red-500" />}
                    Resultado da Verificação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-96">
                    {JSON.stringify(dbCheck, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck size={20} />
                  Teste de Login NextAuth
                </CardTitle>
                <CardDescription>
                  Testa o fluxo completo de autenticação com NextAuth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="auth-email" className="text-sm font-medium">Email</label>
                    <Input 
                      id="auth-email" 
                      type="email" 
                      placeholder="usuario@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="auth-password" className="text-sm font-medium">Senha</label>
                    <Input 
                      id="auth-password" 
                      type="password" 
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={tryCredentialsLogin} disabled={loading}>
                  {loading ? 'Testando login...' : 'Testar Login'}
                </Button>
              </CardFooter>
            </Card>
            
            {loginAttemptResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {!loginAttemptResult.error ? <CheckCircle2 size={20} className="text-green-500" /> : <AlertCircle size={20} className="text-red-500" />}
                    Resultado do Login
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-96">
                    {JSON.stringify(loginAttemptResult, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="session">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock size={20} />
                Informações da Sessão
              </CardTitle>
              <CardDescription>
                Detalhes da sessão atual do usuário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-1">Status da Sessão:</p>
                  <p className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    status === 'authenticated' ? 'bg-green-100 text-green-800' :
                    status === 'loading' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {status === 'authenticated' ? 'Autenticado' :
                     status === 'loading' ? 'Carregando...' :
                     'Não autenticado'}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm font-medium mb-1">Dados da Sessão:</p>
                  <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-96">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {status === 'authenticated' ? (
                <Button variant="destructive" onClick={() => signOut()}>
                  Encerrar Sessão
                </Button>
              ) : (
                <p className="text-sm text-gray-500">
                  Nenhuma sessão ativa no momento
                </p>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings size={20} />
                Configurações de Autenticação
              </CardTitle>
              <CardDescription>
                Variáveis de ambiente e configurações do NextAuth
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingConfig ? (
                <div className="flex justify-center items-center py-12">
                  <LoaderCircle size={24} className="animate-spin mr-2" />
                  <span>Carregando configurações...</span>
                </div>
              ) : authConfig ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-md font-medium mb-2">Variáveis de Ambiente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                        <p className="text-sm font-medium">NEXTAUTH_URL</p>
                        <p className={`text-sm ${authConfig.baseUrl === 'Não definido' ? 'text-red-500' : 'text-green-500'}`}>
                          {authConfig.baseUrl}
                        </p>
                      </div>
                      
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                        <p className="text-sm font-medium">NEXTAUTH_SECRET</p>
                        <p className={`text-sm ${authConfig.secret === 'Não definido' ? 'text-red-500' : 'text-green-500'}`}>
                          {authConfig.secret}
                        </p>
                      </div>
                      
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                        <p className="text-sm font-medium">NODE_ENV</p>
                        <p className="text-sm">{authConfig.nodeEnv}</p>
                      </div>
                      
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                        <p className="text-sm font-medium">DEBUG_ENABLED</p>
                        <p className="text-sm">{authConfig.debug}</p>
                      </div>
                      
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                        <p className="text-sm font-medium">GOOGLE_CLIENT_ID</p>
                        <p className={`text-sm ${authConfig.googleClientId === 'Não definido' ? 'text-red-500' : 'text-green-500'}`}>
                          {authConfig.googleClientId}
                        </p>
                      </div>
                      
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                        <p className="text-sm font-medium">GOOGLE_CLIENT_SECRET</p>
                        <p className={`text-sm ${authConfig.googleClientSecret === 'Não definido' ? 'text-red-500' : 'text-green-500'}`}>
                          {authConfig.googleClientSecret}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-md font-medium mb-2">Headers</h3>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto">
                      {JSON.stringify(authConfig.headers, null, 2)}
                    </pre>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-md font-medium mb-2">Cookies</h3>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto">
                      {JSON.stringify(authConfig.cookies, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-red-500">
                  <AlertCircle size={24} className="mx-auto mb-2" />
                  <p>Erro ao carregar configurações</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={fetchAuthConfig} disabled={loadingConfig} variant="outline">
                {loadingConfig ? 'Atualizando...' : 'Atualizar Configurações'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 