<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'danger', 'warning', 'ghost', 'cancel'].includes(v),
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
})

const emit = defineEmits(['click'])

const classes = computed(() => {
  const base = 'inline-flex items-center justify-center gap-2 font-bold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#001e2b] disabled:opacity-50 disabled:cursor-not-allowed'
  
  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3 text-base',
  }
  
  const variants = {
    // Verde Neón - acción principal
    primary: 'bg-[#00ed64] hover:bg-[#00ed64]/90 text-[#001e2b] focus:ring-[#00ed64]/50',
    // Secundario (outline) - acción secundaria
    secondary: 'bg-transparent border border-[#5c6c75] hover:border-[#00ed64] hover:text-[#00ed64] text-[#b8c4c2] focus:ring-[#00ed64]/50',
    // Rojo - destructiva
    danger: 'bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 text-red-400 focus:ring-red-500/50',
    // Ámbar - advertencia
    warning: 'bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-400 focus:ring-amber-500/50',
    // Ghost - terciaria
    ghost: 'bg-transparent hover:bg-[#00ed64]/10 text-[#b8c4c2] hover:text-[#00ed64] focus:ring-[#00ed64]/50',
    // Cancelar - gris
    cancel: 'bg-[#5c6c75]/20 border border-[#5c6c75]/40 hover:bg-[#5c6c75]/30 text-[#b8c4c2] focus:ring-[#5c6c75]/50',
  }
  
  return [base, sizes[props.size], variants[props.variant], props.block ? 'w-full' : ''].join(' ')
})

function onClick(event) {
  if (!props.disabled && !props.loading) emit('click', event)
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="classes"
    @click="onClick"
  >
    <svg v-if="loading" class="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
    <slot />
  </button>
</template>