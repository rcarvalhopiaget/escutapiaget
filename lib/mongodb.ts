import mongoose from 'mongoose'

// Variáveis de configuração
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/escutapiaget'

/**
 * Variável global para armazenar a conexão com o MongoDB
 * No ambiente de desenvolvimento com hot reload, isso evita criar 
 * múltiplas conexões desnecessárias
 */
declare global {
  var mongoose: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}

// Inicializar as variáveis globais se ainda não existirem
if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null }
}

/**
 * Função para conectar ao MongoDB
 * Reusa a conexão existente se disponível
 */
async function dbConnect() {
  // Se já existe uma conexão, retorná-la
  if (global.mongoose.conn) {
    console.log('[MongoDB] Usando conexão existente')
    return global.mongoose.conn
  }

  // Se não há conexão mas há uma promessa pendente, aguardar e retornar
  if (!global.mongoose.promise) {
    console.log('[MongoDB] Iniciando nova conexão')
    
    // Configurações da conexão
    const opts = {
      bufferCommands: true,
    }

    // Criar nova promessa de conexão
    global.mongoose.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('[MongoDB] Conectado ao MongoDB com sucesso')
        return mongoose
      })
      .catch((error) => {
        console.error('[MongoDB] Erro ao conectar ao MongoDB:', error)
        throw error
      })
  } else {
    console.log('[MongoDB] Usando conexão pendente')
  }

  try {
    // Aguardar a promessa ser resolvida
    global.mongoose.conn = await global.mongoose.promise
    console.log('[MongoDB] Conexão estabelecida')
  } catch (error) {
    // Limpar a promessa em caso de erro
    global.mongoose.promise = null
    throw error
  }

  return global.mongoose.conn
}

export default dbConnect 