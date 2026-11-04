<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useEquipos } from '../composables/useEquipos'
import { useNotificacionesStore } from '../stores/notificaciones'
import BaseButton from '../components/ui/BaseButton.vue'

const toast = useNotificacionesStore()
const { obtenerParaReporte } = useEquipos()

const categorias = ref([])
const resultados = ref([])
const cargando = ref(false)

const filtros = ref({
  fecha_desde: '',
  fecha_hasta: '',
  categoria_id: '',
  ubicacion: '',
  estado: ''
})

onMounted(async () => {
  const { data } = await supabase.from('categorias').select('*').order('id')
  categorias.value = data || []
  await generarReporte()
})

async function generarReporte() {
  cargando.value = true
  const res = await obtenerParaReporte(filtros.value)
  cargando.value = false

  if (res.ok) {
    resultados.value = res.data
  } else {
    toast.error('Error al generar reporte: ' + res.error)
  }
}

function limpiarFiltros() {
  filtros.value = { fecha_desde: '', fecha_hasta: '', categoria_id: '', ubicacion: '', estado: '' }
  generarReporte()
}

// --- Cálculos de resumen ---
const totalEquipos = computed(() => resultados.value.length)

// Agrupar por ubicación
const conteoPorUbicacion = computed(() => {
  const conteo = {}
  resultados.value.forEach(eq => {
    const ubi = eq.ubicacion || 'Sin ubicación asignada'
    conteo[ubi] = (conteo[ubi] || 0) + 1
  })
  return Object.entries(conteo).sort((a, b) => b[1] - a[1])
})

// Agrupar por categoría
const conteoPorCategoria = computed(() => {
  const conteo = {}
  resultados.value.forEach(eq => {
    const cat = eq.categorias?.nombre || 'Sin categoría'
    conteo[cat] = (conteo[cat] || 0) + 1
  })
  return Object.entries(conteo).sort((a, b) => b[1] - a[1])
})

// Función para convertir el hardware en un texto legible
function formatearHardware(hardware) {
  if (!hardware || hardware.length === 0) return 'Sin hardware registrado'

  const partes = []

  // Procesador
  const cpu = hardware.find(h => h.tipo === 'procesador')
  if (cpu) partes.push(`CPU: ${cpu.marca || ''} ${cpu.modelo || ''}`.trim())

  // RAM
  const rams = hardware.filter(h => h.tipo === 'ram')
  if (rams.length > 0) {
    const totalModulos = rams.reduce((acc, r) => acc + (r.cantidad_modulos || 0), 0)
    const tipo = rams[0].tipo_ram || ''
    partes.push(`RAM: ${totalModulos} módulo(s) ${tipo}`.trim())
  }

  // Almacenamiento
  const discos = hardware.filter(h => h.tipo === 'almacenamiento')
  if (discos.length > 0) {
    const discosTexto = discos.map(d => `${d.tipo_almacenamiento || ''} ${d.capacidad_gb || 0}GB`).join(' + ')
    partes.push(`Almacenamiento: ${discosTexto}`)
  }

  // GPU
  const gpu = hardware.find(h => h.tipo === 'gpu')
  if (gpu) partes.push(`GPU: ${gpu.marca || ''} ${gpu.modelo || ''}`.trim())

  // Placa base
  const placa = hardware.find(h => h.tipo === 'placa_base')
  if (placa) partes.push(`Placa: ${placa.marca || ''} ${placa.modelo || ''}`.trim())

  return partes.join(' | ')
}

// --- Exportar CSV ---
function exportarCSV() {
  if (resultados.value.length === 0) {
    toast.advertencia('No hay datos para exportar')
    return
  }

  // Cabeceras
  const headers = ['Código', 'Categoría', 'Marca', 'Modelo', 'Serial', 'F. Registro', 'F. Fabricación', 'Ubicación', 'Estado']
  
  // Filas
  const filas = resultados.value.map(eq => [
    eq.codigo_bien_publico,
    eq.categorias?.nombre || '',
    eq.marca || '',
    eq.modelo || '',
    formatearHardware(eq.hardware_equipos),
    eq.numero_serie || '',
    eq.fecha_registro || '',
    eq.fecha_fabricacion || '',
    eq.ubicacion || '',
    eq.estado
  ])


  // Unir todo con comas y escapar comillas
  const csvContent = [
    headers.join(','),
    ...filas.map(fila => fila.map(campo => `"${campo}"`).join(','))
  ].join('\n')

  // Crear archivo y descargar
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }) // \uFEFF es para que Excel detecte los acentos
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `Reporte_Inventario_${new Date().toISOString().slice(0, 10)}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  toast.exito('Reporte exportado correctamente')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Generación de Reportes</h1>
        <p class="text-sm text-slate-500 mt-1">Consulta y exporta información detallada del inventario.</p>
      </div>
      <BaseButton variant="secondary" @click="exportarCSV">
         Exportar a Excel 
      </BaseButton>
    </div>

    <!-- Filtros -->
    <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
      <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Filtros de Búsqueda</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        <div>
          <label class="block text-xs font-bold text-slate-500 mb-1">Fecha Registro (Desde)</label>
          <input v-model="filtros.fecha_desde" type="date" class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-500 mb-1">Fecha Registro (Hasta)</label>
          <input v-model="filtros.fecha_hasta" type="date" class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-500 mb-1">Categoría</label>
          <select v-model="filtros.categoria_id" class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="">Todas</option>
            <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
        </div>

        <div>
        <label class="block text-xs font-bold text-slate-500 mb-1">Ubicación</label>
        <select 
        v-model="filtros.ubicacion" 
        class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
     <option value="">Todas las ubicaciones</option>
     <option value="Laboratorio de Informática (1)">Laboratorio de Informática (1)</option>
     <option value="Control de Estudio">Control de Estudio</option>
     <option value="Oficina Académica">Oficina Académica</option>
     <option value="Oficina General">Oficina General</option>
     <option value="Oficina del Muru47">Oficina del Muru47</option>
     <option value="Sala de profesores">Sala de profesores</option>
    </select>
     </div>
        <div>
          <label class="block text-xs font-bold text-slate-500 mb-1">Estado</label>
          <select v-model="filtros.estado" class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="reparacion">En Reparación</option>
            <option value="baja">De Baja</option>
          </select>
        </div>

      </div>
      <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
        <BaseButton variant="cancel" @click="limpiarFiltros">Limpiar</BaseButton>
        <BaseButton variant="primary" @click="generarReporte" :loading="cargando">Generar Reporte</BaseButton>
      </div>
    </div>

    <!-- Resumen de Totales y Ubicaciones -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-blue-50 border border-blue-100 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
        <p class="text-xs font-bold text-blue-600 uppercase tracking-wider">Total Equipos Encontrados</p>
        <p class="text-5xl font-black text-blue-800 mt-2">{{ totalEquipos }}</p>
      </div>

      <div class="md:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Distribución por Ubicación</h3>
        <div v-if="conteoPorUbicacion.length === 0" class="text-sm text-slate-400">Sin datos</div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-40 overflow-y-auto pr-2">
          <div v-for="[ubi, cant] in conteoPorUbicacion" :key="ubi" class="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
            <span class="text-sm font-medium text-slate-700 truncate">{{ ubi }}</span>
            <span class="text-sm font-black text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">{{ cant }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla de Resultados -->
    <div class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <div class="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 class="text-sm font-bold text-slate-700">Detalle de Equipos</h3>
        <span class="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">{{ resultados.length }} registros</span>
      </div>

      <div v-if="cargando" class="p-12 text-center text-slate-500 animate-pulse">Generando reporte...</div>

      <div v-else-if="resultados.length === 0" class="p-12 text-center text-slate-400">
        No se encontraron equipos con los filtros seleccionados.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-100">
            <tr>
              <th class="px-4 py-3">Código</th>
              <th class="px-4 py-3">Categoría</th>
              <th class="px-4 py-3">Marca / Modelo</th>
              <th class="px-4 py-3">Especificaciones de Hardware</th>
              <th class="px-4 py-3">F. Registro</th>
              <th class="px-4 py-3">F. Fabricación</th>
              <th class="px-4 py-3">Ubicación</th>
              <th class="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="eq in resultados" :key="eq.codigo_bien_publico" class="hover:bg-blue-50/30 transition-colors">
              <td class="px-4 py-3 font-mono text-xs font-bold text-slate-600">{{ eq.codigo_bien_publico }}</td>
              <td class="px-4 py-3 text-slate-600">{{ eq.categorias?.nombre }}</td>
              <td class="px-4 py-3 text-slate-700 font-medium">{{ eq.marca }} {{ eq.modelo }}</td>
                  <td class="px-4 py-3 text-xs text-slate-600 max-w-xs">{{ formatearHardware(eq.hardware_equipos) }}</td>
              <td class="px-4 py-3 text-slate-500">{{ eq.fecha_registro || '—' }}</td>
              <td class="px-4 py-3 text-slate-500">{{ eq.fecha_fabricacion || '—' }}</td>
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
    </div>
  </div>
</template>