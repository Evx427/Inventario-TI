<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const visible = ref(false)
const progreso = ref(0)
const lineasTerminal = ref([])
const lineaActual = ref(0)

// Textos que aparecerán letra por letra, estilo "boot sequence"
const textosBoot = [
  '> INICIANDO SISTEMA DE INVENTARIO...',
  '> CARGANDO MÓDULOS DE SEGURIDAD...',
  '> VERIFICANDO CONEXIÓN CON SUPABASE...',
  '> AUTENTICANDO CREDENCIALES...',
  '> ESTABLECIENDO ENLACE ENCRIPTADO...',
  '> SISTEMA LISTO. BIENVENIDO, OPERADOR.',
]

let intervaloCarga = null
let intervaloTexto = null

onMounted(() => {
  // Verificar si ya se mostró en esta sesión
  const yaMostrado = sessionStorage.getItem('preloader_mostrado')

  if (!yaMostrado) {
    visible.value = true

    // Animación de progreso (0 a 100 en ~3.5 segundos)
    intervaloCarga = setInterval(() => {
      if (progreso.value < 100) {
        progreso.value += Math.floor(Math.random() * 5) + 2
        if (progreso.value > 100) progreso.value = 100
      } else {
        clearInterval(intervaloCarga)
        setTimeout(() => {
          visible.value = false
          sessionStorage.setItem('preloader_mostrado', 'true')
        }, 800)
      }
    }, 100)

    // Animación de textos tipo terminal
    let indiceLetra = 0
    let indiceLinea = 0

    intervaloTexto = setInterval(() => {
      const lineaCompleta = textosBoot[indiceLinea]
      if (!lineaCompleta) {
        clearInterval(intervaloTexto)
        return
      }

      if (indiceLetra < lineaCompleta.length) {
        // Agregar letra a la línea actual
        if (!lineasTerminal.value[indiceLinea]) {
          lineasTerminal.value[indiceLinea] = ''
        }
        lineasTerminal.value[indiceLinea] += lineaCompleta[indiceLetra]
        indiceLetra++
      } else {
        // Pasar a la siguiente línea
        indiceLinea++
        indiceLetra = 0
        lineaActual.value = indiceLinea
      }
    }, 40) // Velocidad de escritura
  }
})

onUnmounted(() => {
  if (intervaloCarga) clearInterval(intervaloCarga)
  if (intervaloTexto) clearInterval(intervaloTexto)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#001e2b] overflow-hidden font-mono"
      >
        <!-- Rejilla de fondo sutil -->
        <div class="absolute inset-0 opacity-[0.05] pointer-events-none">
          <div class="absolute inset-0" style="background-image: linear-gradient(#00ed64 1px, transparent 1px), linear-gradient(90deg, #00ed64 1px, transparent 1px); background-size: 40px 40px;"></div>
        </div>

        <!-- Logo con efecto de pulso -->
        <div class="relative z-10 mb-12">
          <div class="w-24 h-24 rounded-full border-2 border-[#00ed64] flex items-center justify-center relative animate-pulse-slow">
            <div class="absolute inset-0 rounded-full border-2 border-[#00ed64] animate-ping-slow opacity-30"></div>
            <span class="text-[#00ed64] text-4xl font-bold">I</span>
          </div>
        </div>

        <!-- Textos de terminal -->
        <div class="relative z-10 w-full max-w-lg mb-8">
          <div class="space-y-2">
            <p
              v-for="(linea, i) in lineasTerminal"
              :key="i"
              class="text-sm text-[#00ed64] tracking-wider"
              :class="{ 'opacity-50': i < lineaActual }"
            >
              {{ linea }}<span v-if="i === lineaActual" class="inline-block w-2 h-4 bg-[#00ed64] ml-1 animate-blink align-middle"></span>
            </p>
          </div>
        </div>

        <!-- Barra de progreso con líneas de escaneo -->
        <div class="relative z-10 w-full max-w-lg mb-6">
          <div class="flex justify-between text-xs text-[#00ed64] mb-2 tracking-widest">
            <span>CARGANDO...</span>
            <span>{{ progreso }}%</span>
          </div>
          <div class="w-full h-1 bg-[#002b3b] rounded-full overflow-hidden relative">
            <div
              class="h-full bg-[#00ed64] transition-all duration-200 ease-out relative"
              :style="{ width: `${progreso}%` }"
            >
              <!-- Efecto de escaneo -->
              <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-scan"></div>
            </div>
          </div>
        </div>

        <!-- Créditos -->
        <div class="relative z-10 text-center space-y-1 text-[#5c6c75] text-xs tracking-widest">
          <p>TSU. EVER GARCIA</p>
          <p>TSU. ANDRES MARTINEZ</p>
          <p>LICDO. JORGE FERNANDEZ</p>
        </div>

        <!-- Esquinas decorativas (estilo HUD) -->
        <div class="absolute top-6 left-6 w-12 h-12 border-t-2 border-l-2 border-[#00ed64]/50"></div>
        <div class="absolute top-6 right-6 w-12 h-12 border-t-2 border-r-2 border-[#00ed64]/50"></div>
        <div class="absolute bottom-6 left-6 w-12 h-12 border-b-2 border-l-2 border-[#00ed64]/50"></div>
        <div class="absolute bottom-6 right-6 w-12 h-12 border-b-2 border-r-2 border-[#00ed64]/50"></div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Animación de fade general */
.fade-leave-active {
  transition: opacity 0.8s ease;
}
.fade-leave-to {
  opacity: 0;
}

/* Animación del cursor parpadeante */
@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
.animate-blink {
  animation: blink 1s step-end infinite;
}

/* Animación de la barra de escaneo */
@keyframes scan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}
.animate-scan {
  animation: scan 2s linear infinite;
}

/* Animación de pulso lento para el logo */
@keyframes pulseSlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 237, 100, 0.4); }
  50% { box-shadow: 0 0 30px 10px rgba(0, 237, 100, 0.1); }
}
.animate-pulse-slow {
  animation: pulseSlow 2s ease-in-out infinite;
}

/* Animación del anillo expansivo */
@keyframes pingSlow {
  0% { transform: scale(1); opacity: 0.5; }
  80%, 100% { transform: scale(1.5); opacity: 0; }
}
.animate-ping-slow {
  animation: pingSlow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>