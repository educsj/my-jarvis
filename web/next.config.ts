import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // O backend fica na raiz do projeto (outro package-lock.json). Fixa a raiz
  // do Turbopack neste diretório para evitar ambiguidade de workspace.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Permite acessar o painel tanto por localhost quanto por 127.0.0.1 em dev
  // (o Next 16 bloqueia recursos de dev de origens não listadas).
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

export default nextConfig;
