import { MongoDBTroubleshooter } from '@/app/components/mongodb-troubleshooter'

export const metadata = {
  title: 'Diagnóstico de Sistema | Escuta Piaget',
  description: 'Ferramentas de diagnóstico para o sistema Escuta Piaget',
}

export default function DebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico de Sistema</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-medium mb-3">Conexão com MongoDB</h2>
          <MongoDBTroubleshooter />
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-sm">
            <p className="text-blue-800 font-medium mb-1">Dicas para problemas de conexão:</p>
            <ul className="list-disc pl-5 text-blue-700 space-y-1">
              <li>Verifique se as credenciais estão corretas nos arquivos .env</li>
              <li>Confirme se o endereço IP atual tem permissão no Atlas MongoDB</li>
              <li>Teste a conexão diretamente usando o MongoDB Compass</li>
              <li>Verifique se o nome do banco de dados está correto na URI</li>
            </ul>
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-medium mb-3">Informações do Sistema</h2>
          <div className="bg-white p-4 rounded-md border shadow-sm">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-medium">Ambiente</td>
                  <td className="py-2 text-right font-mono">{process.env.NODE_ENV}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Versão Node</td>
                  <td className="py-2 text-right font-mono">{process.version}</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Data/Hora Servidor</td>
                  <td className="py-2 text-right font-mono">
                    {new Date().toLocaleString('pt-BR', { 
                      dateStyle: 'long', 
                      timeStyle: 'medium' 
                    })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-6">
            <h2 className="text-lg font-medium mb-3">Variáveis de Ambiente</h2>
            <div className="bg-white p-4 rounded-md border shadow-sm">
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-medium">MONGODB_URI</td>
                    <td className="py-2 text-right font-mono">
                      {process.env.MONGODB_URI ? "***Definido***" : "Não definido"}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-medium">NODE_ENV</td>
                    <td className="py-2 text-right font-mono">{process.env.NODE_ENV}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">DEBUG</td>
                    <td className="py-2 text-right font-mono">
                      {process.env.DEBUG === 'true' ? "Ativado" : "Desativado"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 