<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { supabase } from '../lib/supabase'
import BaseButton from '../components/ui/BaseButton.vue'

const router = useRouter()
const auth = useAuth()

const password = ref('')
const password2 = ref('')
const error = ref('')
const ok = ref(false)
const cargando = ref(false)
const erroresValidacion = ref({ password: '', password2: '' })

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    error.value = 'El enlace de recuperación ha expirado. Solicita uno nuevo.'
  }
})

function validar() {
  erroresValidacion.value = { password: '', password2: '' }
  let valido = true

  if (password.value.length < 8) {
    erroresValidacion.value.password = 'Mínimo 8 caracteres.'
    valido = false
  } else if (!/[A-Z]/.test(password.value)) {
    erroresValidacion.value.password = 'Debe contener al menos una mayúscula.'
    valido = false
  } else if (!/[a-z]/.test(password.value)) {
    erroresValidacion.value.password = 'Debe contener al menos una minúscula.'
    valido = false
  } else if (!/[0-9]/.test(password.value)) {
    erroresValidacion.value.password = 'Debe contener al menos un número.'
    valido = false
  }

  if (password.value !== password2.value) {
    erroresValidacion.value.password2 = 'Las contraseñas no coinciden.'
    valido = false
  }

  return valido
}

async function onSubmit() {
  error.value = ''
  ok.value = false
  if (!validar()) return

  cargando.value = true
  const res = await auth.actualizarPassword(password.value)
  cargando.value = false

  if (!res.ok) {
    error.value = res.error
    return
  }
  ok.value = true
  setTimeout(() => router.push('/'), 2000)
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

        <h2 class="text-3xl font-bold text-white mb-2">Nueva contraseña</h2>
        <p class="text-sm text-[#b8c4c2] mb-8">Establece una nueva contraseña segura para tu cuenta.</p>

        <form class="space-y-5" @submit.prevent="onSubmit" novalidate>
          
          <div>
            <label class="block text-xs font-mono uppercase tracking-wider text-[#b8c4c2] mb-2">Nueva contraseña</label>
            <input
              v-model="password"
              type="password"
              autocomplete="new-password"
              placeholder="••••••••"
              class="w-full bg-transparent border rounded-full px-5 py-3 text-white placeholder-[#5c6c75] transition focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50"
              :class="erroresValidacion.password ? 'border-red-500' : 'border-[#00684a] focus:border-[#00ed64]'"
            />
            
            <!-- Validador visual -->
            <div class="mt-3 space-y-1">
              <p class="text-xs font-mono flex items-center gap-2" :class="password.length >= 8 ? 'text-[#00ed64]' : 'text-[#5c6c75]'">
                <span>{{ password.length >= 8 ? '✓' : '○' }}</span> Al menos 8 caracteres
              </p>
              <p class="text-xs font-mono flex items-center gap-2" :class="/[A-Z]/.test(password) ? 'text-[#00ed64]' : 'text-[#5c6c75]'">
                <span>{{ /[A-Z]/.test(password) ? '✓' : '○' }}</span> Una letra mayúscula
              </p>
              <p class="text-xs font-mono flex items-center gap-2" :class="/[a-z]/.test(password) ? 'text-[#00ed64]' : 'text-[#5c6c75]'">
                <span>{{ /[a-z]/.test(password) ? '✓' : '○' }}</span> Una letra minúscula
              </p>
              <p class="text-xs font-mono flex items-center gap-2" :class="/[0-9]/.test(password) ? 'text-[#00ed64]' : 'text-[#5c6c75]'">
                <span>{{ /[0-9]/.test(password) ? '✓' : '○' }}</span> Un número
              </p>
            </div>
            <p v-if="erroresValidacion.password" class="text-xs text-red-400 mt-1.5 font-mono">{{ erroresValidacion.password }}</p>
          </div>

          <div>
            <label class="block text-xs font-mono uppercase tracking-wider text-[#b8c4c2] mb-2">Confirmar contraseña</label>
            <input
              v-model="password2"
              type="password"
              autocomplete="new-password"
              placeholder="••••••••"
              class="w-full bg-transparent border rounded-full px-5 py-3 text-white placeholder-[#5c6c75] transition focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50"
              :class="erroresValidacion.password2 ? 'border-red-500' : 'border-[#00684a] focus:border-[#00ed64]'"
            />
            <p v-if="erroresValidacion.password2" class="text-xs text-red-400 mt-1.5 font-mono">{{ erroresValidacion.password2 }}</p>
          </div>

          <div v-if="error" class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 flex items-start gap-2 font-mono">
            <span class="font-bold">!</span>
            <span>{{ error }}</span>
          </div>

          <div v-if="ok" class="bg-[#00ed64]/10 border border-[#00ed64]/30 text-[#00ed64] text-sm rounded-xl px-4 py-3 flex items-start gap-2 font-mono">
            <span class="font-bold">✓</span>
            <span>Contraseña actualizada. Redirigiendo...</span>
          </div>

          <BaseButton type="submit" variant="primary" size="lg" block :loading="cargando" :disabled="ok">
            {{ ok ? 'Contraseña actualizada' : 'Guardar contraseña' }}
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

    <!-- Derecha: Panel -->
    <div class="hidden lg:flex relative bg-[#00684a] overflow-hidden items-center justify-center p-12">
      <div class="absolute inset-0 opacity-30">
        <div class="absolute top-20 left-20 w-64 h-64 bg-[#00ed64] rounded-full blur-3xl"></div>
        <div class="absolute bottom-20 right-20 w-96 h-96 bg-[#00ed64] rounded-full blur-3xl"></div>
      </div>

      <div class="relative z-10 max-w-md text-center">
        <div class="w-20 h-20 rounded-full bg-[#001e2b] border-2 border-[#00ed64] flex items-center justify-center text-3xl mx-auto mb-6 text-[#00ed64]">
          🔑
        </div>
        <h3 class="text-2xl font-bold text-white mb-3">Crea una contraseña segura</h3>
        <p class="text-sm text-[#b8c4c2] font-medium leading-relaxed">
          Usa al menos 8 caracteres con mayúsculas, minúsculas y números. Una contraseña fuerte protege tu información.
        </p>
      </div>
    </div>
  </div>
</template>