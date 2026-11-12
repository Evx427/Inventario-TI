<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useEquipos } from '../composables/useEquipos'
import { useNotificacionesStore } from '../stores/notificaciones'
import BaseButton from '../components/ui/BaseButton.vue'

const toast = useNotificacionesStore()
const { obtenerParaReporte, totalReportes } = useEquipos()

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

const paginaActual = ref(1)
const registrosPorPagina = 10

onMounted(async () => {
  const { data } = await supabase.from('categorias').select('*').order('id')
  categorias.value = data || []
  await generarReporte()
})

async function generarReporte(pagina = 1) {
  paginaActual.value = pagina
  cargando.value = true
  const res = await obtenerParaReporte(filtros.value, pagina)
  cargando.value = false

  if (res.ok) {
    resultados.value = res.data
  } else {
    toast.error('Error al generar reporte: ' + res.error)
  }
}

function limpiarFiltros() {
  filtros.value = { fecha_desde: '', fecha_hasta: '', categoria_id: '', ubicacion: '', estado: '' }
  generarReporte(1)
}

const totalPaginas = computed(() => Math.ceil(totalReportes.value / registrosPorPagina))

function cambiarPagina(nuevaPagina) {
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas.value) return
  generarReporte(nuevaPagina)
}

const totalEquipos = computed(() => resultados.value.length)

const conteoPorUbicacion = computed(() => {
  const conteo = {}
  resultados.value.forEach(eq => {
    const ubi = eq.ubicacion || 'Sin ubicación asignada'
    conteo[ubi] = (conteo[ubi] || 0) + 1
  })
  return Object.entries(conteo).sort((a, b) => b[1] - a[1])
})

function extraerHardware(hardware) {
  const datos = { placa: '—', procesador: '—', ram: '—', almacenamiento: '—', gpu: '—', red: '—' }
  if (!hardware || hardware.length === 0) return datos

  const placa = hardware.find(h => h.tipo === 'placa_base')
  if (placa) datos.placa = `${placa.marca || ''} ${placa.modelo || ''}`.trim()

  const cpu = hardware.find(h => h.tipo === 'procesador')
  if (cpu) datos.procesador = `${cpu.marca || ''} ${cpu.modelo || ''}`.trim()

  const rams = hardware.filter(h => h.tipo === 'ram')
  if (rams.length > 0) {
    const totalModulos = rams.reduce((acc, r) => acc + (r.cantidad_modulos || 0), 0)
    const tipo = rams[0].tipo_ram || ''
    datos.ram = `${totalModulos} módulo(s) ${tipo}`.trim()
  }

  const discos = hardware.filter(h => h.tipo === 'almacenamiento')
  if (discos.length > 0) {
    datos.almacenamiento = discos.map(d => `${d.tipo_almacenamiento || ''} ${d.capacidad_gb || 0}GB`).join(' + ')
  }

  const gpu = hardware.find(h => h.tipo === 'gpu')
  if (gpu) datos.gpu = `${gpu.marca || ''} ${gpu.modelo || ''}`.trim()

  const red = hardware.find(h => h.tipo === 'red')
  if (red) datos.red = `${red.marca || ''} ${red.modelo || ''}`.trim()

  return datos
}

async function exportarCSV() {
  const res = await obtenerParaReporte(filtros.value, 1, true)
  if (!res.ok || res.data.length === 0) {
    toast.advertencia('No hay datos para exportar')
    return
  }

  const headers = [
    'Código', 'Categoría', 'Marca', 'Modelo', 'Serial', 'F. Registro', 
    'F. Fabricación', 'Ubicación', 'Estado', 'Placa Base', 'Procesador', 
    'Memoria RAM', 'Almacenamiento', 'Tarjeta Gráfica (GPU)', 'Tarjeta de Red'
  ]
  
  const filas = res.data.map(eq => {
    const hw = extraerHardware(eq.hardware_equipos)
    return [
      eq.codigo_bien_publico, eq.categorias?.nombre || '', eq.marca || '', 
      eq.modelo || '', eq.numero_serie || '', eq.fecha_registro || '', 
      eq.fecha_fabricacion || '', eq.ubicacion || '', eq.estado,
      hw.placa, hw.procesador, hw.ram, hw.almacenamiento, hw.gpu, hw.red
    ]
  })

  const csvContent = [
    headers.join(','),
    ...filas.map(fila => fila.map(campo => `"${campo}"`).join(','))
  ].join('\n')

  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }) 
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `Reporte_Inventario_${new Date().toISOString().slice(0, 10)}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  toast.exito(`Reporte exportado con ${res.data.length} equipos.`)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Generación de Reportes</h1>
        <p class="text-sm text-[#b8c4c2] mt-1">Consulta y exporta información detallada del inventario.</p>
      </div>
      <BaseButton variant="secondary" @click="exportarCSV" class="w-full sm:w-auto">Exportar a Excel</BaseButton>
    </div>

    <!-- Filtros -->
    <div class="bg-[#001e2b] border border-[#00684a]/30 rounded-2xl p-6 shadow-lg shadow-black/20">
      <h3 class="text-sm font-bold text-white uppercase tracking-wide mb-4 font-mono">Filtros de Búsqueda</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        <div>
          <label class="block text-xs font-bold text-[#b8c4c2] mb-1">F. Registro (Desde)</label>
          <input v-model="filtros.fecha_desde" type="date" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-full px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" />
        </div>
        <div>
          <label class="block text-xs font-bold text-[#b8c4c2] mb-1">F. Registro (Hasta)</label>
          <input v-model="filtros.fecha_hasta" type="date" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-full px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" />
        </div>
        <div>
          <label class="block text-xs font-bold text-[#b8c4c2] mb-1">Categoría</label>
          <select v-model="filtros.categoria_id" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-full px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50">
            <option value="">Todas</option>
            <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-[#b8c4c2] mb-1">Ubicación</label>
          <select v-model="filtros.ubicacion" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-full px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50">
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
          <label class="block text-xs font-bold text-[#b8c4c2] mb-1">Estado</label>
          <select v-model="filtros.estado" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-full px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50">
            <option value="">Todos</option>
            <option value="activo">Activo</option>
            <option value="reparacion">En Reparación</option>
            <option value="baja">De Baja</option>
          </select>
        </div>
      </div>
      <div class="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-4 border-t border-[#00684a]/30">
        <BaseButton variant="cancel" @click="limpiarFiltros">Limpiar</BaseButton>
        <BaseButton variant="primary" @click="generarReporte(1)" :loading="cargando">Generar Reporte</BaseButton>
      </div>
    </div>

    <!-- Resumen -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-[#001e2b] border border-[#00ed64]/30 rounded-2xl p-6 flex flex-col justify-center shadow-lg shadow-black/20">
        <p class="text-xs font-bold text-[#00ed64] uppercase tracking-wider font-mono">Total Equipos</p>
        <p class="text-5xl font-bold text-[#00ed64] mt-2">{{ totalReportes }}</p>
      </div>
      <div class="md:col-span-2 bg-[#001e2b] border border-[#00684a]/30 rounded-2xl p-6 shadow-lg shadow-black/20">
        <h3 class="text-sm font-bold text-white uppercase tracking-wide mb-4 font-mono">Distribución por Ubicación</h3>
        <div v-if="conteoPorUbicacion.length === 0" class="text-sm text-[#5c6c75]">Sin datos en esta página</div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-2">
          <div v-for="[ubi, cant] in conteoPorUbicacion" :key="ubi" class="flex items-center justify-between bg-[#002b3b] rounded-lg px-4 py-2 border border-[#00684a]/20">
            <span class="text-sm font-medium text-[#b8c4c2] truncate">{{ ubi }}</span>
            <span class="text-sm font-bold text-[#00ed64] bg-[#00ed64]/10 px-2 py-0.5 rounded border border-[#00ed64]/30">{{ cant }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabla -->
    <div class="bg-[#001e2b] border border-[#00684a]/30 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
      <div class="p-4 border-b border-[#00684a]/30 bg-[#002b3b] flex justify-between items-center">
        <h3 class="text-sm font-bold text-white font-mono uppercase">Detalle de Equipos</h3>
        <span class="text-xs font-bold text-[#00ed64] bg-[#00ed64]/10 px-3 py-1 rounded-full border border-[#00ed64]/30">{{ totalReportes }} registros</span>
      </div>

      <div v-if="cargando" class="p-12 text-center text-[#b8c4c2] animate-pulse">Generando reporte...</div>
      <div v-else-if="resultados.length === 0" class="p-12 text-center text-[#5c6c75]">No se encontraron equipos con los filtros seleccionados.</div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm min-w-[1200px]">
          <thead class="bg-[#002b3b] text-[#b8c4c2] text-left text-xs uppercase font-mono tracking-wider border-b border-[#00684a]/30">
            <tr>
              <th class="px-4 py-3 font-bold">Código</th>
              <th class="px-4 py-3 font-bold">Categoría</th>
              <th class="px-4 py-3 font-bold">Marca / Modelo</th>
              <th class="px-4 py-3 font-bold">Serial</th>
              <th class="px-4 py-3 font-bold">Placa Base</th>
              <th class="px-4 py-3 font-bold">Procesador</th>
              <th class="px-4 py-3 font-bold">RAM</th>
              <th class="px-4 py-3 font-bold">Disco</th>
              <th class="px-4 py-3 font-bold">GPU</th>
              <th class="px-4 py-3 font-bold">Red</th>
              <th class="px-4 py-3 font-bold">Ubicación</th>
              <th class="px-4 py-3 font-bold">Estado</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#00684a]/20">
            <tr v-for="eq in resultados" :key="eq.codigo_bien_publico" class="hover:bg-[#00ed64]/5 transition-colors">
              <td class="px-4 py-3 font-mono text-xs font-bold text-[#00ed64]">{{ eq.codigo_bien_publico }}</td>
              <td class="px-4 py-3 text-[#b8c4c2]">{{ eq.categorias?.nombre }}</td>
              <td class="px-4 py-3 text-white font-medium">{{ eq.marca }} {{ eq.modelo }}</td>
              <td class="px-4 py-3 text-[#5c6c75] text-xs">{{ eq.numero_serie || '—' }}</td>
              <td class="px-4 py-3 text-xs text-[#b8c4c2]">{{ extraerHardware(eq.hardware_equipos).placa }}</td>
              <td class="px-4 py-3 text-xs text-[#b8c4c2]">{{ extraerHardware(eq.hardware_equipos).procesador }}</td>
              <td class="px-4 py-3 text-xs text-[#b8c4c2]">{{ extraerHardware(eq.hardware_equipos).ram }}</td>
              <td class="px-4 py-3 text-xs text-[#b8c4c2]">{{ extraerHardware(eq.hardware_equipos).almacenamiento }}</td>
              <td class="px-4 py-3 text-xs text-[#b8c4c2]">{{ extraerHardware(eq.hardware_equipos).gpu }}</td>
              <td class="px-4 py-3 text-xs text-[#b8c4c2]">{{ extraerHardware(eq.hardware_equipos).red }}</td>
              <td class="px-4 py-3 text-[#b8c4c2]">{{ eq.ubicacion || '—' }}</td>
              <td class="px-4 py-3">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border"
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

      <!-- Paginación -->
      <div v-if="totalPaginas > 1" class="px-6 py-4 border-t border-[#00684a]/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#002b3b]">
        <p class="text-xs font-mono text-[#b8c4c2]">
          Mostrando <span class="font-bold text-white">{{ (paginaActual - 1) * registrosPorPagina + 1 }}</span> 
          a <span class="font-bold text-white">{{ Math.min(paginaActual * registrosPorPagina, totalReportes) }}</span> 
          de <span class="font-bold text-white">{{ totalReportes }}</span> equipos
        </p>
        <div class="flex items-center gap-2">
          <button :disabled="paginaActual === 1" class="px-4 py-1.5 rounded-full text-xs font-bold transition-colors border" :class="paginaActual === 1 ? 'bg-[#5c6c75]/20 text-[#5c6c75] border-[#5c6c75]/30 cursor-not-allowed' : 'bg-transparent text-white border-[#5c6c75] hover:border-[#00ed64] hover:text-[#00ed64]'" @click="cambiarPagina(paginaActual - 1)">Anterior</button>
          <span class="text-xs font-mono font-bold text-[#00ed64] px-2">Página {{ paginaActual }} de {{ totalPaginas }}</span>
          <button :disabled="paginaActual === totalPaginas" class="px-4 py-1.5 rounded-full text-xs font-bold transition-colors border" :class="paginaActual === totalPaginas ? 'bg-[#5c6c75]/20 text-[#5c6c75] border-[#5c6c75]/30 cursor-not-allowed' : 'bg-transparent text-white border-[#5c6c75] hover:border-[#00ed64] hover:text-[#00ed64]'" @click="cambiarPagina(paginaActual + 1)">Siguiente</button>
        </div>
      </div>
    </div>
  </div>
</template>