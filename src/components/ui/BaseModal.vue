<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: { type: String, default: 'lg' },
})

const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div
        class="bg-[#001e2b] border border-[#00684a]/50 rounded-2xl w-full flex flex-col max-h-[90vh] shadow-2xl shadow-black/50"
        :class="{
          'max-w-md': size === 'sm',
          'max-w-lg': size === 'md',
          'max-w-3xl': size === 'lg',
          'max-w-5xl': size === 'xl',
        }"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-[#00684a]/30">
          <h2 class="text-lg font-bold text-white">{{ title }}</h2>
          <button 
            class="text-[#b8c4c2] hover:text-[#00ed64] transition text-xl leading-none w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#00ed64]/10" 
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto flex-1">
          <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="px-6 py-4 border-t border-[#00684a]/30 flex justify-end gap-3">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>