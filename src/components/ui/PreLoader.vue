<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

// Controla si el preloader se muestra
const visible = ref(false)

// Progreso de la barra
const progreso = ref(0)

// Índice del nombre activo
const nombreActual = ref(0)

// Nombres a mostrar
const nombres = [
  'TSU. Ever Garcia',
  'TSU. Andres Martinez',
  'Licdo. Jorge Fernandez'
]

let intervaloCarga = null
let intervaloNombres = null

onMounted(() => {
  // 1. Verificar si ya se mostró el preloader en esta sesión
  const yaMostrado = sessionStorage.getItem('preloader_mostrado')

  if (!yaMostrado) {
    // Si no se ha mostrado, lo activamos
    visible.value = true
    
    // 2. Simular progreso de carga
    intervaloCarga = setInterval(() => {
      if (progreso.value < 100) {
        progreso.value += Math.floor(Math.random() * 6) + 4
        if (progreso.value > 100) progreso.value = 100
      } else {
        clearInterval(intervaloCarga)
        // Esperar un poco y ocultar
        setTimeout(() => {
          visible.value = false
          // Marcar como mostrado en esta sesión
          sessionStorage.setItem('preloader_mostrado', 'true')
        }, 600)
      }
    }, 190)

    // 3. Rotar nombres cada 900ms
    intervaloNombres = setInterval(() => {
      nombreActual.value = (nombreActual.value + 1) % nombres.length
    }, 900)
  }
})

onUnmounted(() => {
  if (intervaloCarga) clearInterval(intervaloCarga)
  if (intervaloNombres) clearInterval(intervaloNombres)
})

// Clase de posición para el carrusel
const nombreActivo = computed(() => nombres[nombreActual.value])
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-blue-900 overflow-hidden"
      >
        <!-- Decoración de fondo -->
        <div class="absolute inset-0 opacity-15 pointer-events-none">
          <div class="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div class="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-700 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>

        <!-- Logo circular animado -->
        <div class="relative z-10 wave-animation mb-10">
          <div class="w-44 h-44 rounded-full border-4 border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.6)] overflow-hidden bg-white flex items-center justify-center">
            <img
              src="/logito.png"
              alt="Inventario TI"
              class="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>

        <!-- Barra de carga -->
        <div class="relative z-10 w-72 h-2.5 bg-blue-950 rounded-full overflow-hidden mb-12 shadow-inner">
          <div
            class="h-full bg-blue-400 transition-all duration-200 ease-out rounded-full shadow-[0_0_10px_rgba(96,165,250,0.8)]"
            :style="{ width: `${progreso}%` }"
          ></div>
        </div>

        <!-- Carrusel de nombres (solo uno visible a la vez) -->
        <div class="relative z-10 h-16 w-full max-w-md flex items-center justify-center overflow-hidden">
          <Transition name="slide" mode="out-in">
            <p
              :key="nombreActual"
              class="text-2xl font-bold text-white tracking-widest drop-shadow-lg"
            >
              {{ nombreActivo }}
            </p>
          </Transition>
        </div>

        <!-- Texto inferior -->
        <p class="absolute bottom-10 text-blue-300 text-xs font-semibold tracking-[0.3em] uppercase">
          Gestión de Equipos TI
        </p>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Animación de flotación suave */
.wave-animation {
  animation: wave 2.5s ease-in-out infinite;
}

@keyframes wave {
  0% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-15px) scale(1.05);
  }
  100% {
    transform: translateY(0px) scale(1);
  }
}

/* Transición de entrada/salida del nombre (carrusel) */
.slide-enter-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from {
  transform: translateX(40px);
  opacity: 0;
}
.slide-leave-to {
  transform: translateX(-40px);
  opacity: 0;
}

/* Fade general para ocultar el preloader */
.fade-leave-active {
  transition: opacity 0.8s ease;
}
.fade-leave-to {
  opacity: 0;
}
</style>