/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Desativar verificação de ESLint durante build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignorar erros de TypeScript durante build
    ignoreBuildErrors: true,
  },
  // Aumentar timeout para geração de páginas estáticas
  staticPageGenerationTimeout: 180,
  // Desativar modo estrito do React para maior compatibilidade
  reactStrictMode: false,
  // Configurações para ambiente de produção
  productionBrowserSourceMaps: false,
  // Modificações experimentais
  experimental: {
    // Opções para maior compatibilidade
    serverMinification: true,
    // Desabilitar recursos experimentais problemáticos
    serverActions: {},
  },
  webpack: (config, { isServer }) => {
    // Resolver problemas de fallback para módulos do Node.js no browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        child_process: false,
        net: false,
        tls: false,
        http2: false,
        os: false,
        path: false,
      };
    }
    
    return config;
  },
  // Configuração essencial para Docker - permite executar standalone
  output: 'standalone',
  // Remover cabeçalho "X-Powered-By"
  poweredByHeader: false,
  // Ativar compressão
  compress: true,
  // Configurações de imagem
  images: {
    deviceSizes: [640, 750, 828, 1080, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256],
    formats: ['image/webp'],
    // Permitir domínios externos específicos
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Otimizar para produção
  distDir: '.next',
  // Usar métodos otimizados de roteamento
  skipTrailingSlashRedirect: true,
  // Configurações de ambiente
  env: {
    // Permitir build sem variáveis de ambiente específicas
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://placeholder:placeholder@placeholder:27017/placeholder',
  },
};

export default nextConfig;
