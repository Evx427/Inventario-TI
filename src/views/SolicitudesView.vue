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
    fecha_entrega: '',
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

  guardando.value = true
  const res = await crear({
    ...form.value,
    fecha_entrega: form.value.fecha_entrega ? new Date(form.value.fecha_entrega).toISOString() : null,
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
  const solicitudesActivas = solicitudes.value.filter(s => s.estado === 'prestado')

  if (solicitudesActivas.length === 0) {
    toast.advertencia('No hay solicitudes activas (prestadas) para generar planillas.')
    return
  }

  // Se generaS el PDF con la imagen
  await generarPlanillasPDF(solicitudesActivas)
  
  toast.exito(`Se generó el reporte con ${solicitudesActivas.length} solicitudes.`)
}

const maxSemana = computed(() => Math.max(...estadisticas.value.porSemana.map(s => s.valor), 1))
const maxMes = computed(() => Math.max(...estadisticas.value.porMes.map(m => m.valor), 1))
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Solicitud de Equipos</h1>
        <p class="text-sm text-slate-500 mt-1">Gestión de préstamos de videobeam y proyectores.</p>
      </div>

    <BaseButton variant="secondary" @click="generarPlanillasDelDia">
       Generar Planilla
    </BaseButton>

      <BaseButton v-if="auth.puedeEscribir" variant="primary" @click="abrirCrear">
        Registrar solicitud
      </BaseButton>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <p class="text-xs uppercase text-slate-400 font-bold">Total solicitudes</p>
        <p class="text-3xl font-bold mt-2 text-slate-800">{{ estadisticas.total }}</p>
      </div>
      <div class="bg-blue-50 border border-blue-100 rounded-2xl p-5 shadow-sm">
        <p class="text-xs uppercase text-blue-600 font-bold">Prestados</p>
        <p class="text-3xl font-bold mt-2 text-blue-700">{{ estadisticas.prestados }}</p>
      </div>
      <div class="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm">
        <p class="text-xs uppercase text-emerald-600 font-bold">Devueltos</p>
        <p class="text-3xl font-bold mt-2 text-emerald-700">{{ estadisticas.devueltos }}</p>
      </div>
      <div class="bg-rose-50 border border-rose-100 rounded-2xl p-5 shadow-sm">
        <p class="text-xs uppercase text-rose-600 font-bold">Con novedad</p>
        <p class="text-3xl font-bold mt-2 text-rose-700">{{ estadisticas.con_novedad }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Uso por Semana</h3>
        <div class="space-y-3">
          <div v-for="s in estadisticas.porSemana" :key="s.label" class="space-y-1">
            <div class="flex justify-between text-sm">
              <span class="font-medium text-slate-600">{{ s.label }}</span>
              <span class="font-bold text-slate-800">{{ s.valor }}</span>
            </div>
            <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-blue-500 rounded-full" :style="{ width: `${(s.valor / maxSemana) * 100}%` }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">Uso por Mes</h3>
        <div class="space-y-3">
          <div v-for="m in estadisticas.porMes" :key="m.label" class="space-y-1">
            <div class="flex justify-between text-sm">
              <span class="font-medium text-slate-600">{{ m.label }}</span>
              <span class="font-bold text-slate-800">{{ m.valor }}</span>
            </div>
            <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 rounded-full" :style="{ width: `${(m.valor / maxMes) * 100}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select v-model="filtros.estado" class="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" @change="refrescar">
          <option value="">Todos los estados</option>
          <option value="prestado">Prestados</option>
          <option value="devuelto">Devueltos</option>
          <option value="con_novedad">Con novedad</option>
        </select>
        <select v-model="filtros.tipo_solicitante" class="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" @change="refrescar">
          <option value="">Todos los solicitantes</option>
          <option value="docente">Docentes</option>
          <option value="estudiante">Estudiantes</option>
        </select>
        <BaseButton variant="cancel" @click="filtros = { estado: '', tipo_solicitante: '' }; refrescar()">Limpiar filtros</BaseButton>
      </div>
    </div>

    <div class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <div v-if="cargando" class="p-8 text-center text-slate-500 animate-pulse">Cargando solicitudes...</div>

      <table v-else-if="solicitudes.length > 0" class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-500 text-left text-xs uppercase font-bold">
          <tr>
            <th class="px-4 py-4">Equipo</th>
            <th class="px-4 py-4">Solicitante</th>
            <th class="px-4 py-4">F. Solicitud</th>
            <th class="px-4 py-4">F. Entrega</th>
            <th class="px-4 py-4">Estado</th>
            <th class="px-4 py-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="s in solicitudes" :key="s.id" class="hover:bg-blue-50/30 transition-colors">
            <td class="px-4 py-3">
              <p class="font-mono text-xs font-semibold text-slate-500">{{ s.equipos?.codigo_bien_publico }}</p>
              <p class="font-bold text-slate-800 text-xs">{{ s.equipos?.marca }} {{ s.equipos?.modelo }}</p>
            </td>
            <td class="px-4 py-3">
              <p class="font-bold text-slate-800">{{ s.nombre_completo }}</p>
              <p class="text-xs text-slate-500">C.I: {{ s.cedula || '—' }}</p>
              <p class="text-xs text-slate-500 capitalize">{{ s.tipo_solicitante }} · {{ s.telefono }}</p>
              <p v-if="s.pnf" class="text-xs text-slate-400">{{ s.pnf }}</p>
            </td>
            <td class="px-4 py-3 text-xs text-slate-600">{{ formatearFecha(s.fecha_solicitud) }}</td>
            <td class="px-4 py-3 text-xs text-slate-600">{{ formatearFecha(s.fecha_entrega) }}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-1 rounded-md text-[10px] font-bold uppercase border"
                :class="{
                  'bg-blue-50 text-blue-600 border-blue-200': s.estado === 'prestado',
                  'bg-emerald-50 text-emerald-600 border-emerald-200': s.estado === 'devuelto',
                  'bg-rose-50 text-rose-600 border-rose-200': s.estado === 'con_novedad',
                }">
                {{ s.estado.replace('_', ' ') }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <BaseButton v-if="s.estado === 'prestado' && auth.puedeEscribir" size="sm" variant="warning" @click="abrirDevolucion(s)">
                Devolución
              </BaseButton>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="p-8 text-center text-slate-400">No hay solicitudes registradas.</div>
    </div>

    <BaseModal :open="modalAbierto" title="Nueva Solicitud de Equipo" size="lg" @close="modalAbierto = false">
      <form class="space-y-5" @submit.prevent="onGuardar">
        
        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">Equipo a prestar *</label>
          <select v-model="form.equipo_id" required class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="">— Seleccionar —</option>
            <option v-for="e in equiposDisponibles" :key="e.codigo_bien_publico" :value="e.codigo_bien_publico">
              {{ e.codigo_bien_publico }} — {{ e.marca }} {{ e.modelo }} ({{ e.categorias?.nombre }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-2">Tipo de solicitante *</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="form.tipo_solicitante" value="docente" class="w-4 h-4 text-blue-500" />
              <span class="text-sm font-medium">Docente</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="form.tipo_solicitante" value="estudiante" class="w-4 h-4 text-blue-500" />
              <span class="text-sm font-medium">Estudiante</span>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Nombre completo *</label>
            <input v-model="form.nombre_completo" required placeholder="Ej: Juan Pérez" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">Cédula de Identidad *</label>
         <input 
          v-model="form.cedula" 
          type="text" 
          inputmode="numeric"
          pattern="[0-9]*"
          maxlength="8"
         required 
         placeholder="Ej: 12345678" 
         class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
        @input="form.cedula = form.cedula.replace(/[^0-9]/g, '')"
          />
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Teléfono</label>
            <input v-model="form.telefono" type="tel" placeholder="Ej: 0414-1234567" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-bold text-slate-700 mb-1">PNF de Adscripción</label>
            <select v-model="form.pnf" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <option value="">— Seleccionar PNF —</option>
            <option value="INFORMÁTICA">INFORMÁTICA</option>
            <option value="CONTADURÍA PÚBLICA">CONTADURÍA PÚBLICA</option>
            <option value="MEDICINA VETERINARIA">MEDICINA VETERINARIA</option>
            <option value="ADMINISTRACIÓN">ADMINISTRACIÓN</option>
            <option value="AGROALIMENTACIÓN">AGROALIMENTACIÓN</option>
         </select>
          </div>
        </div>

        <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
          <p class="text-sm font-bold text-slate-700 mb-3">Implementos entregados</p>
          <div class="grid grid-cols-2 gap-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.con_extension" class="w-4 h-4 text-blue-500 rounded" />
              <span class="text-sm">Extensión eléctrica</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.con_cable_hdmi" class="w-4 h-4 text-blue-500 rounded" />
              <span class="text-sm">Cable HDMI</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.con_cable_vga" class="w-4 h-4 text-blue-500 rounded" />
              <span class="text-sm">Cable VGA</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.con_alimentador" class="w-4 h-4 text-blue-500 rounded" />
              <span class="text-sm">Alimentador</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.con_caja" class="w-4 h-4 text-blue-500 rounded" />
              <span class="text-sm">Caja del dispositivo</span>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Fecha y hora de entrega</label>
            <input v-model="form.fecha_entrega" type="datetime-local" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label class="block text-sm font-bold text-slate-700 mb-1">Observaciones</label>
            <input v-model="form.observaciones" placeholder="Opcional" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="cancel" @click="modalAbierto = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="guardando">Registrar solicitud</BaseButton>
        </div>
      </form>
    </BaseModal>

    <BaseModal :open="modalDevolucionAbierto" title="Registrar Devolución" size="md" @close="modalDevolucionAbierto = false">
      <form class="space-y-4" @submit.prevent="confirmarDevolucion">
        <div class="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm">
          <p class="font-bold text-blue-800">{{ solicitudSeleccionada?.nombre_completo }}</p>
          <p class="text-blue-600 text-xs">{{ solicitudSeleccionada?.equipos?.marca }} {{ solicitudSeleccionada?.equipos?.modelo }}</p>
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">Fecha de devolución</label>
          <input v-model="formDevolucion.fecha_devolucion" type="datetime-local" class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 mb-1">Observaciones de la devolución *</label>
          <textarea v-model="formDevolucion.observaciones" rows="3" required placeholder="Estado del equipo, accesorios faltantes, etc." class="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
        </div>

        <label class="flex items-center gap-2 cursor-pointer bg-rose-50 border border-rose-100 rounded-xl p-3">
          <input type="checkbox" v-model="formDevolucion.conNovedad" class="w-4 h-4 text-rose-500 rounded" />
          <span class="text-sm font-bold text-rose-700">¿Falta algún implemento? (Levantar acta)</span>
        </label>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="cancel" @click="modalDevolucionAbierto = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="guardando">Confirmar devolución</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>