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
  const base = 'inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }
  const variants = {
    // Registro / Guardar (Verde)
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/30 focus:ring-emerald-400',
    // Modificar / Editar (Azul)
    secondary: 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm shadow-blue-500/30 focus:ring-blue-400',
    // Eliminar (Rojo)
    danger: 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm shadow-rose-500/30 focus:ring-rose-400',
    // Advertencia (Ámbar)
    warning: 'bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-sm focus:ring-amber-300',
    // Cancelar / Volver (Gris suave)
    cancel: 'bg-slate-100 hover:bg-slate-200 text-slate-600 focus:ring-slate-300',
    // Ghost
    ghost: 'bg-transparent hover:bg-blue-50 text-blue-600 focus:ring-blue-400',
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