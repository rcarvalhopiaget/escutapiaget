    // app/api/debug/check-env/route.ts
    import { NextResponse } from 'next/server';

    export async function GET() {
      // Lê a variável de ambiente MONGODB_URI do processo do servidor
      const mongoUri = process.env.MONGODB_URI;

      // Loga o valor no console do servidor (você verá isso nos logs da Railway)
      console.log('[Check Env Route] Verificando MONGODB_URI:', mongoUri);

      // Retorna um JSON para o navegador
      return NextResponse.json({
        message: 'Verificando MONGODB_URI no servidor...',
        MONGODB_URI_VALUE: mongoUri || 'NÃO DEFINIDA OU VAZIA!', // Mostra o valor ou um aviso
        NODE_ENV: process.env.NODE_ENV || 'NÃO DEFINIDO', // Útil para saber o ambiente
      });
    }