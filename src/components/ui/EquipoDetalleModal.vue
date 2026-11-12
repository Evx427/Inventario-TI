<script setup>
import { computed } from 'vue'
import BaseButton from './BaseButton.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  equipo: { type: Object, default: null },
  puedeEditar: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'editar'])

const placa = computed(() => props.equipo?.hardware?.find(h => h.tipo === 'placa_base'))
const rams = computed(() => props.equipo?.hardware?.filter(h => h.tipo === 'ram') || [])
const discos = computed(() => props.equipo?.hardware?.filter(h => h.tipo === 'almacenamiento') || [])
const gpu = computed(() => props.equipo?.hardware?.find(h => h.tipo === 'gpu'))
const red = computed(() => props.equipo?.hardware?.find(h => h.tipo === 'red'))
const perifericos = computed(() => props.equipo?.perifericos || [])

function formatearFecha(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && equipo"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div class="bg-[#001e2b] border border-[#00684a]/50 rounded-2xl w-full max-w-3xl flex flex-col max-h-[90vh] shadow-2xl shadow-black/50">
        
        <!-- Cabecera -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-[#00684a]/30 bg-[#002b3b] rounded-t-2xl">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-[#00ed64]/20 text-[#00ed64] border border-[#00ed64]/50 flex items-center justify-center font-bold text-lg">
              💻
            </div>
            <div>
              <h2 class="text-lg font-bold text-white">Detalles del Equipo</h2>
              <p class="text-xs font-mono text-[#00ed64]">Código: {{ equipo.codigo_bien_publico }}</p>
            </div>
          </div>
          <button class="text-[#b8c4c2] hover:text-[#00ed64] transition text-xl leading-none w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#00ed64]/10" @click="emit('close')">
            ✕
          </button>
        </div>

        <!-- Cuerpo -->
        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Identificación -->
            <div class="space-y-3">
              <h3 class="text-xs font-bold text-[#00ed64] uppercase tracking-wider font-mono border-b border-[#00684a]/30 pb-1">Identificación</h3>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <span class="text-[#5c6c75] font-medium">Cód. Público:</span>
                <span class="font-bold text-white">{{ equipo.codigo_bien_publico }}</span>
                <span class="text-[#5c6c75] font-medium">Cód. Privado:</span>
                <span class="font-semibold text-[#b8c4c2]">{{ equipo.codigo_bien_privado || '—' }}</span>
                <span class="text-[#5c6c75] font-medium">Categoría:</span>
                <span class="font-semibold text-[#b8c4c2]">{{ equipo.categorias?.nombre || '—' }}</span>
                <span class="text-[#5c6c75] font-medium">Estado:</span>
                <span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border"
                    :class="{
                      'bg-[#00ed64]/10 text-[#00ed64] border-[#00ed64]/30': equipo.estado === 'activo',
                      'bg-amber-500/10 text-amber-400 border-amber-500/30': equipo.estado === 'reparacion',
                      'bg-red-500/10 text-red-400 border-red-500/30': equipo.estado === 'baja',
                    }">
                    {{ equipo.estado }}
                  </span>
                </span>
              </div>
            </div>

            <!-- Datos -->
            <div class="space-y-3">
              <h3 class="text-xs font-bold text-[#00ed64] uppercase tracking-wider font-mono border-b border-[#00684a]/30 pb-1">Datos del Equipo</h3>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <span class="text-[#5c6c75] font-medium">Marca:</span>
                <span class="font-semibold text-[#b8c4c2]">{{ equipo.marca || '—' }}</span>
                <span class="text-[#5c6c75] font-medium">Modelo:</span>
                <span class="font-semibold text-[#b8c4c2]">{{ equipo.modelo || '—' }}</span>
                <span class="text-[#5c6c75] font-medium">N° Serie:</span>
                <span class="font-mono text-xs font-semibold text-[#b8c4c2]">{{ equipo.numero_serie || '—' }}</span>
                <span class="text-[#5c6c75] font-medium">F. Registro:</span>
                <span class="font-semibold text-[#b8c4c2]">{{ formatearFecha(equipo.fecha_registro) }}</span>
                <span class="text-[#5c6c75] font-medium">Ubicación:</span>
                <span class="font-semibold text-[#b8c4c2]">{{ equipo.ubicacion || '—' }}</span>
              </div>
            </div>
          </div>

          <!-- Notas -->
          <div v-if="equipo.notas" class="bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-3 text-sm text-[#b8c4c2] italic">
            "{{ equipo.notas }}"
          </div>

          <!-- Hardware -->
          <div v-if="equipo.hardware && equipo.hardware.length > 0" class="space-y-3">
            <h3 class="text-xs font-bold text-[#00ed64] uppercase tracking-wider font-mono border-b border-[#00684a]/30 pb-1">Hardware</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-if="placa" class="bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-4 text-sm">
                <h4 class="font-bold text-white mb-2">Placa Base</h4>
                <div class="grid grid-cols-2 gap-2 text-[#b8c4c2]">
                  <span class="text-[#5c6c75]">Marca:</span><span>{{ placa.marca || '—' }}</span>
                  <span class="text-[#5c6c75]">Modelo:</span><span>{{ placa.modelo || '—' }}</span>
                  <span class="text-[#5c6c75]">ID:</span><span class="font-mono text-xs">{{ placa.identificador || '—' }}</span>
                </div>
              </div>

              <div v-if="rams.length > 0" class="bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-4 text-sm">
                <h4 class="font-bold text-white mb-2">Memoria RAM</h4>
                <ul class="space-y-1 text-[#b8c4c2]">
                  <li v-for="(r, i) in rams" :key="i" class="flex justify-between border-b border-[#00684a]/20 pb-1 last:border-0">
                    <span>{{ r.tipo_ram }}</span>
                    <span class="font-bold">{{ r.cantidad_modulos }} módulo(s)</span>
                  </li>
                </ul>
              </div>

              <div v-if="discos.length > 0" class="bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-4 text-sm">
                <h4 class="font-bold text-white mb-2">Almacenamiento</h4>
                <ul class="space-y-1 text-[#b8c4c2]">
                  <li v-for="(d, i) in discos" :key="i" class="flex justify-between border-b border-[#00684a]/20 pb-1 last:border-0">
                    <span>{{ d.tipo_almacenamiento }}</span>
                    <span class="font-bold">{{ d.capacidad_gb }} GB</span>
                  </li>
                </ul>
              </div>

              <div v-if="gpu || red" class="bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-4 text-sm space-y-3">
                <div v-if="gpu">
                  <h4 class="font-bold text-white mb-1">Tarjeta Gráfica</h4>
                  <p class="text-[#b8c4c2]">{{ gpu.marca }} {{ gpu.modelo }}</p>
                </div>
                <div v-if="red" class="pt-2 border-t border-[#00684a]/20">
                  <h4 class="font-bold text-white mb-1">Tarjeta de Red</h4>
                  <p class="text-[#b8c4c2]">{{ red.marca }} {{ red.modelo }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Periféricos -->
          <div v-if="perifericos.length > 0" class="space-y-3">
            <h3 class="text-xs font-bold text-[#00ed64] uppercase tracking-wider font-mono border-b border-[#00684a]/30 pb-1">Periféricos Asociados</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-for="p in perifericos" :key="p.id" class="bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-4 text-sm">
                <div class="flex justify-between items-center mb-2">
                  <h4 class="font-bold text-white capitalize">{{ p.tipo }}</h4>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border"
                    :class="{
                      'bg-[#00ed64]/10 text-[#00ed64] border-[#00ed64]/30': p.estado === 'bueno',
                      'bg-amber-500/10 text-amber-400 border-amber-500/30': p.estado === 'medio',
                      'bg-red-500/10 text-red-400 border-red-500/30': p.estado === 'malo',
                    }">
                    {{ p.estado }}
                  </span>
                </div>
                <p class="text-[#b8c4c2]">{{ p.marca }} {{ p.modelo }}</p>
                <p v-if="p.conexion_video" class="text-xs text-[#5c6c75] mt-1 font-mono">Conexión: {{ p.conexion_video }}</p>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-[#00684a]/30 flex justify-end gap-3 bg-[#002b3b] rounded-b-2xl">
          <BaseButton variant="cancel" @click="emit('close')">Cerrar</BaseButton>
          <BaseButton v-if="puedeEditar" variant="secondary" @click="emit('editar', equipo)">Editar Datos</BaseButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>