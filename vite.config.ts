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
      input: {
        main: './src/main.ts'
      },
      output: {
        entryFileNames: 'assets/[name].js'
      }
    }
  },
  // Configurar cronnaclimba.html como entrada
  root: '.',
  publicDir: 'public'
}) 