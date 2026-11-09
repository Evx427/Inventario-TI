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
const { dispositivos, totalRegistros, cargando, listar, crear, actualizar, eliminar } = useControlMac()

const filtros = ref({ busqueda: '', tipo_personal: '' })
const paginaActual = ref(1)
const registrosPorPagina = 10

const modalAbierto = ref(false)
const modalConfirmAbierto = ref(false)
const dispositivoEditando = ref(null)
const dispositivoAEliminar = ref(null)
const guardando = ref(false)

const form = ref(getFormVacio())
const erroresValidacion = ref({})
const esInstitucional = ref(false)

function getFormVacio() {
  return {
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

// --- Formulario y Validaciones ---
function abrirCrear() {
  dispositivoEditando.value = null
  esInstitucional.value = false
  form.value = getFormVacio()
  erroresValidacion.value = {}
  modalAbierto.value = true
}

function abrirEditar(dispositivo) {
  dispositivoEditando.value = dispositivo
  form.value = { ...dispositivo }
  
  // Si el propietario es la institución, se marca el checkbox
  if (dispositivo.propietario === 'Perteneciente a la UPTMA Ext. Villa del Rosario') {
    esInstitucional.value = true
  } else {
    esInstitucional.value = false
  }
  
  erroresValidacion.value = {}
  modalAbierto.value = true
}

// Formatear MAC 
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

function validar() {
  erroresValidacion.value = {}
  let valido = true

  if (!form.value.marca.trim()) {
    erroresValidacion.value.marca = 'La marca es obligatoria.'
    valido = false
  }
  if (!form.value.modelo.trim()) {
    erroresValidacion.value.modelo = 'El modelo es obligatorio.'
    valido = false
  }
  
  // Solo validamos el propietario si NO es institucional
  if (!esInstitucional.value && !form.value.propietario.trim()) {
    erroresValidacion.value.propietario = 'El propietario es obligatorio.'
    valido = false
  }
  
  const macRegex = /^([0-9A-F]{2}-){5}[0-9A-F]{2}$/
  if (!form.value.direccion_mac) {
    erroresValidacion.value.direccion_mac = 'La dirección MAC es obligatoria.'
    valido = false
  } else if (!macRegex.test(form.value.direccion_mac)) {
    erroresValidacion.value.direccion_mac = 'El formato debe ser exactamente 12 caracteres hexadecimales (ej. AA-BB-CC-DD-EE-FF).'
    valido = false
  }

  return valido
}

async function onGuardar() {
  if (!validar()) return

  // Creamos una copia de los datos
  const datosAGuardar = { ...form.value }

  // Si el checkbox está marcado, forzamos los valores de institución
  if (esInstitucional.value) {    
    datosAGuardar.propietario = 'Perteneciente a la UPTMA Ext. Villa del Rosario'
    datosAGuardar.tipo_personal = 'institucional' 
  }

  guardando.value = true
  const res = dispositivoEditando.value
    ? await actualizar(dispositivoEditando.value.id, datosAGuardar)
    : await crear(datosAGuardar)
  
  guardando.value = false

  if (res.ok) {
    modalAbierto.value = false
    toast.exito(dispositivoEditando.value ? 'Dispositivo actualizado correctamente' : 'Dispositivo registrado con éxito')
    await refrescar(paginaActual.value)
  } else {
    toast.error('Error: ' + res.error)
  }
}

// --- Eliminar ---
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
    toast.exito('Dispositivo eliminado del registro')
    await refrescar(paginaActual.value)
  } else {
    toast.error(res.error)
  }
  dispositivoAEliminar.value = null
}

// --- Exportaciones ---
async function exportarCSV() {
  const res = await listar(filtros.value, 1, true)

  if (!res.ok || res.data.length === 0) {
    toast.advertencia('No hay datos para exportar')
    return
  }

  const headers = ['Marca', 'Modelo', 'Dirección MAC', 'Propietario', 'Tipo de Personal']
  const filas = res.data.map(d => [
    d.marca, d.modelo, d.direccion_mac, d.propietario, d.tipo_personal
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
  doc.text('CONTROL DE DISPOSITIVOS-(DIRECCIONES MAC)', anchoPagina / 2, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Fecha de Emisión: ' + new Date().toLocaleDateString('es-ES'), anchoPagina - 15, 30, { align: 'right' })

  const filas = res.data.map(d => [
    d.marca, d.modelo, d.direccion_mac, d.propietario, d.tipo_personal.toUpperCase()
  ])

  autoTable(doc, {
    startY: 35,
    head: [['Marca', 'Modelo', 'Dirección MAC', 'Propietario', 'Tipo de Personal']],
    body: filas,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 9, cellPadding: 4, textColor: [0, 0, 0], valign: 'middle' },
    alternateRowStyles: { fillColor: [245, 245, 245] }
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
        <h1 class="text-2xl font-bold text-slate-800">Control MAC</h1>
        <p class="text-sm text-slate-500 mt-1">Registro de dispositivos conectados a la red.</p>
      </div>
      <div class="flex flex-wrap gap-2 w-full sm:w-auto">
        <BaseButton variant="secondary" @click="exportarCSV" class="w-full sm:w-auto">
          Exportar Excel
        </BaseButton>
        <BaseButton variant="secondary" @click="exportarPDF" class="w-full sm:w-auto">
          Exportar PDF
        </BaseButton>
        <BaseButton v-if="auth.puedeEscribir" variant="primary" @click="abrirCrear" class="w-full sm:w-auto">
          Registrar MAC
        </BaseButton>
      </div>
    </div>

    <!-- Filtros -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
      <input 
        v-model="filtros.busqueda" 
        placeholder="Buscar por MAC, propietario, marca..." 
        class="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" 
        @input="aplicarFiltros" 
      />
      <select 
        v-model="filtros.tipo_personal" 
        class="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition" 
        @change="aplicarFiltros"
      >
        <option value="">Todos los tipos</option>
        <option value="docente">Docente</option>
        <option value="administrativo">Administrativo</option>
        <option value="obrero">Obrero</option>
        <option value="institucional">Institución</option>
      </select>
      <BaseButton variant="cancel" @click="filtros = { busqueda: '', tipo_personal: '' }; aplicarFiltros()" class="w-full">
        Limpiar filtros
      </BaseButton>
    </div>

    <!-- Tabla -->
    <div class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <div v-if="cargando" class="p-8 text-center text-slate-500 animate-pulse">Cargando dispositivos...</div>

      <div v-else-if="dispositivos.length > 0" class="overflow-x-auto">
        <table class="w-full text-sm min-w-[700px]">
          <thead class="bg-slate-50 text-slate-500 text-left text-xs uppercase font-bold">
            <tr>
              <th class="px-4 py-4">Marca / Modelo</th>
              <th class="px-4 py-4">Dirección MAC</th>
              <th class="px-4 py-4">Propietario</th>
              <th class="px-4 py-4">Tipo</th>
              <th class="px-4 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="d in dispositivos" :key="d.id" class="hover:bg-blue-50/30 transition-colors">
              <td class="px-4 py-3">
                <p class="font-bold text-slate-800">{{ d.marca }}</p>
                <p class="text-xs text-slate-500">{{ d.modelo }}</p>
              </td>
              <td class="px-4 py-3 font-mono text-xs font-semibold text-slate-600">{{ d.direccion_mac }}</td>
              <td class="px-4 py-3 text-slate-700 font-medium">{{ d.propietario }}</td>
              <td class="px-4 py-3">
                <span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border capitalize bg-slate-100 text-slate-600 border-slate-200">
                  {{ d.tipo_personal }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="inline-flex gap-2">
                  <BaseButton v-if="auth.puedeEscribir" size="sm" variant="secondary" @click="abrirEditar(d)">
                    Editar
                  </BaseButton>
                  <BaseButton v-if="auth.isSuperUsuario" size="sm" variant="danger" @click="pedirConfirmacionEliminar(d)">
                    Eliminar
                  </BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="p-8 text-center text-slate-500">No hay dispositivos registrados.</div>

      <!-- Paginación -->
      <div v-if="totalPaginas > 1" class="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
        <p class="text-xs font-medium text-slate-500">
          Mostrando <span class="font-bold text-slate-700">{{ (paginaActual - 1) * registrosPorPagina + 1 }}</span> 
          a 
          <span class="font-bold text-slate-700">{{ Math.min(paginaActual * registrosPorPagina, totalRegistros) }}</span> 
          de <span class="font-bold text-slate-700">{{ totalRegistros }}</span> dispositivos
        </p>
        <div class="flex items-center gap-2">
          <button
            :disabled="paginaActual === 1"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border"
            :class="paginaActual === 1 ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
            @click="cambiarPagina(paginaActual - 1)"
          >
            Anterior
          </button>
          <span class="text-xs font-bold text-slate-700 px-2">
            Página {{ paginaActual }} de {{ totalPaginas }}
          </span>
          <button
            :disabled="paginaActual === totalPaginas"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border"
            :class="paginaActual === totalPaginas ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
            @click="cambiarPagina(paginaActual + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Formulario -->
    <BaseModal :open="modalAbierto" :title="dispositivoEditando ? 'Editar Dispositivo' : 'Nuevo Dispositivo'" size="md" @close="modalAbierto = false">
      <form class="space-y-4" @submit.prevent="onGuardar">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Marca *</label>
            <input v-model="form.marca" required placeholder="Ej: Samsung" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" :class="{ 'border-rose-400': erroresValidacion.marca }" />
            <p v-if="erroresValidacion.marca" class="text-xs text-rose-500 mt-1">{{ erroresValidacion.marca }}</p>
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Modelo *</label>
            <input v-model="form.modelo" required placeholder="Ej: Galaxy A54" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" :class="{ 'border-rose-400': erroresValidacion.modelo }" />
            <p v-if="erroresValidacion.modelo" class="text-xs text-rose-500 mt-1">{{ erroresValidacion.modelo }}</p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">Dirección MAC *</label>
          <input 
            :value="form.direccion_mac"
            @input="formatearMAC"
            required 
            placeholder="AA-BB-CC-DD-EE-FF" 
            maxlength="17"
            class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
            :class="{ 'border-rose-400': erroresValidacion.direccion_mac }" 
          />
          <p class="text-xs text-slate-500 mt-1">Ingresa los 12 caracteres hexadecimales.</p>
          <p v-if="erroresValidacion.direccion_mac" class="text-xs text-rose-500 mt-1">{{ erroresValidacion.direccion_mac }}</p>
        </div>

        <!-- Checkbox Institucional -->
        <div class="bg-violet-50 border border-violet-100 rounded-xl p-4">
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" v-model="esInstitucional" class="w-5 h-5 text-violet-600 rounded focus:ring-violet-500" />
            <div>
              <span class="text-sm font-bold text-violet-800">¿Dispositivo perteneciente a la Institución?</span>
              <p class="text-xs text-violet-600 mt-0.5">Marca esta casilla si el equipo es un activo de la universidad.</p>
            </div>
          </label>
        </div>

        <!-- Campos si NO es institucional -->
        <div v-if="!esInstitucional" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Propietario *</label>
            <input v-model="form.propietario" required placeholder="Nombre y apellido" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" :class="{ 'border-rose-400': erroresValidacion.propietario }" />
            <p v-if="erroresValidacion.propietario" class="text-xs text-rose-500 mt-1">{{ erroresValidacion.propietario }}</p>
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Tipo de Personal *</label>
            <select v-model="form.tipo_personal" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="docente">Docente</option>
              <option value="administrativo">Administrativo</option>
              <option value="obrero">Obrero</option>
            </select>
          </div>
        </div>

        <!-- Mensaje si SÍ es institucional -->
        <div v-else class="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p class="text-sm font-bold text-slate-700">Propietario: <span class="text-blue-600">Perteneciente a la UPTMA Ext. Villa del Rosario</span></p>
          <p class="text-xs text-slate-500 mt-1">Este dispositivo se registrará como un activo de la institución.</p>
        </div>

        <div class="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
          <BaseButton variant="cancel" @click="modalAbierto = false" class="w-full sm:w-auto">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="guardando" class="w-full sm:w-auto">Guardar</BaseButton>
        </div>
      </form>
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