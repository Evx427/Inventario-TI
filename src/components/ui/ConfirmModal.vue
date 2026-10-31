<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '¡Cuidado!' },
  message: { type: String, default: '¿Estás seguro de realizar esta acción?' },
  confirmText: { type: String, default: 'Sí, eliminar' },
  cancelText: { type: String, default: 'Cancelar' },
})

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm"
      @click.self="emit('cancel')"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-center border border-slate-100">
        <div class="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-2xl mx-auto mb-4">
          ⚠️
        </div>
        <h3 class="text-xl font-bold text-slate-800 mb-2">{{ title }}</h3>
        <p class="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
          {{ message }}
        </p>
        <div class="flex gap-3 justify-center">
          <button
            class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all text-sm w-full"
            @click="emit('cancel')"
          >
            {{ cancelText }}
          </button>
          <button
            class="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all text-sm shadow-md shadow-rose-500/30 w-full"
            @click="emit('confirm')"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>