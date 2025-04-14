import Link from "next/link"
import { ProtocolSearch } from "./components/protocol-search"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">Colégio Piaget</h1>        
        
        <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Bem-vindo à Escuta Piaget</h2>
          <p className="mb-8 text-base">
            Este é o portal principal da Piaget, onde clientes, parceiros e funcionários 
            podem acessar informações e serviços importantes.
          </p>

          {/* Sistema de Chamados na parte superior */}
          <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 hover:bg-gray-100 transition-colors duration-200">
            <Link
              href="/chamados"
              className="group flex flex-col w-full"
            >
              <h2 className="mb-3 text-xl font-semibold flex items-center">
                Sistema de Chamados
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none ml-2">
                  →
                </span>
              </h2>
              <p className="text-sm opacity-80">
                Registre reclamações, sugestões, dúvidas e denuncie casos de bullying.
              </p>
            </Link>
          </div>

          {/* Componente de busca de protocolo na parte inferior */}
          <div className="mt-12 border-t pt-8">
            <h3 className="text-xl font-semibold mb-4 text-center">Consulta de Protocolo</h3>
            <ProtocolSearch />
          </div>
        </div>
        
        <footer className="mt-8 text-center text-xs text-neutral-500">
          Colégio Piaget &copy; {new Date().getFullYear()} - Todos os direitos reservados
        </footer>
      </div>
    </main>
  )
}
