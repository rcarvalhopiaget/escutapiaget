import mongoose from 'mongoose'

// Variáveis de configuração
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error(
    'Por favor, defina a variável de ambiente MONGODB_URI dentro do arquivo .env'
  )
}

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
if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null }
}

/**
 * Função para conectar ao MongoDB
 * Reusa a conexão existente se disponível
 */
async function dbConnect() {
  // Se já existe uma conexão, retorná-la
  if (global.mongooseCache.conn) {
    console.log('[MongoDB] Usando conexão existente')
    return global.mongooseCache.conn
  }

  // Se não há conexão mas há uma promessa pendente, aguardar e retornar
  if (!global.mongooseCache.promise) {
    console.log('[MongoDB] Iniciando nova conexão')
    
    // Configurações da conexão
    const opts = {
      bufferCommands: true,
    }

    // Criar nova promessa de conexão
    global.mongooseCache.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        console.log('[MongoDB] Conectado ao MongoDB com sucesso')
        return mongoose
      })
      .catch((error) => {
        console.error('[MongoDB] Erro ao conectar ao MongoDB:', error)
        // Limpar a promessa em caso de erro para permitir nova tentativa
        global.mongooseCache.promise = null
        throw error
      })
  } else {
    console.log('[MongoDB] Usando conexão pendente')
  }

  try {
    // Aguardar a promessa ser resolvida
    global.mongooseCache.conn = await global.mongooseCache.promise
    console.log('[MongoDB] Conexão estabelecida')
  } catch (error) {
    // Limpar a promessa em caso de erro (já tratado no catch acima, mas redundância segura)
    global.mongooseCache.promise = null
    // Não precisa mais limpar conn aqui, pois ele não foi atribuído se houve erro na promessa
    console.error('[MongoDB] Falha ao estabelecer conexão final:', error)
    throw error
  }

  return global.mongooseCache.conn
}

export default dbConnect 