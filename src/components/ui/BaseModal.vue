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
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div
        class="bg-white rounded-2xl w-full flex flex-col max-h-[90vh] shadow-2xl border border-slate-100"
        :class="{
          'max-w-md': size === 'sm',
          'max-w-lg': size === 'md',
          'max-w-3xl': size === 'lg',
          'max-w-5xl': size === 'xl',
        }"
      >
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 class="text-lg font-bold text-slate-800">{{ title }}</h2>
          <button class="text-slate-400 hover:text-slate-700 transition text-xl leading-none bg-slate-50 hover:bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center" @click="emit('close')">
            ✕
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1">
          <slot />
        </div>

        <div v-if="$slots.footer" class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>