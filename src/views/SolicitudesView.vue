<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useSolicitudes } from '../composables/useSolicitudes'
import { useAuth } from '../composables/useAuth'
import { useNotificacionesStore } from '../stores/notificaciones'
import BaseModal from '../components/ui/BaseModal.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import { generarPlanillasPDF } from '../utils/generarPlanilla.js'

const auth = useAuth()
const toast = useNotificacionesStore()
const { solicitudes, cargando, estadisticas, listar, crear, registrarDevolucion } = useSolicitudes()

const equiposDisponibles = ref([])
const filtros = ref({ estado: '', tipo_solicitante: '' })
const modalAbierto = ref(false)
const modalDevolucionAbierto = ref(false)
const solicitudSeleccionada = ref(null)
const guardando = ref(false)

const form = ref(getFormVacio())

function getFormVacio() {
  return {
    equipo_id: '',
    tipo_solicitante: 'docente',
    nombre_completo: '',
    cedula: '',
    telefono: '',
    pnf: '',
    con_extension: false,
    con_cable_hdmi: false,
    con_cable_vga: false,
    con_caja: true,
    con_alimentador: true,
    fecha_solicitud: '',
    observaciones: '',
  }
}

const formDevolucion = ref({ observaciones: '', conNovedad: false, fecha_devolucion: '' })

onMounted(async () => {
  await Promise.all([cargarEquipos(), refrescar()])
})

async function cargarEquipos() {
  const { data } = await supabase
    .from('equipos')
    .select('codigo_bien_publico, marca, modelo, categoria_id, categorias(nombre)')
    .in('categoria_id', [6, 7])
    .eq('estado', 'activo')
    .order('codigo_bien_publico')
  equiposDisponibles.value = data || []
}

async function refrescar() {
  await listar(filtros.value)
}

function abrirCrear() {
  form.value = getFormVacio()
  modalAbierto.value = true
}

async function onGuardar() {
  if (!form.value.equipo_id || !form.value.nombre_completo) {
    toast.advertencia('Debes seleccionar un equipo y un nombre.')
    return
  }
  if (!form.value.fecha_solicitud) {
    toast.advertencia('Debes seleccionar la fecha de solicitud.')
    return
  }

  guardando.value = true
  const res = await crear({
    ...form.value,
    fecha_solicitud: form.value.fecha_solicitud ? new Date(form.value.fecha_solicitud).toISOString() : null,
  })
  guardando.value = false
  
  if (res.ok) {
    modalAbierto.value = false
    toast.exito('Solicitud registrada correctamente')
    await refrescar()
  } else {
    toast.error(res.error)
  }
}

function abrirDevolucion(solicitud) {
  solicitudSeleccionada.value = solicitud
  formDevolucion.value = { observaciones: '', conNovedad: false, fecha_devolucion: '' }
  modalDevolucionAbierto.value = true
}

async function confirmarDevolucion() {
  if (!formDevolucion.value.observaciones.trim()) {
    toast.advertencia('Debes escribir una observación.')
    return
  }
  guardando.value = true
  const res = await registrarDevolucion(
    solicitudSeleccionada.value.id,
    formDevolucion.value.observaciones,
    formDevolucion.value.conNovedad,
    formDevolucion.value.fecha_devolucion || null
  )
  guardando.value = false

  if (res.ok) {
    modalDevolucionAbierto.value = false
    toast.exito(formDevolucion.value.conNovedad ? 'Devolución registrada con novedad' : 'Devolución registrada correctamente')
    await refrescar()
  } else {
    toast.error(res.error)
  }
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

async function generarPlanillasDelDia() {
  const solicitudesParaPlanilla = solicitudes.value
  if (solicitudesParaPlanilla.length === 0) {
    toast.advertencia('No hay solicitudes en la lista para generar planillas.')
    return
  }
  await generarPlanillasPDF(solicitudesParaPlanilla)
  toast.exito(`Se generó el reporte con ${solicitudesParaPlanilla.length} solicitudes.`)
}

const maxSemana = computed(() => Math.max(...estadisticas.value.porSemana.map(s => s.valor), 1))
const maxMes = computed(() => Math.max(...estadisticas.value.porMes.map(m => m.valor), 1))
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-white">Solicitud de Equipos</h1>
        <p class="text-sm text-[#b8c4c2] mt-1">Gestión de préstamos de videobeam y proyectores.</p>
      </div>
      <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <BaseButton variant="secondary" @click="generarPlanillasDelDia" class="w-full sm:w-auto">Generar Planilla</BaseButton>
        <BaseButton v-if="auth.puedeEscribir" variant="primary" @click="abrirCrear" class="w-full sm:w-auto">Registrar solicitud</BaseButton>
      </div>
    </div>

    <!-- Tarjetas de Estadísticas -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-[#001e2b] border border-[#00684a]/50 rounded-2xl p-5">
        <p class="text-xs uppercase text-[#5c6c75] font-mono tracking-wider">Total solicitudes</p>
        <p class="text-3xl font-bold mt-2 text-white">{{ estadisticas.total }}</p>
      </div>
      <div class="bg-[#001e2b] border border-blue-500/30 rounded-2xl p-5">
        <p class="text-xs uppercase text-blue-400 font-mono tracking-wider">Prestados</p>
        <p class="text-3xl font-bold mt-2 text-blue-400">{{ estadisticas.prestados }}</p>
      </div>
      <div class="bg-[#001e2b] border border-[#00ed64]/30 rounded-2xl p-5">
        <p class="text-xs uppercase text-[#00ed64] font-mono tracking-wider">Devueltos</p>
        <p class="text-3xl font-bold mt-2 text-[#00ed64]">{{ estadisticas.devueltos }}</p>
      </div>
      <div class="bg-[#001e2b] border border-red-500/30 rounded-2xl p-5">
        <p class="text-xs uppercase text-red-400 font-mono tracking-wider">Con novedad</p>
        <p class="text-3xl font-bold mt-2 text-red-400">{{ estadisticas.con_novedad }}</p>
      </div>
    </div>

    <!-- Gráficos -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-[#001e2b] border border-[#00684a]/30 rounded-2xl p-6">
        <h3 class="text-sm font-bold text-white uppercase tracking-wide mb-4 font-mono">Uso por Semana</h3>
        <div class="space-y-3">
          <div v-for="s in estadisticas.porSemana" :key="s.label" class="space-y-1">
            <div class="flex justify-between text-sm">
              <span class="font-medium text-[#b8c4c2]">{{ s.label }}</span>
              <span class="font-bold text-white">{{ s.valor }}</span>
            </div>
            <div class="w-full h-2 bg-[#002b3b] rounded-full overflow-hidden">
              <div class="h-full bg-[#00ed64] rounded-full" :style="{ width: `${(s.valor / maxSemana) * 100}%` }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-[#001e2b] border border-[#00684a]/30 rounded-2xl p-6">
        <h3 class="text-sm font-bold text-white uppercase tracking-wide mb-4 font-mono">Uso por Mes</h3>
        <div class="space-y-3">
          <div v-for="m in estadisticas.porMes" :key="m.label" class="space-y-1">
            <div class="flex justify-between text-sm">
              <span class="font-medium text-[#b8c4c2]">{{ m.label }}</span>
              <span class="font-bold text-white">{{ m.valor }}</span>
            </div>
            <div class="w-full h-2 bg-[#002b3b] rounded-full overflow-hidden">
              <div class="h-full bg-[#006cfa] rounded-full" :style="{ width: `${(m.valor / maxMes) * 100}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-[#001e2b] border border-[#00684a]/30 rounded-2xl p-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select v-model="filtros.estado" class="bg-[#002b3b] border border-[#00684a]/50 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" @change="refrescar">
          <option value="">Todos los estados</option>
          <option value="prestado">Prestados</option>
          <option value="devuelto">Devueltos</option>
          <option value="con_novedad">Con novedad</option>
        </select>
        <select v-model="filtros.tipo_solicitante" class="bg-[#002b3b] border border-[#00684a]/50 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" @change="refrescar">
          <option value="">Todos los solicitantes</option>
          <option value="docente">Docentes</option>
          <option value="estudiante">Estudiantes</option>
        </select>
        <BaseButton variant="cancel" @click="filtros = { estado: '', tipo_solicitante: '' }; refrescar()" class="w-full">Limpiar filtros</BaseButton>
      </div>
    </div>

    <!-- Tabla de Solicitudes -->
    <div class="bg-[#001e2b] border border-[#00684a]/30 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
      <div v-if="cargando" class="p-8 text-center text-[#b8c4c2] animate-pulse">Cargando solicitudes...</div>

      <div v-else-if="solicitudes.length > 0" class="overflow-x-auto">
        <table class="w-full text-sm min-w-[900px]">
          <thead class="bg-[#002b3b] text-[#b8c4c2] text-left text-xs uppercase font-mono tracking-wider border-b border-[#00684a]/30">
            <tr>
              <th class="px-6 py-4 font-bold">Equipo</th>
              <th class="px-6 py-4 font-bold">Solicitante</th>
              <th class="px-6 py-4 font-bold">F. Solicitud</th>
              <th class="px-6 py-4 font-bold">F. Devolución</th>
              <th class="px-6 py-4 font-bold">Estado</th>
              <th class="px-6 py-4 text-right font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#00684a]/20">
            <tr v-for="s in solicitudes" :key="s.id" class="hover:bg-[#00ed64]/5 transition-colors">
              <td class="px-6 py-4">
                <p class="font-mono text-xs font-bold text-[#00ed64]">{{ s.equipos?.codigo_bien_publico }}</p>
                <p class="text-xs text-[#b8c4c2] mt-1">{{ s.equipos?.marca }} {{ s.equipos?.modelo }}</p>
              </td>
              <td class="px-6 py-4">
                <p class="font-bold text-white">{{ s.nombre_completo }}</p>
                <p class="text-xs text-[#b8c4c2]">C.I: {{ s.cedula || '—' }}</p>
                <p class="text-xs text-[#5c6c75] capitalize mt-0.5">{{ s.tipo_solicitante }} · {{ s.telefono }}</p>
              </td>
              <td class="px-6 py-4 text-xs text-[#b8c4c2] font-mono">{{ formatearFecha(s.fecha_solicitud) }}</td>
              <td class="px-6 py-4 text-xs text-[#b8c4c2] font-mono">{{ formatearFecha(s.fecha_devolucion) }}</td>
              <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border"
                  :class="{
                    'bg-blue-500/10 text-blue-400 border-blue-500/30': s.estado === 'prestado',
                    'bg-[#00ed64]/10 text-[#00ed64] border-[#00ed64]/30': s.estado === 'devuelto',
                    'bg-red-500/10 text-red-400 border-red-500/30': s.estado === 'con_novedad',
                  }">
                  {{ s.estado.replace('_', ' ') }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <BaseButton v-if="s.estado === 'prestado' && auth.puedeEscribir" size="sm" variant="warning" @click="abrirDevolucion(s)">
                  Devolución
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="p-8 text-center text-[#5c6c75]">No hay solicitudes registradas.</div>
    </div>

    <!-- MODAL: Nueva Solicitud -->
    <BaseModal :open="modalAbierto" title="Nueva Solicitud de Equipo" size="lg" @close="modalAbierto = false">
      <form class="space-y-5" @submit.prevent="onGuardar">
        
        <div>
          <label class="block text-sm font-bold text-[#b8c4c2] mb-1">Equipo a prestar *</label>
          <select v-model="form.equipo_id" required class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50">
            <option value="">— Seleccionar —</option>
            <option v-for="e in equiposDisponibles" :key="e.codigo_bien_publico" :value="e.codigo_bien_publico">
              {{ e.codigo_bien_publico }} — {{ e.marca }} {{ e.modelo }} ({{ e.categorias?.nombre }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-bold text-[#b8c4c2] mb-2">Tipo de solicitante *</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer text-white">
              <input type="radio" v-model="form.tipo_solicitante" value="docente" class="w-4 h-4 text-[#00ed64] bg-[#002b3b] border-[#00684a]" />
              <span class="text-sm font-medium">Docente</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer text-white">
              <input type="radio" v-model="form.tipo_solicitante" value="estudiante" class="w-4 h-4 text-[#00ed64] bg-[#002b3b] border-[#00684a]" />
              <span class="text-sm font-medium">Estudiante</span>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-[#b8c4c2] mb-1">Nombre completo *</label>
            <input v-model="form.nombre_completo" required placeholder="Ej: Juan Pérez" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" />
          </div>
          <div>
            <label class="block text-sm font-bold text-[#b8c4c2] mb-1">Cédula *</label>
            <input v-model="form.cedula" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="8" required placeholder="Ej: 12345678" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" @input="form.cedula = form.cedula.replace(/[^0-9]/g, '')" />
          </div>
          <div>
            <label class="block text-sm font-bold text-[#b8c4c2] mb-1">Teléfono</label>
            <input v-model="form.telefono" type="tel" placeholder="Ej: 0414-1234567" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-bold text-[#b8c4c2] mb-1">PNF de Adscripción</label>
            <select v-model="form.pnf" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50">
              <option value="">— Seleccionar PNF —</option>
              <option value="INFORMÁTICA">INFORMÁTICA</option>
              <option value="CONTADURÍA PÚBLICA">CONTADURÍA PÚBLICA</option>
              <option value="MEDICINA VETERINARIA">MEDICINA VETERINARIA</option>
              <option value="ADMINISTRACIÓN">ADMINISTRACIÓN</option>
              <option value="AGROALIMENTACIÓN">AGROALIMENTACIÓN</option>
            </select>
          </div>
        </div>

        <div class="bg-[#002b3b] rounded-xl p-4 border border-[#00684a]/30">
          <p class="text-sm font-bold text-white mb-3">Implementos entregados</p>
          <div class="grid grid-cols-2 gap-2">
            <label class="flex items-center gap-2 cursor-pointer text-[#b8c4c2] hover:text-white transition">
              <input type="checkbox" v-model="form.con_extension" class="w-4 h-4 rounded bg-[#001e2b] border-[#00684a] text-[#00ed64] focus:ring-[#00ed64]" />
              <span class="text-sm">Extensión eléctrica</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer text-[#b8c4c2] hover:text-white transition">
              <input type="checkbox" v-model="form.con_cable_hdmi" class="w-4 h-4 rounded bg-[#001e2b] border-[#00684a] text-[#00ed64] focus:ring-[#00ed64]" />
              <span class="text-sm">Cable HDMI</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer text-[#b8c4c2] hover:text-white transition">
              <input type="checkbox" v-model="form.con_cable_vga" class="w-4 h-4 rounded bg-[#001e2b] border-[#00684a] text-[#00ed64] focus:ring-[#00ed64]" />
              <span class="text-sm">Cable VGA</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer text-[#b8c4c2] hover:text-white transition">
              <input type="checkbox" v-model="form.con_alimentador" class="w-4 h-4 rounded bg-[#001e2b] border-[#00684a] text-[#00ed64] focus:ring-[#00ed64]" />
              <span class="text-sm">Alimentador</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer text-[#b8c4c2] hover:text-white transition">
              <input type="checkbox" v-model="form.con_caja" class="w-4 h-4 rounded bg-[#001e2b] border-[#00684a] text-[#00ed64] focus:ring-[#00ed64]" />
              <span class="text-sm">Caja del dispositivo</span>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-[#b8c4c2] mb-1">Fecha de Solicitud *</label>
            <input v-model="form.fecha_solicitud" type="datetime-local" required class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" />
          </div>
          <div>
            <label class="block text-sm font-bold text-[#b8c4c2] mb-1">Observaciones</label>
            <input v-model="form.observaciones" placeholder="Opcional" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="cancel" @click="modalAbierto = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="guardando">Registrar solicitud</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- MODAL: Devolución -->
    <BaseModal :open="modalDevolucionAbierto" title="Registrar Devolución" size="md" @close="modalDevolucionAbierto = false">
      <form class="space-y-4" @submit.prevent="confirmarDevolucion">
        <div class="bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-4 text-sm">
          <p class="font-bold text-white">{{ solicitudSeleccionada?.nombre_completo }}</p>
          <p class="text-[#00ed64] text-xs font-mono mt-1">{{ solicitudSeleccionada?.equipos?.marca }} {{ solicitudSeleccionada?.equipos?.modelo }}</p>
        </div>

        <div>
          <label class="block text-sm font-bold text-[#b8c4c2] mb-1">Fecha de devolución</label>
          <input v-model="formDevolucion.fecha_devolucion" type="datetime-local" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" />
        </div>

        <div>
          <label class="block text-sm font-bold text-[#b8c4c2] mb-1">Observaciones *</label>
          <textarea v-model="formDevolucion.observaciones" rows="3" required placeholder="Estado del equipo, accesorios faltantes..." class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" />
        </div>

        <label class="flex items-center gap-3 cursor-pointer bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <input type="checkbox" v-model="formDevolucion.conNovedad" class="w-5 h-5 rounded bg-[#001e2b] border-red-500 text-red-500 focus:ring-red-500" />
          <span class="text-sm font-bold text-red-400">¿Falta algún implemento? (Levantar acta)</span>
        </label>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="cancel" @click="modalDevolucionAbierto = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="guardando">Confirmar devolución</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>