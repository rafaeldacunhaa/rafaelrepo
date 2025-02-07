import { defineConfig } from 'vite'

export default defineConfig({
  base: '/rafaelrepo/',
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