<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'
import BaseModal from '../components/ui/BaseModal.vue'

const equipos = ref([])
const cargando = ref(true)
const modalAbierto = ref(false)
const tituloModal = ref('')
const equiposFiltrados = ref([])

onMounted(async () => {
  await cargarEquipos()
})

async function cargarEquipos() {
  cargando.value = true
  const { data, error } = await supabase
    .from('equipos')
    .select(`*, categorias:categoria_id (nombre)`)
    .order('codigo_bien_publico')

  if (!error && data) {
    equipos.value = data
  }
  cargando.value = false
}

const totalEquipos = computed(() => equipos.value.length)
const totalActivos = computed(() => equipos.value.filter(e => e.estado === 'activo').length)
const totalReparacion = computed(() => equipos.value.filter(e => e.estado === 'reparacion').length)
const totalBaja = computed(() => equipos.value.filter(e => e.estado === 'baja').length)

function abrirModal(tipo) {
  if (tipo === 'total') {
    tituloModal.value = 'Todos los Equipos Registrados'
    equiposFiltrados.value = equipos.value
  } else if (tipo === 'activos') {
    tituloModal.value = 'Equipos Activos (Funcionales)'
    equiposFiltrados.value = equipos.value.filter(e => e.estado === 'activo')
  } else if (tipo === 'reparacion') {
    tituloModal.value = 'Equipos en Reparación'
    equiposFiltrados.value = equipos.value.filter(e => e.estado === 'reparacion')
  } else if (tipo === 'baja') {
    tituloModal.value = 'Equipos Dados de Baja'
    equiposFiltrados.value = equipos.value.filter(e => e.estado === 'baja')
  }
  modalAbierto.value = true
}

const conteoPorCategoria = computed(() => {
  const conteo = {}
  equipos.value.forEach(e => {
    const cat = e.categorias?.nombre || 'Sin categoría'
    conteo[cat] = (conteo[cat] || 0) + 1
  })
  return Object.entries(conteo).sort((a, b) => b[1] - a[1])
})

const conteoPorUbicacion = computed(() => {
  const conteo = {}
  equipos.value.forEach(e => {
    const ubi = e.ubicacion || 'Sin ubicación asignada'
    conteo[ubi] = (conteo[ubi] || 0) + 1
  })
  return Object.entries(conteo).sort((a, b) => b[1] - a[1])
})
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div>
      <h1 class="text-2xl font-bold text-white">Consultas de Inventario</h1>
      <p class="text-sm text-[#b8c4c2] mt-1">Visualiza el estado general de los equipos. Haz clic en una tarjeta para ver el detalle.</p>
    </div>

    <div v-if="cargando" class="p-12 text-center text-[#b8c4c2] animate-pulse">Cargando datos...</div>

    <div v-else class="space-y-8">
      <!-- Tarjetas de Estado -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div @click="abrirModal('total')" class="bg-[#001e2b] border border-[#00684a]/50 rounded-2xl p-6 shadow-lg shadow-black/20 cursor-pointer hover:border-[#00ed64]/50 hover:-translate-y-1 transition-all duration-200">
          <p class="text-xs font-bold text-[#5c6c75] uppercase tracking-wider font-mono">Total Equipos</p>
          <p class="text-4xl font-bold text-white mt-2">{{ totalEquipos }}</p>
          <p class="text-xs text-[#00ed64] font-semibold mt-4">Ver detalle →</p>
        </div>

        <div @click="abrirModal('activos')" class="bg-[#001e2b] border border-[#00ed64]/30 rounded-2xl p-6 shadow-lg shadow-black/20 cursor-pointer hover:border-[#00ed64] hover:-translate-y-1 transition-all duration-200">
          <p class="text-xs font-bold text-[#00ed64] uppercase tracking-wider font-mono">Funcionales (Activos)</p>
          <p class="text-4xl font-bold text-[#00ed64] mt-2">{{ totalActivos }}</p>
          <p class="text-xs text-[#00ed64] font-semibold mt-4">Ver detalle →</p>
        </div>

        <div @click="abrirModal('reparacion')" class="bg-[#001e2b] border border-amber-500/30 rounded-2xl p-6 shadow-lg shadow-black/20 cursor-pointer hover:border-amber-500 hover:-translate-y-1 transition-all duration-200">
          <p class="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">En Reparación</p>
          <p class="text-4xl font-bold text-amber-400 mt-2">{{ totalReparacion }}</p>
          <p class="text-xs text-amber-400 font-semibold mt-4">Ver detalle →</p>
        </div>

        <div @click="abrirModal('baja')" class="bg-[#001e2b] border border-red-500/30 rounded-2xl p-6 shadow-lg shadow-black/20 cursor-pointer hover:border-red-500 hover:-translate-y-1 transition-all duration-200">
          <p class="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">Dados de Baja</p>
          <p class="text-4xl font-bold text-red-400 mt-2">{{ totalBaja }}</p>
          <p class="text-xs text-red-400 font-semibold mt-4">Ver detalle →</p>
        </div>
      </div>

      <!-- Resúmenes -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-[#001e2b] border border-[#00684a]/30 rounded-2xl p-6 shadow-lg shadow-black/20">
          <h3 class="text-sm font-bold text-white uppercase tracking-wide mb-4 font-mono">Equipos por Categoría</h3>
          <div class="space-y-3 max-h-80 overflow-y-auto pr-2">
            <div v-for="[cat, cant] in conteoPorCategoria" :key="cat" class="flex items-center justify-between bg-[#002b3b] rounded-lg px-4 py-3 border border-[#00684a]/20">
              <span class="text-sm font-bold text-[#b8c4c2]">{{ cat }}</span>
              <span class="text-sm font-black text-[#001e2b] bg-[#00ed64] px-3 py-1 rounded-full shadow-sm">{{ cant }}</span>
            </div>
          </div>
        </div>

        <div class="bg-[#001e2b] border border-[#00684a]/30 rounded-2xl p-6 shadow-lg shadow-black/20">
          <h3 class="text-sm font-bold text-white uppercase tracking-wide mb-4 font-mono">Equipos por Ubicación</h3>
          <div class="space-y-3 max-h-80 overflow-y-auto pr-2">
            <div v-for="[ubi, cant] in conteoPorUbicacion" :key="ubi" class="flex items-center justify-between bg-[#002b3b] rounded-lg px-4 py-3 border border-[#00684a]/20">
              <span class="text-sm font-bold text-[#b8c4c2]">{{ ubi }}</span>
              <span class="text-sm font-black text-[#001e2b] bg-[#00ed64] px-3 py-1 rounded-full shadow-sm">{{ cant }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Detalle -->
    <BaseModal :open="modalAbierto" :title="tituloModal" size="xl" @close="modalAbierto = false">
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[800px]">
          <thead class="bg-[#002b3b] text-[#b8c4c2] text-left text-xs uppercase font-mono tracking-wider border-b border-[#00684a]/30">
            <tr>
              <th class="px-4 py-3 font-bold">Código</th>
              <th class="px-4 py-3 font-bold">Categoría</th>
              <th class="px-4 py-3 font-bold">Marca / Modelo</th>
              <th class="px-4 py-3 font-bold">Ubicación</th>
              <th class="px-4 py-3 font-bold">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#00684a]/20">
            <tr v-for="eq in equiposFiltrados" :key="eq.codigo_bien_publico" class="hover:bg-[#00ed64]/5 transition-colors">
              <td class="px-4 py-3 font-mono text-xs font-bold text-[#00ed64]">{{ eq.codigo_bien_publico }}</td>
              <td class="px-4 py-3 text-[#b8c4c2]">{{ eq.categorias?.nombre || '—' }}</td>
              <td class="px-4 py-3 text-white font-medium">{{ eq.marca }} {{ eq.modelo }}</td>
              <td class="px-4 py-3 text-[#b8c4c2]">{{ eq.ubicacion || '—' }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase border"
                  :class="{
                    'bg-[#00ed64]/10 text-[#00ed64] border-[#00ed64]/30': eq.estado === 'activo',
                    'bg-amber-500/10 text-amber-400 border-amber-500/30': eq.estado === 'reparacion',
                    'bg-red-500/10 text-red-400 border-red-500/30': eq.estado === 'baja',
                  }">
                  {{ eq.estado }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseModal>
  </div>
</template>