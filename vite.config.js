import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa' 

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', 
      includeAssets: ['logito.png'], 
      manifest: {
        name: 'Inventario TI',
        short_name: 'Inventario',
        description: 'Aplicacion web de gestión de equipos y activos TI',
        theme_color: '#6d28d9', 
        background_color: '#f0f7ff', 
        display: 'standalone', 
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'favicon.png', 
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' 
          }
        ]
      }
    })
  ],
})