import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  // Crie uma versão segura das configurações do Google Provider
  // sem expor secrets
  const googleProvider = authOptions.providers.find(
    (provider) => provider.id === 'google'
  );

  // Tratamos de forma segura com verificações de existência
  const safeGoogleProvider = googleProvider
    ? {
        id: googleProvider.id,
        name: googleProvider.name,
        type: googleProvider.type,
        // Verifica se há propriedades específicas do Google Provider
        // sem assumir estrutura específica
        hasClientId: 'clientId' in googleProvider,
        hasClientSecret: 'clientSecret' in googleProvider,
        // Verifica se o callbackUrl está configurado
        callbackUrl: process.env.NEXTAUTH_URL 
          ? `${process.env.NEXTAUTH_URL}/api/auth/callback/google` 
          : undefined,
      }
    : null;

  // Informações gerais do NextAuth
  const authInfo = {
    nextAuthUrl: process.env.NEXTAUTH_URL || 'Não definido',
    nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'Configurado' : 'Não configurado',
    environment: process.env.NODE_ENV || 'Não definido',
    providersConfigured: authOptions.providers.map(p => p.id),
  };
  
  // Versão segura das configurações de autenticação
  return NextResponse.json({
    googleProvider: safeGoogleProvider,
    authInfo,
  });
} 