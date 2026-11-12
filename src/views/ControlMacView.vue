<script setup>
import { ref, onMounted, computed } from 'vue'
import { useControlMac } from '../composables/useControlMac'
import { useAuth } from '../composables/useAuth'
import { useNotificacionesStore } from '../stores/notificaciones'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import ConfirmModal from '../components/ui/ConfirmModal.vue'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const auth = useAuth()
const toast = useNotificacionesStore()
const { 
  dispositivos, totalRegistros, cargando, listar, crear, actualizar, eliminar,
  guardarDispositivosAdicionales, obtenerDispositivosAdicionales 
} = useControlMac()

const filtros = ref({ busqueda: '', tipo_personal: '' })
const paginaActual = ref(1)
const registrosPorPagina = 10

const modalAbierto = ref(false)
const modalConfirmAbierto = ref(false)
const modalDetalleAbierto = ref(false)

const dispositivoEditando = ref(null)
const dispositivoAEliminar = ref(null)
const dispositivoDetalle = ref(null)
const dispositivosDetalleAdicionales = ref([])
const guardando = ref(false)
const cargandoDetalle = ref(false)

const form = ref(getFormVacio())
const erroresValidacion = ref({})
const esInstitucional = ref(false)
const tieneMasDispositivos = ref(false)
const dispositivosAdicionales = ref([])

const ordenTipos = { docente: 1, administrativo: 2, vigilante: 3, obrero: 4, institucional: 5 }

function getFormVacio() {
  return {
    nombre: '',
    marca: '',
    modelo: '',
    direccion_mac: '',
    propietario: '',
    tipo_personal: 'docente'
  }
}

onMounted(async () => {
  await refrescar()
})

async function refrescar(pagina = 1) {
  paginaActual.value = pagina
  await listar(filtros.value, pagina)
}

function aplicarFiltros() {
  refrescar(1)
}

const totalPaginas = computed(() => Math.ceil(totalRegistros.value / registrosPorPagina))

function cambiarPagina(nuevaPagina) {
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas.value) return
  refrescar(nuevaPagina)
}

const dispositivosOrdenados = computed(() => {
  return [...dispositivos.value].sort((a, b) => {
    const ordenA = ordenTipos[a.tipo_personal] || 99
    const ordenB = ordenTipos[b.tipo_personal] || 99
    if (ordenA !== ordenB) return ordenA - ordenB
    return (a.propietario || '').localeCompare(b.propietario || '')
  })
})

function abrirCrear() {
  dispositivoEditando.value = null
  esInstitucional.value = false
  tieneMasDispositivos.value = false
  dispositivosAdicionales.value = []
  form.value = getFormVacio()
  erroresValidacion.value = {}
  modalAbierto.value = true
}

async function abrirEditar(dispositivo) {
  dispositivoEditando.value = dispositivo
  form.value = { ...dispositivo }
  
  if (dispositivo.propietario === 'Perteneciente a la UPTMA Ext. Villa del Rosario') {
    esInstitucional.value = true
  } else {
    esInstitucional.value = false
  }

  const resDis = await obtenerDispositivosAdicionales(dispositivo.id)
  if (resDis.ok && resDis.data.length > 0) {
    dispositivosAdicionales.value = resDis.data
    tieneMasDispositivos.value = true
  } else {
    dispositivosAdicionales.value = []
    tieneMasDispositivos.value = false
  }
  
  erroresValidacion.value = {}
  modalAbierto.value = true
}

async function abrirDetalle(dispositivo) {
  dispositivoDetalle.value = dispositivo
  cargandoDetalle.value = true
  modalDetalleAbierto.value = true
  
  const res = await obtenerDispositivosAdicionales(dispositivo.id)
  if (res.ok) {
    dispositivosDetalleAdicionales.value = res.data
  } else {
    dispositivosDetalleAdicionales.value = []
  }
  cargandoDetalle.value = false
}

function formatearMAC(event) {
  let valor = event.target.value.replace(/[^A-Fa-f0-9]/g, '') 
  valor = valor.toUpperCase()
  let formateado = ''
  for (let i = 0; i < valor.length && i < 12; i++) {
    if (i > 0 && i % 2 === 0) formateado += '-'
    formateado += valor[i]
  }
  form.value.direccion_mac = formateado
}

function formatearMACAdicional(event, index) {
  let valor = event.target.value.replace(/[^A-Fa-f0-9]/g, '')
  valor = valor.toUpperCase()
  let formateado = ''
  for (let i = 0; i < valor.length && i < 12; i++) {
    if (i > 0 && i % 2 === 0) formateado += '-'
    formateado += valor[i]
  }
  dispositivosAdicionales.value[index].direccion_mac = formateado
}

function agregarDispositivoAdicional() {
  dispositivosAdicionales.value.push({
    nombre_dispositivo: '',
    marca: '',
    modelo: '',
    direccion_mac: '',
    tipo_dispositivo: 'laptop'
  })
}

function eliminarDispositivoAdicional(index) {
  dispositivosAdicionales.value.splice(index, 1)
}

function validar() {
  erroresValidacion.value = {}
  let valido = true

  if (esInstitucional.value && !form.value.nombre.trim()) {
    erroresValidacion.value.nombre = 'El nombre del equipo es obligatorio.'
    valido = false
  }
  if (!form.value.marca.trim()) {
    erroresValidacion.value.marca = 'La marca es obligatoria.'
    valido = false
  }
  if (!form.value.modelo.trim()) {
    erroresValidacion.value.modelo = 'El modelo es obligatorio.'
    valido = false
  }
  if (!esInstitucional.value && !form.value.propietario.trim()) {
    erroresValidacion.value.propietario = 'El propietario es obligatorio.'
    valido = false
  }
  
  const macRegex = /^([0-9A-F]{2}-){5}[0-9A-F]{2}$/
  if (!form.value.direccion_mac) {
    erroresValidacion.value.direccion_mac = 'La dirección MAC es obligatoria.'
    valido = false
  } else if (!macRegex.test(form.value.direccion_mac)) {
    erroresValidacion.value.direccion_mac = 'Formato inválido.'
    valido = false
  }

  if (tieneMasDispositivos.value) {
    if (dispositivosAdicionales.value.length === 0) {
      erroresValidacion.value.dispositivos = 'Debes agregar al menos un dispositivo.'
      valido = false
    }
    dispositivosAdicionales.value.forEach((d, i) => {
      if (!d.nombre_dispositivo.trim()) {
        erroresValidacion.value[`dispositivo_${i}`] = 'Nombre obligatorio.'
        valido = false
      }
      if (!macRegex.test(d.direccion_mac)) {
        erroresValidacion.value[`mac_${i}`] = 'MAC inválida.'
        valido = false
      }
    })
  }

  return valido
}

async function onGuardar() {
  if (!validar()) return

  const datosAGuardar = { ...form.value }

  if (esInstitucional.value) {    
    datosAGuardar.propietario = 'Perteneciente a la UPTMA Ext. Villa del Rosario'
    datosAGuardar.tipo_personal = 'institucional' 
  } else {
    datosAGuardar.nombre = null
  }

  guardando.value = true
  let res

  if (dispositivoEditando.value) {
    res = await actualizar(dispositivoEditando.value.id, datosAGuardar)
    if (res.ok) {
      const aGuardar = tieneMasDispositivos.value ? dispositivosAdicionales.value : []
      await guardarDispositivosAdicionales(dispositivoEditando.value.id, aGuardar)
    }
  } else {
    res = await crear(datosAGuardar)
    if (res.ok && tieneMasDispositivos.value) {
      await guardarDispositivosAdicionales(res.data.id, dispositivosAdicionales.value)
    }
  }
  
  guardando.value = false

  if (res.ok) {
    modalAbierto.value = false
    toast.exito(dispositivoEditando.value ? 'Dispositivo actualizado' : 'Dispositivo registrado')
    await refrescar(paginaActual.value)
  } else {
    toast.error('Error: ' + res.error)
  }
}

function pedirConfirmacionEliminar(dispositivo) {
  dispositivoAEliminar.value = dispositivo
  modalConfirmAbierto.value = true  
}

async function ejecutarEliminar() {
  if (!dispositivoAEliminar.value) return
  const id = dispositivoAEliminar.value.id
  modalConfirmAbierto.value = false

  const res = await eliminar(id)
  if (res.ok) {
    toast.exito('Dispositivo eliminado')
    await refrescar(paginaActual.value)
  } else {
    toast.error(res.error)
  }
  dispositivoAEliminar.value = null
}

async function exportarCSV() {
  const res = await listar(filtros.value, 1, true)
  if (!res.ok || res.data.length === 0) {
    toast.advertencia('No hay datos para exportar')
    return
  }

  const headers = ['Nombre', 'Marca', 'Modelo', 'Dirección MAC', 'Propietario', 'Tipo de Personal']
  const filas = res.data.map(d => [
    d.nombre || '—', d.marca, d.modelo, d.direccion_mac, d.propietario, d.tipo_personal
  ])

  const csvContent = [
    headers.join(','),
    ...filas.map(fila => fila.map(campo => `"${campo}"`).join(','))
  ].join('\n')

  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `Control_MAC_${new Date().toISOString().slice(0, 10)}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  toast.exito(`Reporte exportado con ${res.data.length} dispositivos.`)
}

async function exportarPDF() {
  const res = await listar(filtros.value, 1, true)
  if (!res.ok || res.data.length === 0) {
    toast.advertencia('No hay datos para exportar')
    return
  }

  const doc = new jsPDF('landscape', 'mm', 'letter')
  const anchoPagina = doc.internal.pageSize.getWidth()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('CONTROL DE DISPOSITIVOS (DIRECCIONES MAC)', anchoPagina / 2, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Fecha de Emisión: ' + new Date().toLocaleDateString('es-ES'), anchoPagina - 15, 30, { align: 'right' })

  const filas = res.data.map(d => [
    d.nombre || '—', d.marca, d.modelo, d.direccion_mac, d.propietario, d.tipo_personal.toUpperCase()
  ])

  autoTable(doc, {
    startY: 35,
    head: [['Nombre', 'Marca', 'Modelo', 'Dirección MAC', 'Propietario', 'Tipo']],
    body: filas,
    theme: 'grid',
    headStyles: { fillColor: [0, 30, 43], textColor: [0, 237, 100], fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 9, cellPadding: 4, textColor: [255, 255, 255], fillColor: [0, 30, 43], lineColor: [0, 104, 74] },
    alternateRowStyles: { fillColor: [0, 43, 59] }
  })

  doc.save(`Control_MAC_${new Date().toISOString().slice(0, 10)}.pdf`)
  toast.exito(`PDF exportado con ${res.data.length} dispositivos.`)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Control MAC</h1>
        <p class="text-sm text-[#b8c4c2] mt-1">Registro de dispositivos conectados a la red.</p>
      </div>
      <div class="flex flex-wrap gap-2 w-full sm:w-auto">
        <BaseButton variant="secondary" @click="exportarCSV" class="w-full sm:w-auto">Exportar Excel</BaseButton>
        <BaseButton variant="secondary" @click="exportarPDF" class="w-full sm:w-auto">Exportar PDF</BaseButton>
        <BaseButton v-if="auth.puedeEscribir" variant="primary" @click="abrirCrear" class="w-full sm:w-auto">Registrar MAC</BaseButton>
      </div>
    </div>

    <!-- Filtros -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
      <input v-model="filtros.busqueda" placeholder="Buscar..." class="bg-[#001e2b] border border-[#00684a]/50 rounded-full px-4 py-2.5 text-sm text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50 transition" @input="aplicarFiltros" />
      <select v-model="filtros.tipo_personal" class="bg-[#001e2b] border border-[#00684a]/50 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50 transition" @change="aplicarFiltros">
        <option value="">Todos los tipos</option>
        <option value="docente">Docente</option>
        <option value="administrativo">Administrativo</option>
        <option value="vigilante">Vigilante</option>
        <option value="obrero">Obrero</option>
        <option value="institucional">Institución</option>
      </select>
      <BaseButton variant="cancel" @click="filtros = { busqueda: '', tipo_personal: '' }; aplicarFiltros()" class="w-full">Limpiar filtros</BaseButton>
    </div>

    <!-- Tabla -->
    <div class="bg-[#001e2b] border border-[#00684a]/30 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
      <div v-if="cargando" class="p-8 text-center text-[#b8c4c2] animate-pulse">Cargando dispositivos...</div>

      <div v-else-if="dispositivosOrdenados.length > 0" class="overflow-x-auto">
        <table class="w-full text-sm min-w-[800px]">
          <thead class="bg-[#002b3b] text-[#b8c4c2] text-left text-xs uppercase font-mono tracking-wider border-b border-[#00684a]/30">
            <tr>
              <th class="px-6 py-4 font-bold">Equipo Principal</th>
              <th class="px-6 py-4 font-bold">Dirección MAC</th>
              <th class="px-6 py-4 font-bold">Propietario</th>
              <th class="px-6 py-4 font-bold">Tipo</th>
              <th class="px-6 py-4 text-right font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#00684a]/20">
            <tr v-for="d in dispositivosOrdenados" :key="d.id" class="hover:bg-[#00ed64]/5 transition-colors">
              <td class="px-6 py-4">
                <p class="font-bold text-white">{{ d.nombre || '—' }}</p>
                <p class="text-xs text-[#b8c4c2]">{{ d.marca }} {{ d.modelo }}</p>
              </td>
              <td class="px-6 py-4 font-mono text-xs font-bold text-[#00ed64]">{{ d.direccion_mac }}</td>
              <td class="px-6 py-4 text-[#b8c4c2] font-medium">{{ d.propietario }}</td>
              <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border capitalize"
                  :class="{
                    'bg-blue-500/10 text-blue-400 border-blue-500/30': d.tipo_personal === 'docente',
                    'bg-violet-500/10 text-violet-400 border-violet-500/30': d.tipo_personal === 'administrativo',
                    'bg-amber-500/10 text-amber-400 border-amber-500/30': d.tipo_personal === 'vigilante',
                    'bg-[#5c6c75]/20 text-[#b8c4c2] border-[#5c6c75]/40': d.tipo_personal === 'obrero',
                    'bg-[#00ed64]/10 text-[#00ed64] border-[#00ed64]/30': d.tipo_personal === 'institucional',
                  }">
                  {{ d.tipo_personal }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="inline-flex gap-2">
                  <BaseButton size="sm" variant="ghost" @click="abrirDetalle(d)">Ver</BaseButton>
                  <BaseButton v-if="auth.puedeEscribir" size="sm" variant="secondary" @click="abrirEditar(d)">Editar</BaseButton>
                  <BaseButton v-if="auth.isSuperUsuario" size="sm" variant="danger" @click="pedirConfirmacionEliminar(d)">Eliminar</BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="p-8 text-center text-[#5c6c75]">No hay dispositivos registrados.</div>

      <!-- Paginación -->
      <div v-if="totalPaginas > 1" class="px-6 py-4 border-t border-[#00684a]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-xs font-mono text-[#b8c4c2]">
          Mostrando <span class="font-bold text-white">{{ (paginaActual - 1) * registrosPorPagina + 1 }}</span> 
          a <span class="font-bold text-white">{{ Math.min(paginaActual * registrosPorPagina, totalRegistros) }}</span> 
          de <span class="font-bold text-white">{{ totalRegistros }}</span> dispositivos
        </p>
        <div class="flex items-center gap-2">
          <button :disabled="paginaActual === 1" class="px-4 py-1.5 rounded-full text-xs font-bold transition-colors border" :class="paginaActual === 1 ? 'bg-[#5c6c75]/20 text-[#5c6c75] border-[#5c6c75]/30 cursor-not-allowed' : 'bg-transparent text-white border-[#5c6c75] hover:border-[#00ed64] hover:text-[#00ed64]'" @click="cambiarPagina(paginaActual - 1)">Anterior</button>
          <span class="text-xs font-mono font-bold text-[#00ed64] px-2">Página {{ paginaActual }} de {{ totalPaginas }}</span>
          <button :disabled="paginaActual === totalPaginas" class="px-4 py-1.5 rounded-full text-xs font-bold transition-colors border" :class="paginaActual === totalPaginas ? 'bg-[#5c6c75]/20 text-[#5c6c75] border-[#5c6c75]/30 cursor-not-allowed' : 'bg-transparent text-white border-[#5c6c75] hover:border-[#00ed64] hover:text-[#00ed64]'" @click="cambiarPagina(paginaActual + 1)">Siguiente</button>
        </div>
      </div>
    </div>

    <!-- Modal Formulario -->
    <BaseModal :open="modalAbierto" :title="dispositivoEditando ? 'Editar Dispositivo' : 'Nuevo Dispositivo'" size="md" @close="modalAbierto = false">
      <form class="space-y-4" @submit.prevent="onGuardar">
        
        <!-- Checkbox Institucional -->
        <div class="bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-4">
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="esInstitucional" class="w-5 h-5 rounded bg-[#001e2b] border-[#00684a] text-[#00ed64] focus:ring-[#00ed64]" />
            <div>
              <span class="text-sm font-bold text-white">¿Dispositivo perteneciente a la Institución?</span>
              <p class="text-xs text-[#b8c4c2] mt-0.5">Marca si el equipo es un activo de la universidad.</p>
            </div>
          </label>
        </div>

        <div v-if="esInstitucional">
          <label class="block text-sm font-bold text-[#b8c4c2] mb-1">Nombre del Equipo (Hostname) *</label>
          <input v-model="form.nombre" placeholder="Ej: PC-LAB-01" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" :class="{ 'border-red-500': erroresValidacion.nombre }" />
          <p v-if="erroresValidacion.nombre" class="text-xs text-red-400 mt-1">{{ erroresValidacion.nombre }}</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-[#b8c4c2] mb-1">Marca *</label>
            <input v-model="form.marca" required placeholder="Ej: Samsung" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" :class="{ 'border-red-500': erroresValidacion.marca }" />
            <p v-if="erroresValidacion.marca" class="text-xs text-red-400 mt-1">{{ erroresValidacion.marca }}</p>
          </div>
          <div>
            <label class="block text-sm font-bold text-[#b8c4c2] mb-1">Modelo *</label>
            <input v-model="form.modelo" required placeholder="Ej: Galaxy A54" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" :class="{ 'border-red-500': erroresValidacion.modelo }" />
            <p v-if="erroresValidacion.modelo" class="text-xs text-red-400 mt-1">{{ erroresValidacion.modelo }}</p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-bold text-[#b8c4c2] mb-1">Dirección MAC *</label>
          <input :value="form.direccion_mac" @input="formatearMAC" required placeholder="AA-BB-CC-DD-EE-FF" maxlength="17" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" :class="{ 'border-red-500': erroresValidacion.direccion_mac }" />
          <p v-if="erroresValidacion.direccion_mac" class="text-xs text-red-400 mt-1">{{ erroresValidacion.direccion_mac }}</p>
        </div>

        <div v-if="!esInstitucional" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-[#b8c4c2] mb-1">Propietario *</label>
            <input v-model="form.propietario" required placeholder="Nombre completo" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" :class="{ 'border-red-500': erroresValidacion.propietario }" />
            <p v-if="erroresValidacion.propietario" class="text-xs text-red-400 mt-1">{{ erroresValidacion.propietario }}</p>
          </div>
          <div>
            <label class="block text-sm font-bold text-[#b8c4c2] mb-1">Tipo de Personal *</label>
            <select v-model="form.tipo_personal" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50">
              <option value="docente">Docente</option>
              <option value="administrativo">Administrativo</option>
              <option value="vigilante">Vigilante</option>
              <option value="obrero">Obrero</option>
            </select>
          </div>
        </div>

        <div v-else class="bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-4">
          <p class="text-sm font-bold text-white">Propietario: <span class="text-[#00ed64]">Perteneciente a la UPTMA Ext. Villa del Rosario</span></p>
        </div>

        <!-- Checkbox más dispositivos -->
        <div class="bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-4">
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="tieneMasDispositivos" class="w-5 h-5 rounded bg-[#001e2b] border-[#00684a] text-[#00ed64] focus:ring-[#00ed64]" />
            <div>
              <span class="text-sm font-bold text-white">Registrar MAC de otro dispositivo</span>
              <p class="text-xs text-[#b8c4c2] mt-0.5">Laptops, tablets, celulares, etc.</p>
            </div>
          </label>
        </div>

        <!-- Dispositivos adicionales -->
        <div v-if="tieneMasDispositivos" class="space-y-3">
          <div class="flex justify-between items-center">
            <h4 class="text-sm font-bold text-white">Dispositivos Adicionales</h4>
            <BaseButton type="button" size="sm" variant="secondary" @click="agregarDispositivoAdicional">+ Agregar</BaseButton>
          </div>

          <div v-if="dispositivosAdicionales.length === 0" class="text-sm text-[#5c6c75] text-center py-4 border border-dashed border-[#00684a]/50 rounded-xl">
            Haz clic en "+ Agregar".
          </div>

          <div v-for="(d, i) in dispositivosAdicionales" :key="i" class="bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-4 space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-[#b8c4c2] uppercase font-mono">Dispositivo {{ i + 1 }}</span>
              <button type="button" class="text-xs text-red-400 hover:text-red-300 font-bold" @click="eliminarDispositivoAdicional(i)">Eliminar</button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-bold text-[#b8c4c2] mb-1">Nombre *</label>
                <input v-model="d.nombre_dispositivo" placeholder="Ej: Laptop personal" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-sm text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" />
                <p v-if="erroresValidacion[`dispositivo_${i}`]" class="text-xs text-red-400 mt-1">{{ erroresValidacion[`dispositivo_${i}`] }}</p>
              </div>
              <div>
                <label class="block text-xs font-bold text-[#b8c4c2] mb-1">Tipo</label>
                <select v-model="d.tipo_dispositivo" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50">
                  <option value="laptop">Laptop</option>
                  <option value="tablet">Tablet</option>
                  <option value="celular">Celular</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-[#b8c4c2] mb-1">Marca</label>
                <input v-model="d.marca" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-sm text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" />
              </div>
              <div>
                <label class="block text-xs font-bold text-[#b8c4c2] mb-1">Modelo</label>
                <input v-model="d.modelo" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-sm text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-xs font-bold text-[#b8c4c2] mb-1">Dirección MAC *</label>
                <input :value="d.direccion_mac" @input="(e) => formatearMACAdicional(e, i)" placeholder="AA-BB-CC-DD-EE-FF" maxlength="17" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" />
                <p v-if="erroresValidacion[`mac_${i}`]" class="text-xs text-red-400 mt-1">{{ erroresValidacion[`mac_${i}`] }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[#00684a]/30">
          <BaseButton variant="cancel" @click="modalAbierto = false" class="w-full sm:w-auto">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="guardando" class="w-full sm:w-auto">Guardar</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Modal Detalle -->
    <BaseModal :open="modalDetalleAbierto" title="Detalle de Dispositivo" size="md" @close="modalDetalleAbierto = false">
      <div v-if="dispositivoDetalle" class="space-y-4">
        <div class="bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-4">
          <h4 class="text-sm font-bold text-[#00ed64] mb-3 uppercase font-mono">Equipo Principal</h4>
          <div class="space-y-2 text-sm text-[#b8c4c2]">
            <p><span class="font-bold text-white">Nombre:</span> {{ dispositivoDetalle.nombre || '—' }}</p>
            <p><span class="font-bold text-white">Marca:</span> {{ dispositivoDetalle.marca }}</p>
            <p><span class="font-bold text-white">Modelo:</span> {{ dispositivoDetalle.modelo }}</p>
            <p><span class="font-bold text-white">MAC:</span> <span class="font-mono text-[#00ed64]">{{ dispositivoDetalle.direccion_mac }}</span></p>
            <p><span class="font-bold text-white">Propietario:</span> {{ dispositivoDetalle.propietario }}</p>
            <p><span class="font-bold text-white">Tipo:</span> {{ dispositivoDetalle.tipo_personal }}</p>
          </div>
        </div>

        <div>
          <h4 class="text-sm font-bold text-white mb-3">Dispositivos Adicionales ({{ dispositivosDetalleAdicionales.length }})</h4>
          
          <div v-if="cargandoDetalle" class="text-center py-4 text-[#b8c4c2]">Cargando...</div>
          
          <div v-else-if="dispositivosDetalleAdicionales.length === 0" class="text-sm text-[#5c6c75] text-center py-4 border border-dashed border-[#00684a]/50 rounded-xl">
            Sin dispositivos adicionales registrados.
          </div>
          
          <div v-else class="space-y-2">
            <div v-for="d in dispositivosDetalleAdicionales" :key="d.id" class="bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-3">
              <p class="font-bold text-white">{{ d.nombre_dispositivo }}</p>
              <p class="text-xs text-[#b8c4c2]">{{ d.marca }} {{ d.modelo }} · {{ d.tipo_dispositivo }}</p>
              <p class="text-xs font-mono text-[#00ed64] mt-1">MAC: {{ d.direccion_mac }}</p>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>

    <!-- Modal Confirmación -->
    <ConfirmModal
      :open="modalConfirmAbierto"
      title="¡Cuidado Colega!"
      :message="`¿Estás seguro de eliminar el dispositivo de ${dispositivoAEliminar?.propietario}?`"
      confirm-text="Sí, eliminar"
      @confirm="ejecutarEliminar"
      @cancel="modalConfirmAbierto = false; dispositivoAEliminar = null"
    />
  </div>
</template>