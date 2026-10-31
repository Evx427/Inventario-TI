<script setup>
import { computed } from 'vue'

const props = defineProps({
  datos: { type: Object, default: () => ({}) },
})

const items = computed(() => {
  const entries = Object.entries(props.datos).sort((a, b) => b[1] - a[1]).slice(0, 6)
  const max = Math.max(...entries.map(([, v]) => v), 1)
  return entries.map(([label, value]) => ({
    label,
    value,
    porcentaje: (value / max) * 100,
  }))
})

const colores = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-cyan-500',
]
</script>

<template>
  <div class="space-y-3">
    <div v-if="items.length === 0" class="text-center text-slate-400 text-sm py-8">
      Sin datos disponibles
    </div>
    <div v-for="(item, i) in items" :key="item.label" class="space-y-1.5">
      <div class="flex items-center justify-between text-sm">
        <span class="font-medium text-slate-700">{{ item.label }}</span>
        <span class="font-bold text-slate-800">{{ item.value }}</span>
      </div>
      <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          :class="colores[i % colores.length]" 
          class="h-full rounded-full transition-all duration-500"
          :style="{ width: `${item.porcentaje}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>