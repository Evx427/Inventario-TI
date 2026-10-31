<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'
import BaseButton from '../components/ui/BaseButton.vue'

const auth = useAuth()
const email = ref('')
const error = ref('')
const ok = ref(false)
const cargando = ref(false)
const errorValidacion = ref('')

async function onSubmit() {
  error.value = ''
  ok.value = false
  errorValidacion.value = ''

  // Validación básica
  if (!email.value.trim()) {
    errorValidacion.value = 'El correo es obligatorio.'
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value.trim())) {
    errorValidacion.value = 'Ingresa un correo válido.'
    return
  }

  cargando.value = true
  const res = await auth.recuperarPassword(email.value.trim())
  cargando.value = false

  if (!res.ok) {
    error.value = res.error
    return
  }
  ok.value = true
}
</script>

<template>
  <div class="min-h-screen w-full grid lg:grid-cols-2 bg-blue-50/50">
    
    <!-- Izquierda: Formulario -->
    <div class="flex items-center justify-center px-6 py-12 bg-white/60 backdrop-blur-md">
      <div class="w-full max-w-md">
        
        <!-- Logo y título -->
        <div class="flex items-center gap-3 mb-8">
          <img 
            src="/logito.png" 
            alt="Logo Inventario TI" 
            class="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" 
          />
          <div>
            <h1 class="text-xl font-bold text-slate-800">Inventario TI</h1>
            <p class="text-xs text-blue-500 font-bold">Aplicacion Web para la Gestion de Equipos Informaticos</p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-slate-800 mb-1">Recuperar contraseña</h2>
        <p class="text-sm text-slate-500 mb-6 font-medium">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <form class="space-y-5" @submit.prevent="onSubmit" novalidate>
          
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1.5">
              Correo electrónico
            </label>
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="tu@correo.com"
              class="w-full bg-white border rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              :class="errorValidacion
                ? 'border-rose-300 focus:border-rose-500'
                : 'border-slate-200 focus:border-blue-500'"
              @input="errorValidacion = ''"
            />
            <p v-if="errorValidacion" class="text-xs text-rose-500 mt-1.5 font-bold">
              {{ errorValidacion }}
            </p>
          </div>

          <!-- Mensaje de error -->
          <div
            v-if="error"
            class="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl px-4 py-3 flex items-start gap-2 font-semibold"
          >
            <span class="font-bold">!</span>
            <span>{{ error }}</span>
          </div>

          <!-- Mensaje de éxito -->
          <div
            v-if="ok"
            class="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2 font-semibold"
          >
            <span class="font-bold">✓</span>
            <span>Si el correo existe, recibirás un enlace en tu bandeja de entrada. Revisa también el spam.</span>
          </div>

          <BaseButton 
            type="submit" 
            variant="primary" 
            size="lg" 
            block 
            :loading="cargando"
            :disabled="ok"
          >
            {{ ok ? 'Enlace enviado' : 'Enviar enlace de recuperación' }}
          </BaseButton>

          <div class="text-center pt-2">
            <RouterLink 
              to="/login" 
              class="text-sm text-blue-500 hover:text-blue-600 font-bold inline-flex items-center gap-1"
            >
              ← Volver al inicio de sesión
            </RouterLink>
          </div>

        </form>

        <!-- Footer con crédito -->
        <p class="text-xs text-slate-400 text-center mt-8 font-medium">
          © {{ new Date().getFullYear() }} Inventario TI · By Ever García
        </p>

      </div>
    </div>

    <!-- Derecha: Panel decorativo (igual que login) -->
    <div class="hidden lg:flex relative bg-blue-100/50 overflow-hidden border-l border-white">
      <div class="absolute inset-0 opacity-40">
        <div class="absolute top-10 left-10 w-64 h-64 rounded-full bg-blue-200 blur-3xl"></div>
        <div class="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-sky-200 blur-3xl"></div>
      </div>

      <div class="relative z-10 flex flex-col justify-center items-center p-12 w-full text-center">
        <div class="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white max-w-md">
          <div class="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl mx-auto mb-4">
            🔐
          </div>
          <h3 class="text-xl font-bold text-slate-800 mb-2">Recupera tu acceso</h3>
          <p class="text-sm text-slate-600 font-medium leading-relaxed">
            No te preocupes si olvidaste tu contraseña. Enviaremos un enlace seguro a tu correo para que puedas crear una nueva.
          </p>
        </div>
      </div>
    </div>

  </div>
</template>