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

const auth = useAuth()
const toast = useNotificacionesStore()
const { equipos, totalEquipos, cargando, listar, crear, actualizar, obtener, eliminar } = useEquipos()
const { guardarPerifericos } = useEquipos() // Ajuste para no duplicar el composable si ya lo tienes

const categorias = ref([])
const filtros = ref({ busqueda: '', categoria_id: '', estado: '' })

const paginaActual = ref(1)
const registrosPorPagina = 10

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

  if (equipoEditando.value) {
    res = await actualizar(equipoEditando.value.codigo_bien_publico, equipo, hardware)
  } else {
    res = await crear(equipo, hardware)
  }

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
  <div class="space-y-6">
    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Equipos</h1>
        <p class="text-sm text-[#b8c4c2] mt-1">Gestión de los equipos del inventario.</p>
      </div>
      <BaseButton v-if="auth.puedeEscribir" variant="primary" @click="abrirCrear" class="w-full sm:w-auto">
        + Nuevo equipo
      </BaseButton>
    </div>

    <!-- Filtros -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <input v-model="filtros.busqueda" placeholder="Buscar..." class="bg-[#001e2b] border border-[#00684a]/50 rounded-full px-4 py-2.5 text-sm text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50 transition" @input="aplicarFiltros" />
      <select v-model="filtros.categoria_id" class="bg-[#001e2b] border border-[#00684a]/50 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50 transition" @change="aplicarFiltros">
        <option value="">Todas las categorías</option>
        <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
      </select>
      <select v-model="filtros.estado" class="bg-[#001e2b] border border-[#00684a]/50 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50 transition" @change="aplicarFiltros">
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
    <div class="bg-[#001e2b] border border-[#00684a]/30 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
      <div v-if="cargando" class="p-8 text-center text-[#b8c4c2] animate-pulse">Cargando equipos...</div>

      <div v-else-if="equipos.length > 0" class="overflow-x-auto w-full">
        <table class="w-full text-sm min-w-[800px]">
          <thead class="bg-[#002b3b] text-[#b8c4c2] text-left text-xs uppercase font-mono tracking-wider border-b border-[#00684a]/30">
            <tr>
              <th class="px-6 py-4 font-bold">Código público</th>
              <th class="px-6 py-4 font-bold">Categoría</th>
              <th class="px-6 py-4 font-bold">Marca / Modelo</th>
              <th class="px-6 py-4 font-bold">Estado</th>
              <th class="px-6 py-4 text-right font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#00684a]/20">
            <tr v-for="eq in equipos" :key="eq.codigo_bien_publico" class="hover:bg-[#00ed64]/5 transition-colors">
              <td class="px-6 py-4 font-mono text-xs font-bold text-[#00ed64]">{{ eq.codigo_bien_publico }}</td>
              <td class="px-6 py-4 text-[#b8c4c2]">{{ eq.categorias?.nombre || '—' }}</td>
              <td class="px-6 py-4 text-white font-medium">
                {{ [eq.marca, eq.modelo].filter(Boolean).join(' / ') || '—' }}
              </td>
              <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border"
                  :class="{
                    'bg-[#00ed64]/10 text-[#00ed64] border-[#00ed64]/30': eq.estado === 'activo',
                    'bg-amber-500/10 text-amber-400 border-amber-500/30': eq.estado === 'reparacion',
                    'bg-red-500/10 text-red-400 border-red-500/30': eq.estado === 'baja',
                  }">
                  {{ eq.estado }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="inline-flex gap-2">
                  <BaseButton size="sm" variant="ghost" @click="abrirDetalle(eq.codigo_bien_publico)">Ver</BaseButton>
                  <BaseButton v-if="auth.puedeEscribir" size="sm" variant="secondary" @click="abrirEditar(eq.codigo_bien_publico)">Editar</BaseButton>
                  <BaseButton v-if="puedeEliminar" size="sm" variant="danger" @click="pedirConfirmacionEliminar(eq)">Eliminar</BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="p-8 text-center text-[#5c6c75]">No hay equipos registrados.</div>

      <!-- Paginación -->
      <div v-if="totalPaginas > 1" class="px-6 py-4 border-t border-[#00684a]/30 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#001e2b]">
        <p class="text-xs font-mono text-[#b8c4c2]">
          Mostrando <span class="font-bold text-white">{{ (paginaActual - 1) * registrosPorPagina + 1 }}</span> 
          a 
          <span class="font-bold text-white">{{ Math.min(paginaActual * registrosPorPagina, totalEquipos) }}</span> 
          de <span class="font-bold text-white">{{ totalEquipos }}</span> equipos
        </p>
        <div class="flex items-center gap-2">
          <button :disabled="paginaActual === 1" class="px-4 py-1.5 rounded-full text-xs font-bold transition-colors border" :class="paginaActual === 1 ? 'bg-[#5c6c75]/20 text-[#5c6c75] border-[#5c6c75]/30 cursor-not-allowed' : 'bg-transparent text-white border-[#5c6c75] hover:border-[#00ed64] hover:text-[#00ed64]'" @click="cambiarPagina(paginaActual - 1)">Anterior</button>
          <span class="text-xs font-mono font-bold text-[#00ed64] px-2">Página {{ paginaActual }} de {{ totalPaginas }}</span>
          <button :disabled="paginaActual === totalPaginas" class="px-4 py-1.5 rounded-full text-xs font-bold transition-colors border" :class="paginaActual === totalPaginas ? 'bg-[#5c6c75]/20 text-[#5c6c75] border-[#5c6c75]/30 cursor-not-allowed' : 'bg-transparent text-white border-[#5c6c75] hover:border-[#00ed64] hover:text-[#00ed64]'" @click="cambiarPagina(paginaActual + 1)">Siguiente</button>
        </div>
      </div>
    </div>

    <!-- MODAL 1: Formulario -->
    <BaseModal :open="modalFormAbierto" :title="equipoEditando ? 'Editar equipo' : 'Nuevo equipo'" size="xl" @close="modalFormAbierto = false">
      <EquipoForm :equipo="equipoEditando" @guardar="onGuardar" @cancelar="modalFormAbierto = false" />
    </BaseModal>

    <!-- MODAL 2: Detalles -->
    <EquipoDetalleModal 
      :open="modalDetalleAbierto" 
      :equipo="equipoDetalle" 
      :puede-editar="auth.puedeEscribir"
      @close="modalDetalleAbierto = false"
      @editar="(eq) => { modalDetalleAbierto = false; abrirEditar(eq.codigo_bien_publico) }"
    />

    <!-- MODAL 3: Confirmación -->
    <ConfirmModal
      :open="modalConfirmAbierto"
      title="¡Cuidado colega!"
      :message="`¿Estás seguro de eliminar el equipo ${equipoAEliminar?.codigo_bien_publico}? Esta acción no se puede deshacer.`"
      confirm-text="Sí, eliminar"
      @confirm="ejecutarEliminar"
      @cancel="modalConfirmAbierto = false; equipoAEliminar = null"
    />
  </div>
</template>