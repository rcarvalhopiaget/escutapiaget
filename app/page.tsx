import Link from "next/link"
import { ProtocolSearch } from "./components/protocol-search"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">Piaget</h1>        
        
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Bem-vindo à Escuta Piaget</h2>
          <p className="mb-6">
            Este é o portal principal da Piaget, onde clientes, parceiros e funcionários 
            podem acessar informações e serviços importantes.
          </p>

          {/* Componente de busca de protocolo */}
          <ProtocolSearch />

          <div className="flex justify-center mt-8">
            <Link
              href="/chamados"
              className="group rounded-lg border border-neutral-200 px-5 py-4 flex flex-col bg-white hover:bg-neutral-50 hover:border-neutral-300 max-w-md"
            >
              <h2 className="mb-3 text-xl font-semibold">
                Sistema de Chamados{" "}
                <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
                  →
                </span>
              </h2>
              <p className="text-sm opacity-80">
                Registre reclamações, sugestões, dúvidas e denuncie casos de bullying.
              </p>
            </Link>
          </div>
        </div>
        
        <footer className="mt-8 text-center text-xs text-neutral-500">
          Piaget &copy; {new Date().getFullYear()} - Todos os direitos reservados
        </footer>
      </div>
    </main>
  )
}
