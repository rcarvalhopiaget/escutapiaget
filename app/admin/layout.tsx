import { Metadata } from "next"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "Painel Administrativo | 2Clicks",
  description: "Painel administrativo para gestão da plataforma 2Clicks",
}

/**
 * Layout para todas as páginas da área administrativa
 * Fornece uma estrutura comum para todas as páginas admin
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* O SessionProvider já está no layout principal da aplicação,
          não sendo necessário incluí-lo novamente aqui */}
      {children}
      <Toaster position="top-right" richColors />
    </div>
  )
} 