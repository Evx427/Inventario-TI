<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import BaseButton from '../components/ui/BaseButton.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuth()

const email = ref('')
const password = ref('')
const error = ref('')
const cargando = ref(false)
const erroresValidacion = ref({ email: '', password: '' })

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
  <div class="min-h-screen w-full grid lg:grid-cols-2 bg-[#001e2b] font-sans">
    
    <!-- ========== IZQUIERDA: FORMULARIO ========== -->
    <div class="flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-md">
        
        <div class="flex items-center gap-3 mb-10">
          <div class="w-12 h-12 rounded-full bg-[#00ed64] flex items-center justify-center font-bold text-[#001e2b] text-xl">
            I
          </div>
          <div>
            <h1 class="text-xl font-bold text-white">Inventario TI</h1>
            <p class="text-sm text-[#00ed64] font-mono uppercase tracking-wider">Gestión de Activos TI</p>
          </div>
        </div>

        <h2 class="text-3xl font-bold text-white mb-2">Bienvenido de vuelta</h2>
        <p class="text-sm text-[#b8c4c2] mb-8">Ingresa tus credenciales para continuar.</p>

        <form class="space-y-6" @submit.prevent="onSubmit" novalidate>
          
          <!-- Email -->
          <div>
            <label class="block text-xs font-mono uppercase tracking-wider text-[#b8c4c2] mb-2">Correo electrónico</label>
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="tu@correo.com"
              class="w-full bg-transparent border rounded-full px-5 py-3 text-white placeholder-[#5c6c75] transition focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50"
              :class="erroresValidacion.email
                ? 'border-red-500'
                : 'border-[#00684a] focus:border-[#00ed64]'"
            />
            <p v-if="erroresValidacion.email" class="text-xs text-red-400 mt-1.5 font-mono">
              {{ erroresValidacion.email }}
            </p>
          </div>

          <!-- Password -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-xs font-mono uppercase tracking-wider text-[#b8c4c2]">Contraseña</label>
              <RouterLink to="/forgot-password" class="text-xs text-[#00ed64] hover:text-[#00ed64]/80 font-mono">
                ¿Olvidaste tu contraseña?
              </RouterLink>
            </div>
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full bg-transparent border rounded-full px-5 py-3 text-white placeholder-[#5c6c75] transition focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50"
              :class="erroresValidacion.password
                ? 'border-red-500'
                : 'border-[#00684a] focus:border-[#00ed64]'"
            />
            <p v-if="erroresValidacion.password" class="text-xs text-red-400 mt-1.5 font-mono">
              {{ erroresValidacion.password }}
            </p>
          </div>

          <!-- Error -->
          <div v-if="error" class="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3 flex items-start gap-2 font-mono">
            <span class="font-bold">!</span>
            <span>{{ error }}</span>
          </div>

          <!-- Botón -->
          <BaseButton
            type="submit"
            variant="primary"
            size="lg"
            block
            :loading="cargando"
            class="!bg-[#00ed64] !border-0 !text-[#001e2b] !font-bold !rounded-full hover:!bg-[#00ed64]/90 transition-all"
          >
            Iniciar Sesión
          </BaseButton>

          <p class="text-center text-sm text-[#b8c4c2] pt-2">
            ¿No tienes cuenta?
            <RouterLink to="/register" class="text-[#00ed64] hover:text-[#00ed64]/80 font-bold">
              Regístrate aquí
            </RouterLink>
          </p>
        </form>
      </div>
    </div>

    <!-- ========== DERECHA: FRASES FILOSÓFICAS ========== -->
    <div class="hidden lg:flex relative bg-[#00684a] overflow-hidden items-center justify-center p-12">
      
      <!-- Decoración sutil -->
      <div class="absolute inset-0 opacity-30">
        <div class="absolute top-20 left-20 w-64 h-64 bg-[#00ed64] rounded-full blur-3xl"></div>
        <div class="absolute bottom-20 right-20 w-96 h-96 bg-[#00ed64] rounded-full blur-3xl"></div>
      </div>

      <div class="relative z-10 max-w-lg text-center">
        <p class="text-[#00ed64] text-sm uppercase tracking-widest font-mono mb-6">Sabiduría Clásica</p>
        
        <transition name="fade" mode="out-in">
          <div :key="indiceFrase">
            <p class="text-3xl xl:text-4xl font-serif text-white leading-snug italic mb-6">
              "{{ fraseActual.texto }}"
            </p>
            <footer class="text-[#00ed64] text-xl font-bold">
              — {{ fraseActual.autor }}
            </footer>
          </div>
        </transition>

        <!-- Indicadores -->
        <div class="flex gap-2 justify-center mt-12">
          <span
            v-for="(_, i) in frases"
            :key="i"
            class="h-1.5 rounded-full transition-all duration-500"
            :class="i === indiceFrase ? 'bg-[#00ed64] w-8' : 'bg-white/30 w-3'"
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