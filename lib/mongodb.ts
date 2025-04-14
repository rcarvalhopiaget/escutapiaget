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
    lastError: Error | null
    lastConnectionAttempt: number
  }
}

// Inicializar as variáveis globais se ainda não existirem
let cached = global.mongooseCache
if (!cached) {
  cached = global.mongooseCache = { 
    conn: null, 
    promise: null, 
    lastError: null, 
    lastConnectionAttempt: 0 
  }
}

/**
 * Função para conectar ao MongoDB
 * Reusa a conexão existente se disponível
 */
async function dbConnect(): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI

  // Mover a verificação da URI para dentro da função
  if (!MONGODB_URI) {
    const errorMessage = 'MONGODB_URI não está definida no ambiente.';
    console.error(`[MongoDB] Erro Crítico: ${errorMessage}`);
    
    // Durante o build, podemos apenas retornar um erro ou logar,
    // mas não lançar um erro que interrompa o build.
    // Em runtime, um erro será lançado se a URI não estiver definida.
    if (process.env.NODE_ENV === 'production') {
      cached.lastError = new Error(errorMessage);
      cached.lastConnectionAttempt = Date.now();
      throw cached.lastError;
    } else {
      // Em desenvolvimento ou build, apenas logar o aviso.
      console.warn('[MongoDB] Aviso: MONGODB_URI não está definida. A conexão não será estabelecida.');
      cached.lastError = new Error(errorMessage);
      cached.lastConnectionAttempt = Date.now();
      return Promise.reject(cached.lastError);
    }
  }

  // Se já existe uma conexão, verificar seu estado
  if (cached.conn) {
    const readyState = cached.conn.connection.readyState;
    if (readyState === 1) {
      console.log('[MongoDB] Usando conexão existente (ready state: connected)');
      return cached.conn;
    } else if (readyState === 2) {
      console.log('[MongoDB] Conexão em andamento (ready state: connecting), aguardando...');
      // Se a conexão estiver em andamento, aguardar a promessa existente
      if (cached.promise) {
        return await cached.promise;
      }
    } else {
      // Se a conexão estiver em um estado diferente (0 - disconnected, 3 - disconnecting), resetar
      console.log(`[MongoDB] Conexão em estado inválido (ready state: ${readyState}), criando nova conexão`);
      cached.conn = null;
      cached.promise = null;
    }
  }

  // Verificar se houve um erro recente e se deve aguardar antes de tentar novamente
  const MIN_RETRY_INTERVAL = 5000; // 5 segundos entre tentativas
  const now = Date.now();
  if (cached.lastError && (now - cached.lastConnectionAttempt < MIN_RETRY_INTERVAL)) {
    console.log(`[MongoDB] Última tentativa falhou há menos de ${MIN_RETRY_INTERVAL/1000}s. Reutilizando erro anterior.`);
    throw cached.lastError;
  }

  // Se não há conexão mas há uma promessa pendente, aguardar e retornar
  if (!cached.conn && cached.promise) {
    console.log('[MongoDB] Usando conexão pendente');
    try {
      return await cached.promise;
    } catch (error) {
      // Se a promessa pendente falhar, resetar para tentar novamente
      console.error('[MongoDB] Promessa pendente falhou:', error);
      cached.promise = null;
      cached.lastError = error instanceof Error ? error : new Error('Erro desconhecido');
      cached.lastConnectionAttempt = now;
      throw cached.lastError;
    }
  }

  console.log('[MongoDB] Iniciando nova conexão');
  cached.lastConnectionAttempt = now;
  
  // Configurações da conexão
  const opts = {
    bufferCommands: true,
    connectTimeoutMS: 10000, // 10 segundos
    socketTimeoutMS: 45000,  // 45 segundos
    maxPoolSize: 10,         // Limitar o número máximo de conexões no pool
    minPoolSize: 1,          // Manter pelo menos uma conexão ativa
    serverSelectionTimeoutMS: 15000, // Timeout para seleção de servidor
    heartbeatFrequencyMS: 10000,     // Frequência de heartbeat
    retryWrites: true,
    // Evitar erro de servidor de autenticação ao usar o URI diretamente sem o parâmetro de database
    dbName: 'escutapiaget', 
    // Outras opções podem ser necessárias dependendo da versão do Mongoose/driver
  }

  console.log('[MongoDB] Tentando conectar com URI:', 
    MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Log seguro da URI (esconde credenciais)

  // Criar nova promessa de conexão
  cached.promise = mongoose
    .connect(MONGODB_URI, opts)
    .then((mongooseInstance) => {
      console.log('[MongoDB] Conectado ao MongoDB com sucesso');
      // Verificar se a conexão e o db existem antes de acessar
      if (mongooseInstance.connection && mongooseInstance.connection.db) {
        console.log('[MongoDB] Database:', mongooseInstance.connection.db.databaseName);
      } else {
        console.log('[MongoDB] Conexão estabelecida, mas objeto db não disponível');
      }
      cached.lastError = null; // Limpar erro anterior se a conexão for bem-sucedida
      return mongooseInstance;
    })
    .catch((error) => {
      console.error('[MongoDB] Erro ao conectar ao MongoDB:', error);
      // Armazenar o erro para referência futura
      cached.lastError = error instanceof Error ? error : new Error('Erro desconhecido na conexão');
      cached.promise = null;
      throw error;
    });

  try {
    // Aguardar a promessa ser resolvida
    cached.conn = await cached.promise;
    console.log('[MongoDB] Conexão estabelecida');
  } catch (error) {
    // Limpar a promessa em caso de erro (já tratado no catch acima, mas redundância segura)
    cached.promise = null;
    console.error('[MongoDB] Falha ao estabelecer conexão final:', error);
    // Re-lançar o erro para que o chamador saiba que a conexão falhou
    throw error;
  }

  // Retornar a conexão estabelecida
  return cached.conn;
}

export default dbConnect 