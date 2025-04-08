// Script para testar variáveis de ambiente
require('dotenv').config();

console.log('=== TESTE DE VARIÁVEIS DE AMBIENTE ===');
console.log('MONGODB_URI:', process.env.MONGODB_URI || 'NÃO DEFINIDO');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'NÃO DEFINIDO');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET || 'NÃO DEFINIDO');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NÃO DEFINIDO');
console.log('======================================'); 