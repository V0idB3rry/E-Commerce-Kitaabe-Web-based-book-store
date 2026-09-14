import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Where the project sits inside C:\xampp\htdocs (the PHP API and book covers are served by Apache from here)
const APP_ROOT = '/E-Commerce-Kitaabe-Web-based-book-store/E-commerce'

const toApache = {
  target: 'http://localhost',
  changeOrigin: true,
  rewrite: (path) => APP_ROOT + path,
}

export default defineConfig(({ command }) => ({
  plugins: [react()],

  // `npm run build` output is served by Apache at http://localhost/<APP_ROOT>/frontend/dist/
  base: command === 'build' ? `${APP_ROOT}/frontend/dist/` : '/',

  define: {
    // In dev the Vite proxy below forwards /api and /uploads to Apache, so no prefix is needed
    __SERVER_ROOT__: JSON.stringify(command === 'build' ? APP_ROOT : ''),
  },

  server: {
    port: 5173,
    proxy: {
      '/api': toApache,
      '/uploads': toApache,
    },
  },
}))
