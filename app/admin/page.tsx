import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/logout-button'

export default function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        {/* Navegação desktop */}
        <div className="hidden border-r bg-gray-100/40 lg:block w-64">
          <div className="flex flex-col gap-2 p-4">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Painel de Administração</h2>
            <Button variant="ghost" className="justify-start" asChild>
              <Link href="/admin/dashboard">
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild>
              <Link href="/admin/chamados">
                Chamados
              </Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild>
              <Link href="/admin/perguntas">
                Perguntas
              </Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild>
              <Link href="/admin/usuarios">
                Usuários
              </Link>
            </Button>
            <LogoutButton />
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Painel de Administração</h1>
          </div>

          <Tabs defaultValue="dashboard" className="w-full space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="chamados">Chamados</TabsTrigger>
              <TabsTrigger value="perguntas">Perguntas</TabsTrigger>
              <TabsTrigger value="usuarios">Usuários</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="space-y-4">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Dashboard Analítico</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="default" asChild>
                    <Link href="/admin/dashboard?access=auth">Visualizar Dashboard</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="chamados" className="space-y-4">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Chamados Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="default" asChild>
                    <Link href="/admin/chamados?access=auth">Ver todos os chamados</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="perguntas" className="space-y-4">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Gerenciar Perguntas</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="default" asChild>
                    <Link href="/admin/perguntas?access=auth">Gerenciar Perguntas</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="usuarios" className="space-y-4">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Gerenciar Usuários</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="default" asChild>
                    <Link href="/admin/usuarios?access=auth">Gerenciar Usuários</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <footer className="mt-20 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} 2Clicks - Sistema de Ouvidoria
          </footer>
        </div>
      </div>
    </div>
  )
} 