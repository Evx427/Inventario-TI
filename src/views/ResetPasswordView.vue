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
  <div class="min-h-screen w-full grid lg:grid-cols-2 bg-blue-50/50">
    
    <!-- Izquierda: Formulario -->
    <div class="flex items-center justify-center px-6 py-12 bg-white/60 backdrop-blur-md">
      <div class="w-full max-w-md">
        
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

        <h2 class="text-2xl font-bold text-slate-800 mb-1">Nueva contraseña</h2>
        <p class="text-sm text-slate-500 mb-6 font-medium">
          Establece una nueva contraseña segura para tu cuenta.
        </p>

        <form class="space-y-5" @submit.prevent="onSubmit" novalidate>
          
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1.5">
              Nueva contraseña
            </label>
            <input
              v-model="password"
              type="password"
              autocomplete="new-password"
              placeholder="••••••••"
              class="w-full bg-white border rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              :class="erroresValidacion.password
                ? 'border-rose-300 focus:border-rose-500'
                : 'border-slate-200 focus:border-blue-500'"
            />
            
            <!-- Validador visual -->
            <div class="mt-2 space-y-1">
              <p class="text-xs font-medium flex items-center gap-1" :class="password.length >= 8 ? 'text-emerald-600' : 'text-slate-400'">
                <span>{{ password.length >= 8 ? '✓' : '○' }}</span> Al menos 8 caracteres
              </p>
              <p class="text-xs font-medium flex items-center gap-1" :class="/[A-Z]/.test(password) ? 'text-emerald-600' : 'text-slate-400'">
                <span>{{ /[A-Z]/.test(password) ? '✓' : '○' }}</span> Una letra mayúscula
              </p>
              <p class="text-xs font-medium flex items-center gap-1" :class="/[a-z]/.test(password) ? 'text-emerald-600' : 'text-slate-400'">
                <span>{{ /[a-z]/.test(password) ? '✓' : '○' }}</span> Una letra minúscula
              </p>
              <p class="text-xs font-medium flex items-center gap-1" :class="/[0-9]/.test(password) ? 'text-emerald-600' : 'text-slate-400'">
                <span>{{ /[0-9]/.test(password) ? '✓' : '○' }}</span> Un número
              </p>
            </div>
            <p v-if="erroresValidacion.password" class="text-xs text-rose-500 mt-1.5 font-bold">
              {{ erroresValidacion.password }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1.5">
              Confirmar contraseña
            </label>
            <input
              v-model="password2"
              type="password"
              autocomplete="new-password"
              placeholder="••••••••"
              class="w-full bg-white border rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              :class="erroresValidacion.password2
                ? 'border-rose-300 focus:border-rose-500'
                : 'border-slate-200 focus:border-blue-500'"
            />
            <p v-if="erroresValidacion.password2" class="text-xs text-rose-500 mt-1.5 font-bold">
              {{ erroresValidacion.password2 }}
            </p>
          </div>

          <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl px-4 py-3 flex items-start gap-2 font-semibold">
            <span class="font-bold">!</span>
            <span>{{ error }}</span>
          </div>

          <div v-if="ok" class="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2 font-semibold">
            <span class="font-bold">✓</span>
            <span>Contraseña actualizada correctamente. Redirigiendo...</span>
          </div>

          <BaseButton 
            type="submit" 
            variant="primary" 
            size="lg" 
            block 
            :loading="cargando"
            :disabled="ok"
          >
            {{ ok ? 'Contraseña actualizada' : 'Guardar contraseña' }}
          </BaseButton>

          <div class="text-center pt-2">
            <RouterLink 
              to="/login" 
              class="text-sm text-blue-500 hover:text-blue-600 font-bold"
            >
              ← Volver al inicio de sesión
            </RouterLink>
          </div>

        </form>

        <p class="text-xs text-slate-400 text-center mt-8 font-medium">
          © {{ new Date().getFullYear() }} Inventario TI · By Ever García
        </p>

      </div>
    </div>

    <!-- Derecha: Panel decorativo -->
    <div class="hidden lg:flex relative bg-blue-100/50 overflow-hidden border-l border-white">
      <div class="absolute inset-0 opacity-40">
        <div class="absolute top-10 left-10 w-64 h-64 rounded-full bg-blue-200 blur-3xl"></div>
        <div class="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-sky-200 blur-3xl"></div>
      </div>

      <div class="relative z-10 flex flex-col justify-center items-center p-12 w-full text-center">
        <div class="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white max-w-md">
          <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-4">
            🔑
          </div>
          <h3 class="text-xl font-bold text-slate-800 mb-2">Crea una contraseña segura</h3>
          <p class="text-sm text-slate-600 font-medium leading-relaxed">
            Usa al menos 8 caracteres con mayúsculas, minúsculas y números. Una contraseña fuerte protege tu información y la de la institución.
          </p>
        </div>
      </div>
    </div>

  </div>
</template> 