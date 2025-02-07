import { defineConfig } from 'vite'

export default defineConfig({
  base: '/rafaelrepo/',
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: '',
    rollupOptions: {
      input: {
        main: './src/main.ts',
        app: './cronnaclimba.html'
      },
      output: {
        entryFileNames: 'main.js'
      }
    }
  },
  // Configurar cronnaclimba.html como entrada
  root: '.',
  publicDir: 'public'
}) 