import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import dbConnect from '@/lib/mongodb'
import Question from '@/lib/models/question'

// Rota de diagnóstico para MongoDB
export async function GET(request: Request) {
  try {
    console.log('[API Debug] Iniciando diagnóstico da conexão MongoDB');
    
    // Informações de ambiente
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.MONGODB_URI ? '***URI confidencial***' : 'Não definido',
      isDefined: !!process.env.MONGODB_URI,
    };
    
    console.log('[API Debug] Verificando informações do ambiente:', envInfo);
    
    // Estado atual da conexão (se já existe)
    let connectionState = 'Não conectado';
    let connectionReadyState = -1;
    
    if (mongoose.connection) {
      connectionReadyState = mongoose.connection.readyState;
      
      switch (connectionReadyState) {
        case 0:
          connectionState = 'Desconectado';
          break;
        case 1:
          connectionState = 'Conectado';
          break;
        case 2:
          connectionState = 'Conectando';
          break;
        case 3:
          connectionState = 'Desconectando';
          break;
        default:
          connectionState = 'Estado desconhecido';
      }
    }
    
    console.log(`[API Debug] Estado atual da conexão: ${connectionState} (${connectionReadyState})`);
    
    let testResult = null;
    let error = null;
    let collections: string[] = [];
    let questionCount = 0;
    
    // Tentar conectar e realizar operações básicas
    try {
      console.log('[API Debug] Tentando estabelecer conexão...');
      const conn = await dbConnect();
      
      // Ver quais coleções estão disponíveis
      if (conn.connection.db) {
        const collectionsResult = await conn.connection.db.listCollections().toArray();
        collections = collectionsResult.map(c => c.name);
        console.log(`[API Debug] Coleções encontradas: ${collections.join(', ')}`);
        
        // Contar documentos na coleção questions
        if (collections.includes('questions')) {
          questionCount = await Question.countDocuments();
          console.log(`[API Debug] Número de perguntas na coleção: ${questionCount}`);
        } else {
          console.log('[API Debug] Coleção "questions" não encontrada!');
        }
      }
      
      testResult = 'Conexão bem-sucedida';
    } catch (err) {
      console.error('[API Debug] Erro ao testar conexão:', err);
      error = err instanceof Error ? {
        message: err.message,
        name: err.name,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      } : String(err);
      
      testResult = 'Falha na conexão';
    }
    
    // Preparar resposta com todas as informações
    const diagnosticInfo = {
      timestamp: new Date().toISOString(),
      environment: envInfo,
      connection: {
        state: connectionState,
        readyState: connectionReadyState,
      },
      test: {
        result: testResult,
        error: error,
      },
      database: {
        collections,
        questionCount,
      }
    };
    
    return NextResponse.json(diagnosticInfo, { 
      status: error ? 500 : 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
    
  } catch (error) {
    console.error('[API Debug] Erro na rota de diagnóstico:', error);
    
    return NextResponse.json({
      error: 'Erro ao executar diagnóstico',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  }
} 