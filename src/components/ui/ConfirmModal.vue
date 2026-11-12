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
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="emit('cancel')"
    >
      <div class="bg-[#001e2b] border border-[#00684a]/50 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center">
        
        <!-- Icono de advertencia -->
        <div class="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-3xl mx-auto mb-4 border border-red-500/30">
          ⚠️
        </div>
        
        <h3 class="text-xl font-bold text-white mb-2">{{ title }}</h3>
        <p class="text-sm text-[#b8c4c2] mb-6 leading-relaxed">
          {{ message }}
        </p>
        
        <div class="flex gap-3 justify-center">
          <button
            class="px-6 py-2.5 rounded-full bg-transparent border border-[#5c6c75] text-[#b8c4c2] hover:text-white font-bold transition-all text-sm w-full"
            @click="emit('cancel')"
          >
            {{ cancelText }}
          </button>
          <button
            class="px-6 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold transition-all text-sm w-full"
            @click="emit('confirm')"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>