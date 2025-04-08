import mongoose from 'mongoose'

/**
 * Variável global para armazenar a conexão com o MongoDB
 * No ambiente de desenvolvimento com hot reload, isso evita criar 
 * múltiplas conexões desnecessárias
 */
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}

// Inicializar as variáveis globais se ainda não existirem
let cached = global.mongooseCache
if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null }
}

/**
 * Função para conectar ao MongoDB
 * Reusa a conexão existente se disponível
 */
async function dbConnect(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI

  // Mover a verificação da URI para dentro da função
  if (!MONGODB_URI) {
    // Durante o build, podemos apenas retornar um erro ou logar,
    // mas não lançar um erro que interrompa o build.
    // Em runtime, um erro será lançado se a URI não estiver definida.
    if (process.env.NODE_ENV === 'production') {
      console.error('[MongoDB] Erro Crítico: MONGODB_URI não está definida no ambiente de produção.')
      // Em produção, talvez queiramos lançar um erro mesmo assim, mas não durante o build.
      // Considerar uma estratégia diferente se a conexão for opcional em alguns casos.
      throw new Error('MONGODB_URI não está definida.')
    } else {
      // Em desenvolvimento ou build, apenas logar o aviso.
      console.warn('[MongoDB] Aviso: MONGODB_URI não está definida. A conexão não será estabelecida.')
      // Retornar um objeto que satisfaça a assinatura, mas indicando falha
      // Isso pode precisar de ajuste dependendo de como o erro é tratado nos callers
      return Promise.reject(new Error('MONGODB_URI não definida no ambiente atual.'))
    }
  }

  // Se já existe uma conexão, retorná-la
  if (cached.conn) {
    console.log('[MongoDB] Usando conexão existente')
    return cached.conn
  }

  // Se não há conexão mas há uma promessa pendente, aguardar e retornar
  if (!cached.promise) {
    console.log('[MongoDB] Iniciando nova conexão')
    
    // Configurações da conexão
    const opts = {
      bufferCommands: true,
      // Outras opções podem ser necessárias dependendo da versão do Mongoose/driver
    }

    // Criar nova promessa de conexão
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log('[MongoDB] Conectado ao MongoDB com sucesso')
        return mongooseInstance
      })
      .catch((error) => {
        console.error('[MongoDB] Erro ao conectar ao MongoDB:', error)
        // Limpar a promessa em caso de erro para permitir nova tentativa
        cached.promise = null
        throw error
      })
  } else {
    console.log('[MongoDB] Usando conexão pendente')
  }

  try {
    // Aguardar a promessa ser resolvida
    cached.conn = await cached.promise
    console.log('[MongoDB] Conexão estabelecida')
  } catch (error) {
    // Limpar a promessa em caso de erro (já tratado no catch acima, mas redundância segura)
    cached.promise = null
    console.error('[MongoDB] Falha ao estabelecer conexão final:', error)
    // Re-lançar o erro para que o chamador saiba que a conexão falhou
    throw error
  }

  // Retornar a conexão estabelecida
  return cached.conn
}

export default dbConnect 