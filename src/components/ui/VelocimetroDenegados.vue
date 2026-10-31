<script setup>
import { computed } from 'vue'

const props = defineProps({
  valor: { type: Number, default: 0 },
  maximo: { type: Number, default: 20 },
})

// Calcular ángulo de la aguja (de -90° a 90°)
const angulo = computed(() => {
  const porcentaje = Math.min(props.valor / props.maximo, 1)
  return -90 + (porcentaje * 180)
})

const colorAguja = computed(() => {
  const p = props.valor / props.maximo
  if (p < 0.3) return '#10b981' // verde
  if (p < 0.6) return '#f59e0b' // ámbar
  return '#ef4444' // rojo
})

const colorZona = computed(() => {
  const p = props.valor / props.maximo
  if (p < 0.3) return 'text-emerald-500'
  if (p < 0.6) return 'text-amber-500'
  return 'text-rose-500'
})
</script>

<template>
  <div class="flex flex-col items-center">
    <div class="relative w-48 h-28 overflow-hidden">
      <!-- Semicírculo de fondo -->
      <svg viewBox="0 0 200 110" class="w-full h-full">
        <!-- Zonas de color -->
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#10b981" />
            <stop offset="50%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#ef4444" />
          </linearGradient>
        </defs>

        <!-- Arco exterior -->
        <path 
          d="M 20 100 A 80 80 0 0 1 180 100" 
          fill="none" 
          stroke="url(#gaugeGradient)" 
          stroke-width="18" 
          stroke-linecap="round"
          opacity="0.3"
        />
        
        <!-- Marcas -->
        <g stroke="#94a3b8" stroke-width="2">
          <line x1="20" y1="100" x2="28" y2="100" />
          <line x1="40" y1="45" x2="46" y2="52" />
          <line x1="100" y1="20" x2="100" y2="30" />
          <line x1="160" y1="45" x2="154" y2="52" />
          <line x1="180" y1="100" x2="172" y2="100" />
        </g>

        <!-- Aguja -->
        <g :transform="`rotate(${angulo} 100 100)`">
          <line 
            x1="100" y1="100" 
            x2="100" y2="35" 
            :stroke="colorAguja" 
            stroke-width="4" 
            stroke-linecap="round"
          />
          <circle cx="100" cy="100" r="8" fill="#1e293b" />
          <circle cx="100" cy="100" r="4" fill="white" />
        </g>
      </svg>
    </div>
    
    <div class="text-center mt-2">
      <p class="text-3xl font-bold" :class="colorZona">{{ valor }}</p>
      <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
        Intentos denegados
      </p>
    </div>
  </div>
</template>