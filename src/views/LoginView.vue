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
    error.value = 'Mezcla de Usuario y Contraseña invalidos ¡ Intentelo nuevamente.'
    return
  }
  const redirect = route.query.redirect || '/'
  router.push(redirect)
}
</script>

<template>
  <div class="min-h-screen w-full grid lg:grid-cols-2 bg-blue-50/50">
    
    <!-- Izquierda: Formulario (Blanco suave) -->
    <div class="flex items-center justify-center px-6 py-12 bg-white/60 backdrop-blur-md">
      <div class="w-full max-w-md">
        <div class="flex items-center gap-3 mb-8">
          <div class="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center font-bold text-white text-xl shadow-sm shadow-blue-500/30">
            <img src="/logito.png" alt="Logo Inventario TI" class="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm shrink-0" />
            
          </div>
          <div>
            <h1 class="text-xl font-bold text-slate-800">Inventario TI</h1>
            <p class="text-xs text-blue-500 font-bold">Aplicacion Web para la Gestion de Equipos Informaticos</p>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-slate-800 mb-1">¡Bienvenido!</h2>
        <p class="text-sm text-slate-500 mb-6 font-medium">Ingresa tus credenciales para continuar.</p>

        <form class="space-y-5" @submit.prevent="onSubmit" novalidate>
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1.5">Correo electrónico</label>
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="tu@correo.com"
              class="w-full bg-white border rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              :class="erroresValidacion.email
                ? 'border-rose-300 focus:border-rose-500'
                : 'border-slate-200 focus:border-blue-500'"
            />
            <p v-if="erroresValidacion.email" class="text-xs text-rose-500 mt-1.5 font-bold">
              {{ erroresValidacion.email }}
            </p>
          </div>

          <div>
            <div class="flex justify-between items-center mb-1.5">
              <label class="text-sm font-bold text-slate-700">Contraseña</label>
              <RouterLink to="/forgot-password" class="text-xs text-blue-500 hover:text-blue-600 font-bold">
                ¿Olvidaste tu contraseña?
              </RouterLink>
            </div>
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••"
              class="w-full bg-white border rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 transition focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              :class="erroresValidacion.password
                ? 'border-rose-300 focus:border-rose-500'
                : 'border-slate-200 focus:border-blue-500'"
            />
            <p v-if="erroresValidacion.password" class="text-xs text-rose-500 mt-1.5 font-bold">
              {{ erroresValidacion.password }}
            </p>
          </div>

          <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-600 text-sm rounded-xl px-4 py-3 flex items-start gap-2 font-semibold">
            <span class="font-bold">!</span>
            <span>{{ error }}</span>
          </div>

          <BaseButton type="submit" variant="primary" size="lg" block :loading="cargando">
            Iniciar sesión
          </BaseButton>

          <p class="text-center text-sm text-slate-500 pt-2 font-medium">
            ¿No tienes cuenta? Contacta al admin para crearte una cuenta.
            <RouterLink to="/register" class="text-blue-500 hover:text-blue-600 font-bold">
            </RouterLink>
          </p>
        </form>
      </div>
    </div>

    <!-- Derecha: Frases -->
    <div class="hidden lg:flex relative bg-blue-100/50 overflow-hidden border-l border-white">
      <div class="absolute inset-0 opacity-40">
        <div class="absolute top-10 left-10 w-64 h-64 rounded-full bg-blue-200 blur-3xl"></div>
        <div class="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-sky-200 blur-3xl"></div>
      </div>

      <div class="relative z-10 flex flex-col justify-between p-12 w-full">
        <div>
        </div>

        <div class="flex-1 flex items-center">
          <transition name="fade" mode="out-in">
            <blockquote :key="indiceFrase" class="max-w-lg">
              <p class="text-3xl xl:text-4xl font-light text-slate-700 leading-snug italic">
                "{{ fraseActual.texto }}"
              </p>
              <footer class="mt-6 text-blue-600 text-lg font-bold">
                — {{ fraseActual.autor }}
              </footer>
            </blockquote>
          </transition>
        </div>

        <div class="flex gap-1.5">
          <span
            v-for="(_, i) in frases"
            :key="i"
            class="h-1.5 rounded-full transition-all duration-500"
            :class="i === indiceFrase ? 'bg-blue-400 w-8' : 'bg-blue-200 w-3'"
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