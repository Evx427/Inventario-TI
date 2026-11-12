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
  <div class="min-h-screen w-full grid lg:grid-cols-2 bg-[#001e2b] font-sans">
    
    <!-- Izquierda: Formulario -->
    <div class="flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-md">
        
        <div class="flex items-center gap-3 mb-8">
          <img src="/logito.png" alt="Logo" class="w-11 h-11 rounded-full object-cover border-2 border-[#00ed64]" />
          <div>
            <h1 class="text-xl font-bold text-white">Inventario TI</h1>
            <p class="text-xs text-[#00ed64] font-mono uppercase tracking-wider">Gestión de Activos TI</p>
          </div>
        </div>

        <h2 class="text-3xl font-bold text-white mb-2">Recuperar contraseña</h2>
        <p class="text-sm text-[#b8c4c2] mb-8">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>

        <form class="space-y-5" @submit.prevent="onSubmit" novalidate>
          
          <div>
            <label class="block text-xs font-mono uppercase tracking-wider text-[#b8c4c2] mb-2">Correo electrónico</label>
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="tu@correo.com"
              class="w-full bg-transparent border rounded-full px-5 py-3 text-white placeholder-[#5c6c75] transition focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50"
              :class="errorValidacion ? 'border-red-500' : 'border-[#00684a] focus:border-[#00ed64]'"
              @input="errorValidacion = ''"
            />
            <p v-if="errorValidacion" class="text-xs text-red-400 mt-1.5 font-mono">{{ errorValidacion }}</p>
          </div>

          <div v-if="error" class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 flex items-start gap-2 font-mono">
            <span class="font-bold">!</span>
            <span>{{ error }}</span>
          </div>

          <div v-if="ok" class="bg-[#00ed64]/10 border border-[#00ed64]/30 text-[#00ed64] text-sm rounded-xl px-4 py-3 flex items-start gap-2 font-mono">
            <span class="font-bold">✓</span>
            <span>Si el correo existe, recibirás un enlace en tu bandeja de entrada.</span>
          </div>

          <BaseButton type="submit" variant="primary" size="lg" block :loading="cargando" :disabled="ok">
            {{ ok ? 'Enlace enviado' : 'Enviar enlace' }}
          </BaseButton>

          <div class="text-center pt-2">
            <RouterLink to="/login" class="text-sm text-[#00ed64] hover:text-[#00ed64]/80 font-bold">
              ← Volver al inicio de sesión
            </RouterLink>
          </div>
        </form>

        <p class="text-xs text-[#5c6c75] text-center mt-10 font-mono">
          © {{ new Date().getFullYear() }} Inventario TI · By Ever García
        </p>
      </div>
    </div>

    <!-- Derecha: Panel decorativo -->
    <div class="hidden lg:flex relative bg-[#00684a] overflow-hidden items-center justify-center p-12">
      <div class="absolute inset-0 opacity-30">
        <div class="absolute top-20 left-20 w-64 h-64 bg-[#00ed64] rounded-full blur-3xl"></div>
        <div class="absolute bottom-20 right-20 w-96 h-96 bg-[#00ed64] rounded-full blur-3xl"></div>
      </div>

      <div class="relative z-10 max-w-md text-center">
        <div class="w-20 h-20 rounded-full bg-[#001e2b] border-2 border-[#00ed64] flex items-center justify-center text-3xl mx-auto mb-6 text-[#00ed64]">
          🔐
        </div>
        <h3 class="text-2xl font-bold text-white mb-3">Recupera tu acceso</h3>
        <p class="text-sm text-[#b8c4c2] font-medium leading-relaxed">
          No te preocupes si olvidaste tu contraseña. Enviaremos un enlace seguro a tu correo para que puedas crear una nueva.
        </p>
      </div>
    </div>
  </div>
</template>