<script setup>
import { computed } from 'vue'
import BaseButton from './BaseButton.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  equipo: { type: Object, default: null },
  puedeEditar: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'editar'])

// Filtrar hardware por tipo
const placa = computed(() => props.equipo?.hardware?.find(h => h.tipo === 'placa_base'))
const rams = computed(() => props.equipo?.hardware?.filter(h => h.tipo === 'ram') || [])
const discos = computed(() => props.equipo?.hardware?.filter(h => h.tipo === 'almacenamiento') || [])
const gpu = computed(() => props.equipo?.hardware?.find(h => h.tipo === 'gpu'))
const red = computed(() => props.equipo?.hardware?.find(h => h.tipo === 'red'))

function formatearFecha(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && equipo"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div class="bg-white rounded-2xl w-full max-w-3xl flex flex-col max-h-[90vh] shadow-2xl border border-slate-100">
        
        <!-- Cabecera -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
              💻
            </div>
            <div>
              <h2 class="text-lg font-bold text-slate-800">Detalles del Equipo</h2>
              <p class="text-xs font-semibold text-slate-500">Código: {{ equipo.codigo_bien_publico }}</p>
            </div>
          </div>
          <button class="text-slate-400 hover:text-slate-700 transition text-xl leading-none bg-white hover:bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center border border-slate-200" @click="emit('close')">
            ✕
          </button>
        </div>

        <!-- Cuerpo scrolleable -->
        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          
          <!-- Identificación y Datos -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-3">
              <h3 class="text-xs font-bold text-blue-500 uppercase tracking-wider border-b border-blue-100 pb-1">Identificación</h3>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <span class="text-slate-500 font-medium">Cód. Público:</span>
                <span class="font-bold text-slate-800">{{ equipo.codigo_bien_publico }}</span>
                <span class="text-slate-500 font-medium">Cód. Privado:</span>
                <span class="font-semibold text-slate-700">{{ equipo.codigo_bien_privado || '—' }}</span>
                <span class="text-slate-500 font-medium">Categoría:</span>
                <span class="font-semibold text-slate-700">{{ equipo.categorias?.nombre || '—' }}</span>
                <span class="text-slate-500 font-medium">Estado:</span>
                <span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border"
                    :class="{
                      'bg-emerald-50 text-emerald-600 border-emerald-200': equipo.estado === 'activo',
                      'bg-amber-50 text-amber-600 border-amber-200': equipo.estado === 'reparacion',
                      'bg-rose-50 text-rose-600 border-rose-200': equipo.estado === 'baja',
                    }">
                    {{ equipo.estado }}
                  </span>
                </span>
              </div>
            </div>

            <div class="space-y-3">
              <h3 class="text-xs font-bold text-blue-500 uppercase tracking-wider border-b border-blue-100 pb-1">Datos del Equipo</h3>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <span class="text-slate-500 font-medium">Marca:</span>
                <span class="font-semibold text-slate-700">{{ equipo.marca || '—' }}</span>
                <span class="text-slate-500 font-medium">Modelo:</span>
                <span class="font-semibold text-slate-700">{{ equipo.modelo || '—' }}</span>
                <span class="text-slate-500 font-medium">N° Serie:</span>
                <span class="font-mono text-xs font-semibold text-slate-700">{{ equipo.numero_serie || '—' }}</span>
                <span class="text-slate-500 font-medium">F. Registro:</span>
                <span class="font-semibold text-slate-700">{{ formatearFecha(equipo.fecha_registro) }}</span>
                <span class="text-slate-500 font-medium">F. Fabricación:</span>
                <span class="font-semibold text-slate-700">{{ formatearFecha(equipo.fecha_fabricacion) }}</span>
                <span class="text-slate-500 font-medium">Ubicación:</span>
                <span class="font-semibold text-slate-700">{{ equipo.ubicacion || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Notas -->
          <div v-if="equipo.notas" class="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-600 italic">
            "{{ equipo.notas }}"
          </div>

          <!-- Sistema Operativo (Solo si aplica) -->
          <div v-if="equipo.so_id" class="space-y-3">
            <h3 class="text-xs font-bold text-emerald-500 uppercase tracking-wider border-b border-emerald-100 pb-1">Sistema Operativo</h3>
            <div class="bg-emerald-50/50 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span class="block text-xs text-slate-500 font-medium">SO</span>
                <span class="font-bold text-slate-800">{{ equipo.sistemas_operativos?.nombre || '—' }}</span>
              </div>
              <div>
                <span class="block text-xs text-slate-500 font-medium">Versión Exacta</span>
                <span class="font-semibold text-slate-700">{{ equipo.so_version_exacta || '—' }}</span>
              </div>
              <div>
                <span class="block text-xs text-slate-500 font-medium">Compilación</span>
                <span class="font-semibold text-slate-700">{{ equipo.so_compilacion || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Hardware (Solo si hay componentes) -->
          <div v-if="equipo.hardware && equipo.hardware.length > 0" class="space-y-3">
            <h3 class="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-amber-100 pb-1">Hardware</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <!-- Placa Base -->
              <div v-if="placa" class="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm">
                <h4 class="font-bold text-slate-700 mb-2 flex items-center gap-2"><span class="text-lg">🔲</span> Placa Base</h4>
                <div class="grid grid-cols-2 gap-2">
                  <span class="text-slate-500">Marca:</span><span class="font-medium text-slate-800">{{ placa.marca || '—' }}</span>
                  <span class="text-slate-500">Modelo:</span><span class="font-medium text-slate-800">{{ placa.modelo || '—' }}</span>
                  <span class="text-slate-500">ID/Código:</span><span class="font-mono text-xs font-medium text-slate-800">{{ placa.identificador || '—' }}</span>
                </div>
              </div>

              <!-- RAM -->
              <div v-if="rams.length > 0" class="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm">
                <h4 class="font-bold text-slate-700 mb-2 flex items-center gap-2"><span class="text-lg">🧠</span> Memoria RAM</h4>
                <ul class="space-y-1">
                  <li v-for="(r, i) in rams" :key="i" class="flex justify-between border-b border-slate-200/50 pb-1 last:border-0">
                    <span class="text-slate-600">{{ r.tipo_ram }}</span>
                    <span class="font-bold text-slate-800">{{ r.cantidad_modulos }} módulo(s)</span>
                  </li>
                </ul>
              </div>

              <!-- Almacenamiento -->
              <div v-if="discos.length > 0" class="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm">
                <h4 class="font-bold text-slate-700 mb-2 flex items-center gap-2"><span class="text-lg">💾</span> Almacenamiento</h4>
                <ul class="space-y-1">
                  <li v-for="(d, i) in discos" :key="i" class="flex justify-between border-b border-slate-200/50 pb-1 last:border-0">
                    <span class="text-slate-600">{{ d.tipo_almacenamiento }}</span>
                    <span class="font-bold text-slate-800">{{ d.capacidad_gb }} GB</span>
                  </li>
                </ul>
              </div>

              <!-- GPU y Red -->
              <div v-if="gpu || red" class="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm space-y-3">
                <div v-if="gpu">
                  <h4 class="font-bold text-slate-700 mb-1 flex items-center gap-2"><span class="text-lg">🎮</span> Tarjeta Gráfica</h4>
                  <p class="text-slate-600">{{ gpu.marca }} {{ gpu.modelo }}</p>
                </div>
                <div v-if="red" class="pt-2 border-t border-slate-200/50">
                  <h4 class="font-bold text-slate-700 mb-1 flex items-center gap-2"><span class="text-lg">📡</span> Tarjeta de Red</h4>
                  <p class="text-slate-600">{{ red.marca }} {{ red.modelo }}</p>
                </div>
              </div>

            </div>
          </div>

        </div>

        <!-- Footer con acciones -->
        <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
          <BaseButton variant="cancel" @click="emit('close')">Cerrar</BaseButton>
          <BaseButton v-if="$attrs.puedeEditar" variant="secondary" @click="emit('editar', equipo)">Editar Datos</BaseButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>