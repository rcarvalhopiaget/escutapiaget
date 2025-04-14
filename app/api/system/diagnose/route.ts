import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

/**
 * Rota de API para diagnóstico do sistema
 * Verifica a conexão com o MongoDB e retorna informações sobre o estado do sistema
 */
export async function GET(request: Request) {
  // Objeto para armazenar o status de diferentes componentes do sistema
  const systemStatus = {
    timestamp: new Date().toISOString(),
    mongoDb: {
      status: 'unknown',
      error: null as string | null,
      details: {}
    },
    environment: {
      node: process.version,
      env: process.env.NODE_ENV || 'unknown'
    }
  };

  // Testar conexão com MongoDB
  try {
    console.log('[System Diagnose] Testando conexão com MongoDB...');
    const mongoose = await dbConnect();
    
    // Verificar estado da conexão
    if (mongoose.connection.readyState === 1) {
      systemStatus.mongoDb.status = 'connected';
      systemStatus.mongoDb.details = {
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        readyState: mongoose.connection.readyState,
        models: Object.keys(mongoose.models)
      };
    } else {
      systemStatus.mongoDb.status = 'not_connected';
      systemStatus.mongoDb.details = {
        readyState: mongoose.connection.readyState
      };
    }
  } catch (error) {
    console.error('[System Diagnose] Erro ao conectar ao MongoDB:', error);
    systemStatus.mongoDb.status = 'error';
    systemStatus.mongoDb.error = error instanceof Error ? error.message : 'Erro desconhecido';
  }

  // Retornar status do sistema
  return NextResponse.json(systemStatus);
} 