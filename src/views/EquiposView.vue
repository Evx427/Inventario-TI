<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useEquipos } from '../composables/useEquipos'
import { useAuth } from '../composables/useAuth'
import { useNotificacionesStore } from '../stores/notificaciones'
import BaseModal from '../components/ui/BaseModal.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import ConfirmModal from '../components/ui/ConfirmModal.vue'
import EquipoDetalleModal from '../components/ui/EquipoDetalleModal.vue'
import EquipoForm from '../components/forms/EquipoForm.vue'
import { usePerifericos } from '../composables/usePerifericos'

const auth = useAuth()
const toast = useNotificacionesStore()

const { equipos, totalEquipos, cargando, listar, crear, actualizar, obtener, eliminar } = useEquipos()
const { guardarPerifericos } = usePerifericos()

const categorias = ref([])
const filtros = ref({ busqueda: '', categoria_id: '', estado: '' })

// Paginación
const paginaActual = ref(1)
const registrosPorPagina = 10

// Modales
const modalFormAbierto = ref(false)
const modalDetalleAbierto = ref(false)
const modalConfirmAbierto = ref(false)

const equipoEditando = ref(null)
const equipoDetalle = ref(null)
const equipoAEliminar = ref(null)

onMounted(async () => {
  const { data } = await supabase.from('categorias').select('*').order('id')
  categorias.value = data || []
  await refrescar()
})

async function refrescar(pagina = 1) {
  paginaActual.value = pagina
  await listar(filtros.value, pagina)
}

function aplicarFiltros() {
  refrescar(1)
}

const totalPaginas = computed(() => Math.ceil(totalEquipos.value / registrosPorPagina))

function cambiarPagina(nuevaPagina) {
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas.value) return
  refrescar(nuevaPagina)
}

// --- Acciones ---
function abrirCrear() {
  equipoEditando.value = null
  modalFormAbierto.value = true
}

async function abrirEditar(codigo) {
  const res = await obtener(codigo)
  if (res.ok) {
    equipoEditando.value = res.data
    modalFormAbierto.value = true
  } else {
    toast.error(res.error)
  }
}

async function abrirDetalle(codigo) {
  const res = await obtener(codigo)
  if (res.ok) {
    equipoDetalle.value = res.data
    modalDetalleAbierto.value = true
  } else {
    toast.error(res.error)
  }
}

function pedirConfirmacionEliminar(equipo) {
  equipoAEliminar.value = equipo
  modalConfirmAbierto.value = true
}

async function ejecutarEliminar() {
  if (!equipoAEliminar.value) return
  
  const codigo = equipoAEliminar.value.codigo_bien_publico
  modalConfirmAbierto.value = false
  
  const res = await eliminar(codigo)
  if (res.ok) {
    toast.exito('Equipo eliminado del inventario')
    await refrescar(paginaActual.value)
  } else {
    toast.error(res.error)
  }
  equipoAEliminar.value = null
}

async function onGuardar({ equipo, hardware, perifericos }) {
  let res

  // 1. Guardar (o actualizar) el equipo y su hardware
  if (equipoEditando.value) {
    res = await actualizar(equipoEditando.value.codigo_bien_publico, equipo, hardware)
  } else {
    res = await crear(equipo, hardware)
  }

  // 2. Si el equipo se guardó con éxito, guardar los periféricos (solo si vienen)
  if (res.ok && perifericos && perifericos.length > 0) {
    const codigoEquipo = equipoEditando.value
      ? equipoEditando.value.codigo_bien_publico
      : equipo.codigo_bien_publico

    const resPeri = await guardarPerifericos(codigoEquipo, perifericos)
    if (!resPeri.ok) {
      toast.error('Equipo guardado, pero periféricos fallaron: ' + resPeri.error)
      return
    }
  }

  // 3. Mostrar resultado final
  if (res.ok) {
    modalFormAbierto.value = false
    toast.exito(equipoEditando.value ? 'Equipo actualizado correctamente' : 'Equipo registrado con éxito')
    await refrescar(paginaActual.value)
  } else {
    toast.error('Error: ' + res.error)
  }
}

const puedeEliminar = computed(() => auth.isSuperUsuario)
</script>

<template>
  <div>
    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Equipos</h1>
        <p class="text-sm text-slate-500 mt-1">Gestión de los equipos del inventario.</p>
      </div>
      <BaseButton v-if="auth.puedeEscribir" variant="primary" @click="abrirCrear" class="w-full sm:w-auto">
        + Nuevo equipo
      </BaseButton>
    </div>

    <!-- Filtros -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <input v-model="filtros.busqueda" placeholder="Buscar..." class="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" @input="aplicarFiltros" />
      <select v-model="filtros.categoria_id" class="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" @change="aplicarFiltros">
        <option value="">Todas las categorías</option>
        <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
      </select>
      <select v-model="filtros.estado" class="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" @change="aplicarFiltros">
        <option value="">Todos los estados</option>
        <option value="activo">Activo</option>
        <option value="reparacion">En reparación</option>
        <option value="baja">De baja</option>
      </select>
      <BaseButton variant="cancel" @click="filtros = { busqueda: '', categoria_id: '', estado: '' }; aplicarFiltros()" class="w-full">
        Limpiar filtros
      </BaseButton>
    </div>

    <!-- Tabla de Equipos -->
    <div class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      <div v-if="cargando" class="p-8 text-center text-slate-500 animate-pulse">Cargando equipos...</div>

      <!-- Contenedor responsivo de la tabla -->
      <div v-else-if="equipos.length > 0" class="overflow-x-auto w-full">
        <table class="w-full text-sm min-w-[800px]">
          <thead class="bg-slate-50 text-slate-500 text-left text-xs uppercase font-bold">
            <tr>
              <th class="px-4 py-4">Código público</th>
              <th class="px-4 py-4">Categoría</th>
              <th class="px-4 py-4">Marca / Modelo</th>
              <th class="px-4 py-4">Estado</th>
              <th class="px-4 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="eq in equipos" :key="eq.codigo_bien_publico" class="hover:bg-blue-50/30 transition-colors">
              <td class="px-4 py-3 font-mono text-xs font-semibold text-slate-500">{{ eq.codigo_bien_publico }}</td>
              <td class="px-4 py-3 text-slate-600 font-medium">{{ eq.categorias?.nombre || '—' }}</td>
              <td class="px-4 py-3 text-slate-700 font-medium">
                {{ [eq.marca, eq.modelo].filter(Boolean).join(' / ') || '—' }}
              </td>
              <td class="px-4 py-3">
                <span class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border"
                  :class="{
                    'bg-emerald-50 text-emerald-600 border-emerald-200': eq.estado === 'activo',
                    'bg-amber-50 text-amber-600 border-amber-200': eq.estado === 'reparacion',
                    'bg-rose-50 text-rose-600 border-rose-200': eq.estado === 'baja',
                  }">
                  {{ eq.estado }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="inline-flex gap-1.5">
                  <BaseButton size="sm" variant="ghost" @click="abrirDetalle(eq.codigo_bien_publico)">
                    Ver
                  </BaseButton>
                  <BaseButton v-if="auth.puedeEscribir" size="sm" variant="secondary" @click="abrirEditar(eq.codigo_bien_publico)">
                    Editar
                  </BaseButton>
                  <BaseButton v-if="puedeEliminar" size="sm" variant="danger" @click="pedirConfirmacionEliminar(eq)">
                    Eliminar
                  </BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="p-8 text-center text-slate-500">No hay equipos registrados.</div>

      <!-- Paginación -->
      <div v-if="totalPaginas > 1" class="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <p class="text-xs font-medium text-slate-500">
          Mostrando <span class="font-bold text-slate-700">{{ (paginaActual - 1) * registrosPorPagina + 1 }}</span> 
          a 
          <span class="font-bold text-slate-700">{{ Math.min(paginaActual * registrosPorPagina, totalEquipos) }}</span> 
          de <span class="font-bold text-slate-700">{{ totalEquipos }}</span> equipos
        </p>
        <div class="flex items-center gap-2">
          <button :disabled="paginaActual === 1" class="px-3 py-1.5 rounded-lg text-xs font-bold border" :class="paginaActual === 1 ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-700 hover:bg-slate-50'" @click="cambiarPagina(paginaActual - 1)">Anterior</button>
          <span class="text-xs font-bold text-slate-700 px-2">Página {{ paginaActual }} de {{ totalPaginas }}</span>
          <button :disabled="paginaActual === totalPaginas" class="px-3 py-1.5 rounded-lg text-xs font-bold border" :class="paginaActual === totalPaginas ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-700 hover:bg-slate-50'" @click="cambiarPagina(paginaActual + 1)">Siguiente</button>
        </div>
      </div>
    </div>

    <!-- MODAL 1: Formulario Crear/Editar -->
    <BaseModal :open="modalFormAbierto" :title="equipoEditando ? 'Editar equipo' : 'Nuevo equipo'" size="xl" @close="modalFormAbierto = false">
      <EquipoForm :equipo="equipoEditando" @guardar="onGuardar" @cancelar="modalFormAbierto = false" />
    </BaseModal>

    <!-- MODAL 2: Vista de Detalles -->
    <EquipoDetalleModal 
      :open="modalDetalleAbierto" 
      :equipo="equipoDetalle" 
      :puede-editar="auth.puedeEscribir"
      @close="modalDetalleAbierto = false"
      @editar="(eq) => { modalDetalleAbierto = false; abrirEditar(eq.codigo_bien_publico) }"
    />

    <!-- MODAL 3: Confirmación de Eliminación -->
    <ConfirmModal
      :open="modalConfirmAbierto"
      title="¡Cuidado colega!"
      :message="`¿Estás seguro de eliminar el equipo ${equipoAEliminar?.codigo_bien_publico}? Esta acción no se puede deshacer y se perderán todos sus componentes de hardware.`"
      confirm-text="Sí, eliminar equipo"
      @confirm="ejecutarEliminar"
      @cancel="modalConfirmAbierto = false; equipoAEliminar = null"
    />
  </div>
</template>