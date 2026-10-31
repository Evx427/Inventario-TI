import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/main.css'
import { useAuthStore } from './stores/auth'


const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Inicializar el store 
const auth = useAuthStore(pinia)
auth.init().finally(() => {
  app.mount('#app')
})

import { registerSW } from 'virtual:pwa-register'

// Registra el service worker y maneja las actualizaciones
registerSW({ immediate: true })