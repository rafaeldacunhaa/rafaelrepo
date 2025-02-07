import { defineConfig } from 'vite'

export default defineConfig({
  base: '/rafaelrepo/', // Deve ser o nome do seu repositório
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  // Configurar cronnaclimba.html como entrada
  root: '.',
  publicDir: 'public'
}) 