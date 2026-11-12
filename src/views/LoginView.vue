<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import BaseButton from '../components/ui/BaseButton.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuth()

// --- Formulario ---
const email = ref('')
const password = ref('')
const error = ref('')
const cargando = ref(false)
const erroresValidacion = ref({ email: '', password: '' })

// --- Frases filosóficas ---
const frases = [
  { texto: 'Lo único que sé, es que no sé nada', autor: 'Sócrates' },
  { texto: 'Una vida sin examen no merece ser vivida', autor: 'Sócrates' },
  { texto: 'Conócete a ti mismo', autor: 'Sócrates' },
  { texto: 'El hombre es un ser en busca de sentido', autor: 'Sócrates' },
  { texto: 'Busco al hombre', autor: 'Diógenes' },
  { texto: 'No me quites lo que tengo, no me des lo que no tengo', autor: 'Diógenes' },
  { texto: 'La fortuna favorece a los valientes', autor: 'Alejandro Magno' },
  { texto: 'No vivo para mí, sino para la gloria de mis acciones', autor: 'Alejandro Magno' },
  { texto: 'Vine, vi, vencí', autor: 'Julio César' },
  { texto: 'La suerte está echada', autor: 'Julio César' },
  { texto: 'Encontré Roma de ladrillo, la dejo de mármol', autor: 'César Augusto' },
  { texto: 'La paciencia es la compañera de la sabiduría', autor: 'César Augusto' },
]

const indiceFrase = ref(0)
let intervaloFrase = null

const fraseActual = computed(() => frases[indiceFrase.value])

onMounted(() => {
  intervaloFrase = setInterval(() => {
    indiceFrase.value = (indiceFrase.value + 1) % frases.length
  }, 180000)
})

onUnmounted(() => {
  if (intervaloFrase) clearInterval(intervaloFrase)
})

// --- Validaciones ---
function validar() {
  erroresValidacion.value = { email: '', password: '' }
  let valido = true
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!email.value.trim()) {
    erroresValidacion.value.email = 'El correo es obligatorio.'
    valido = false
  } else if (!emailRegex.test(email.value.trim())) {
    erroresValidacion.value.email = 'Ingresa un correo válido.'
    valido = false
  }
  if (!password.value) {
    erroresValidacion.value.password = 'La contraseña es obligatoria.'
    valido = false
  } else if (password.value.length < 6) {
    erroresValidacion.value.password = 'Mínimo 6 caracteres.'
    valido = false
  }
  return valido
}

// --- Envío ---
async function onSubmit() {
  error.value = ''
  if (!validar()) return
  cargando.value = true
  const res = await auth.login(email.value.trim(), password.value)
  cargando.value = false
  if (!res.ok) {
    error.value = 'Credenciales de usuario y contraseña incorrectos, introduzca sus credenciales correctas.'
    return
  }
  const redirect = route.query.redirect || '/'
  router.push(redirect)
}
</script>

<template>
  <!-- Fondo con patrón de cuadrícula tipo juego retro -->
  <div class="min-h-screen w-full grid lg:grid-cols-2 bg-[#F4F1EA] font-sans">
    
    <!-- ========== IZQUIERDA: FORMULARIO ========== -->
    <div class="flex items-center justify-center px-6 py-12 bg-[#F4F1EA] relative overflow-hidden">
      
      <!-- Decoración de fondo (pixel art simple) -->
      <div class="absolute top-10 left-10 w-16 h-16 bg-[#D2B48C] border-4 border-black opacity-30"></div>
      <div class="absolute bottom-20 right-10 w-24 h-24 bg-[#556B2F] border-4 border-black opacity-20"></div>
      <div class="absolute top-1/2 right-5 w-8 h-8 bg-[#FF8C00] border-4 border-black opacity-40"></div>

      <div class="w-full max-w-md relative z-10">
        
        <!-- Logo con animación de flotación (bob) -->
        <div class="flex items-center gap-4 mb-8 animate-bounce">
          <div class="w-14 h-14 rounded-lg bg-[#FF8C00] border-4 border-black flex items-center justify-center font-bold text-2xl text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            I
          </div>
          <div>
            <h1 class="text-xl font-bold text-black font-pixel tracking-tight">INVENTARIO TI</h1>
            <p class="text-sm text-[#8B4513] font-bold">Gestión de Activos TI</p>
          </div>
        </div>

        <!-- Tarjeta de Login -->
        <div class="bg-white border-4 border-black rounded-lg p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          
          <h2 class="text-lg font-bold text-black font-pixel mb-1 uppercase">Iniciar Sesión</h2>
          <p class="text-sm text-[#8B4513] mb-6">Ingresa tus credenciales para continuar.</p>

          <form class="space-y-5" @submit.prevent="onSubmit" novalidate>
            <!-- Email -->
            <div>
              <label class="block text-xs font-bold text-black uppercase mb-1">Correo electrónico</label>
              <input
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="tu@correo.com"
                class="w-full bg-[#F4F1EA] border-2 rounded-md px-3 py-2.5 text-black placeholder-slate-400 transition focus:outline-none focus:ring-4"
                :class="erroresValidacion.email
                  ? 'border-red-500 focus:ring-red-300'
                  : 'border-black focus:ring-[#D2B48C] focus:border-black'"
              />
              <p v-if="erroresValidacion.email" class="text-xs text-red-600 mt-1 font-bold">
                {{ erroresValidacion.email }}
              </p>
            </div>

            <!-- Password -->
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="block text-xs font-bold text-black uppercase">Contraseña</label>
                <RouterLink to="/forgot-password" class="text-xs text-[#8B4513] hover:text-[#FF8C00] font-bold">
                  ¿Olvidaste tu contraseña?
                </RouterLink>
              </div>
              <input
                v-model="password"
                type="password"
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full bg-[#F4F1EA] border-2 rounded-md px-3 py-2.5 text-black placeholder-slate-400 transition focus:outline-none focus:ring-4"
                :class="erroresValidacion.password
                  ? 'border-red-500 focus:ring-red-300'
                  : 'border-black focus:ring-[#D2B48C] focus:border-black'"
              />
              <p v-if="erroresValidacion.password" class="text-xs text-red-600 mt-1 font-bold">
                {{ erroresValidacion.password }}
              </p>
            </div>

            <!-- Error General -->
            <div v-if="error" class="bg-red-100 border-2 border-red-500 text-red-700 text-sm rounded-md px-3 py-2.5 flex items-start gap-2 font-bold">
              <span class="text-lg leading-none">!</span>
              <span>{{ error }}</span>
            </div>

            <!-- Botón estilo arcade -->
            <BaseButton
              type="submit"
              variant="primary"
              size="lg"
              block
              :loading="cargando"
              class="!bg-[#FF8C00] !border-4 !border-black !rounded-md !text-black !font-bold !shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:!translate-y-[2px] hover:!shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              INGRESAR
            </BaseButton>

            <p class="text-center text-sm text-[#8B4513] pt-2 font-bold">
              ¿No tienes cuenta?
              <RouterLink to="/register" class="text-[#556B2F] hover:text-[#FF8C00] underline">
                Regístrate aquí
              </RouterLink>
            </p>
          </form>
        </div>
      </div>
    </div>

    <!-- ========== DERECHA: FRASES FILOSÓFICAS ========== -->
    <div class="hidden lg:flex relative bg-[#8B4513] overflow-hidden border-l-4 border-black">
      
      <!-- Decoración pixel art -->
      <div class="absolute inset-0 opacity-20">
        <div class="absolute top-10 left-10 w-32 h-32 bg-[#D2B48C] rounded-full blur-3xl"></div>
        <div class="absolute bottom-10 right-10 w-64 h-64 bg-[#556B2F] rounded-full blur-3xl"></div>
      </div>

      <div class="relative z-10 flex flex-col justify-between p-12 w-full">
        
        <!-- Encabezado -->
        <div>
          <p class="text-[#DAA520] text-sm uppercase tracking-widest font-bold font-pixel">Sabiduría Clásica</p>
        </div>

        <!-- Frase estilo "Diálogo de Videojuego" -->
        <div class="flex-1 flex items-center">
          <transition name="fade" mode="out-in">
            <div :key="indiceFrase" class="max-w-lg">
              <div class="bg-[#F4F1EA] border-4 border-black rounded-lg p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
                <!-- Flechita del cuadro de diálogo -->
                <div class="absolute -bottom-3 left-10 w-6 h-6 bg-[#F4F1EA] border-b-4 border-r-4 border-black transform rotate-45"></div>
                
                <p class="text-xl text-black leading-snug italic font-bold">
                  "{{ fraseActual.texto }}"
                </p>
                <footer class="mt-4 text-[#8B4513] text-lg font-bold text-right">
                  — {{ fraseActual.autor }}
                </footer>
                
                <!-- Cursor parpadeante -->
                <span class="inline-block w-2 h-5 bg-black ml-2 animate-pulse align-middle"></span>
              </div>
            </div>
          </transition>
        </div>

        <!-- Indicadores -->
        <div class="flex gap-2">
          <span
            v-for="(_, i) in frases"
            :key="i"
            class="h-2 rounded-sm border-2 border-black transition-all duration-500"
            :class="i === indiceFrase ? 'bg-[#FF8C00] w-8' : 'bg-[#D2B48C] w-3'"
          ></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>