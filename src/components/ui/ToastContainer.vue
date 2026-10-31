<script setup>
import { useNotificacionesStore } from '../../stores/notificaciones'

const store = useNotificacionesStore()

const estilosPorTipo = {
  exito: {
    bg: 'bg-white',
    border: 'border-emerald-200',
    text: 'text-slate-800',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-600',
    icono: '✓',
  },
  error: {
    bg: 'bg-white',
    border: 'border-rose-200',
    text: 'text-slate-800',
    iconBg: 'bg-rose-100',
    iconText: 'text-rose-600',
    icono: '✕',
  },
  advertencia: {
    bg: 'bg-white',
    border: 'border-amber-200',
    text: 'text-slate-800',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
    icono: '!',
  },
  info: {
    bg: 'bg-white',
    border: 'border-orange-200',
    text: 'text-slate-800',
    iconBg: 'bg-orange-100',
    iconText: 'text-orange-600',
    icono: 'i',
  },
}
</script>

<template>
  <!-- Contenedor fijo abajo a la derecha -->
  <Teleport to="body">
    <div class="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-80 pointer-events-none">
      
      <transition-group name="toast">
        <div
          v-for="n in store.notificaciones"
          :key="n.id"
          class="pointer-events-auto relative overflow-hidden rounded-xl border shadow-lg flex items-center gap-4 px-4 py-3.5"
          :class="[
            estilosPorTipo[n.tipo].bg,
            estilosPorTipo[n.tipo].border,
            estilosPorTipo[n.tipo].text
          ]"
        >
          <!-- Las 2 líneas inclinadas minimalistas -->
          <div class="absolute inset-y-0 left-0 w-1.5 overflow-hidden">
            <div class="absolute inset-0 bg-current opacity-20"></div>
          </div>
          <div class="absolute inset-y-0 right-0 w-1.5 overflow-hidden">
             <div class="absolute inset-0 bg-current opacity-20"></div>
          </div>

          <!-- Icono -->
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
            :class="[estilosPorTipo[n.tipo].iconBg, estilosPorTipo[n.tipo].iconText]"
          >
            {{ estilosPorTipo[n.tipo].icono }}
          </div>

          <!-- Mensaje -->
          <p class="text-sm font-medium flex-1 leading-snug">
            {{ n.mensaje }}
          </p>

          <!-- Botón cerrar -->
          <button
            class="text-slate-400 hover:text-slate-600 transition shrink-0"
            @click="store.eliminar(n.id)"
          >
            ✕
          </button>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<style scoped>

/* Animaciones */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}
.toast-move {
  transition: transform 0.3s ease;
}
</style>