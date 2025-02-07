import { defineConfig } from 'vite'

export default defineConfig({
  base: '/rafaelrepo/', // Deve ser o nome do seu repositório
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  // Configurar cronnaclimba.html como entrada
  root: '.',
  publicDir: 'public'
}) 