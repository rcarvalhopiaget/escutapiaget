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
  // Aumentar timeout e simplificar a build
  staticPageGenerationTimeout: 180,
  reactStrictMode: false,
  experimental: {
    // Simplificar opções experimentais para maior compatibilidade
    serverMinification: true,
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
    
    // Garantir que o build não falhe por falta de memória
    config.optimization = {
      ...config.optimization,
      minimize: true,
      // Desativar minimização de CSS que pode causar problemas
      minimizer: config.optimization.minimizer?.filter(
        minimizer => !(minimizer.constructor.name === 'CssMinimizerPlugin')
      ),
    };
    
    return config;
  },
  // Configurações críticas para Docker
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  // Configurações simplificadas de imagem
  images: {
    deviceSizes: [640, 750, 828, 1080, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256],
    formats: ['image/webp'],
  },
  // Configurações de diretório
  distDir: '.next',
};

export default nextConfig;
