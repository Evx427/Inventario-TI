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
  // Traemos todos los equipos con su categoría
  const { data, error } = await supabase
    .from('equipos')
    .select(`
      *,
      categorias:categoria_id (nombre)
    `)
    .order('codigo_bien_publico')

  if (!error && data) {
    equipos.value = data
  }
  cargando.value = false
}

// --- Cálculos para las tarjetas ---
const totalEquipos = computed(() => equipos.value.length)
const totalActivos = computed(() => equipos.value.filter(e => e.estado === 'activo').length)
const totalReparacion = computed(() => equipos.value.filter(e => e.estado === 'reparacion').length)
const totalBaja = computed(() => equipos.value.filter(e => e.estado === 'baja').length)

// --- Lógica para abrir los modales ---
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

// --- Cálculos para mostrar en tablas de resumen ---
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
      <h1 class="text-2xl font-bold text-slate-800">Consultas de Inventario</h1>
      <p class="text-sm text-slate-500 mt-1">Visualiza el estado general de los equipos. Haz clic en una tarjeta para ver el detalle.</p>
    </div>

    <div v-if="cargando" class="p-12 text-center text-slate-500 animate-pulse">Cargando datos...</div>

    <div v-else class="space-y-8">
      <!-- Fila 1: Tarjetas de Estado -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Total -->
        <div 
          @click="abrirModal('total')"
          class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200"
        >
          <p class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Equipos</p>
          <p class="text-4xl font-black text-slate-800 mt-2">{{ totalEquipos }}</p>
          <p class="text-xs text-blue-500 font-semibold mt-4">Ver detalle →</p>
        </div>

        <!-- Activos -->
        <div 
          @click="abrirModal('activos')"
          class="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200"
        >
          <p class="text-xs font-bold text-emerald-600 uppercase tracking-wider">Funcionales (Activos)</p>
          <p class="text-4xl font-black text-emerald-800 mt-2">{{ totalActivos }}</p>
          <p class="text-xs text-emerald-600 font-semibold mt-4">Ver detalle →</p>
        </div>

        <!-- Reparación -->
        <div 
          @click="abrirModal('reparacion')"
          class="bg-amber-50 border border-amber-100 rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200"
        >
          <p class="text-xs font-bold text-amber-600 uppercase tracking-wider">En Reparación</p>
          <p class="text-4xl font-black text-amber-800 mt-2">{{ totalReparacion }}</p>
          <p class="text-xs text-amber-600 font-semibold mt-4">Ver detalle →</p>
        </div>

        <!-- Baja -->
        <div 
          @click="abrirModal('baja')"
          class="bg-rose-50 border border-rose-100 rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200"
        >
          <p class="text-xs font-bold text-rose-600 uppercase tracking-wider">Dados de Baja</p>
          <p class="text-4xl font-black text-rose-800 mt-2">{{ totalBaja }}</p>
          <p class="text-xs text-rose-600 font-semibold mt-4">Ver detalle →</p>
        </div>
      </div>

      <!-- Fila 2: Resúmenes por Categoría y Ubicación -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Por Categoría -->
        <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Equipos por Categoría</h3>
          <div class="space-y-3 max-h-80 overflow-y-auto pr-2">
            <div v-for="[cat, cant] in conteoPorCategoria" :key="cat" class="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
              <span class="text-sm font-bold text-slate-700">{{ cat }}</span>
              <span class="text-sm font-black text-white bg-blue-500 px-3 py-1 rounded-full shadow-sm">{{ cant }}</span>
            </div>
          </div>
        </div>

        <!-- Por Ubicación -->
        <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Equipos por Ubicación</h3>
          <div class="space-y-3 max-h-80 overflow-y-auto pr-2">
            <div v-for="[ubi, cant] in conteoPorUbicacion" :key="ubi" class="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
              <span class="text-sm font-bold text-slate-700">{{ ubi }}</span>
              <span class="text-sm font-black text-white bg-violet-500 px-3 py-1 rounded-full shadow-sm">{{ cant }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Genérico para Detalles -->
    <BaseModal :open="modalAbierto" :title="tituloModal" size="xl" @close="modalAbierto = false">
      <div class="overflow-x-auto">
        <table class="w-full text-sm min-w-[800px]">
          <thead class="bg-slate-50 text-slate-500 text-left text-xs uppercase font-bold">
            <tr>
              <th class="px-4 py-3">Código</th>
              <th class="px-4 py-3">Categoría</th>
              <th class="px-4 py-3">Marca / Modelo</th>
              <th class="px-4 py-3">Ubicación</th>
              <th class="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="eq in equiposFiltrados" :key="eq.codigo_bien_publico" class="hover:bg-blue-50/30 transition-colors">
              <td class="px-4 py-3 font-mono text-xs font-bold text-slate-600">{{ eq.codigo_bien_publico }}</td>
              <td class="px-4 py-3 text-slate-600">{{ eq.categorias?.nombre || '—' }}</td>
              <td class="px-4 py-3 text-slate-700 font-medium">{{ eq.marca }} {{ eq.modelo }}</td>
              <td class="px-4 py-3 text-slate-600">{{ eq.ubicacion || '—' }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded text-[10px] font-bold uppercase border"
                  :class="{
                    'bg-emerald-50 text-emerald-600 border-emerald-200': eq.estado === 'activo',
                    'bg-amber-50 text-amber-600 border-amber-200': eq.estado === 'reparacion',
                    'bg-rose-50 text-rose-600 border-rose-200': eq.estado === 'baja',
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