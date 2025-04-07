/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Permitir que o build prossiga mesmo com erros do ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Permitir que o build prossiga mesmo com erros do TypeScript
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Apenas no lado do cliente (browser)
    if (!isServer) {
      // Resolver módulos Node.js no lado do cliente
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        child_process: false,
        net: false,
        tls: false,
        http2: false,
        os: false,
        path: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util/'),
        zlib: require.resolve('browserify-zlib'),
        querystring: require.resolve('querystring-es3'),
        url: require.resolve('url/'),
        https: require.resolve('https-browserify'),
        http: require.resolve('stream-http'),
        assert: require.resolve('assert/'),
      };
    }
    return config;
  },
  output: 'standalone', // Otimização para Docker
  poweredByHeader: false, // Remove o header X-Powered-By para segurança
  
  // Configurações adicionais para o Railway
  experimental: {
    // Otimização para produção em ambientes como o Railway
    outputFileTracingRoot: undefined,
  },
};

export default nextConfig;
