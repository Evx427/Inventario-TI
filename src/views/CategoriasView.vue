<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useCategorias } from '../composables/useCategorias'
import { useNotificacionesStore } from '../stores/notificaciones'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import ConfirmModal from '../components/ui/ConfirmModal.vue'

const auth = useAuth()
const toast = useNotificacionesStore()
const { categorias, cargando, listar, crear, actualizar, eliminar } = useCategorias()

const modalAbierto = ref(false)
const modalConfirmAbierto = ref(false)
const categoriaEditando = ref(null)
const categoriaAEliminar = ref(null)
const nombre = ref('')
const descripcion = ref('')
const guardando = ref(false)

onMounted(async () => {
  await listar()
})

function abrirCrear() {
  categoriaEditando.value = null
  nombre.value = ''
  descripcion.value = ''
  modalAbierto.value = true
}

function abrirEditar(cat) {
  categoriaEditando.value = cat
  nombre.value = cat.nombre
  descripcion.value = cat.descripcion || ''
  modalAbierto.value = true
}

async function onGuardar() {
  if (!nombre.value.trim()) {
    toast.advertencia('El nombre de la categoría es obligatorio.')
    return
  }

  guardando.value = true
  const res = categoriaEditando.value
    ? await actualizar(categoriaEditando.value.id, nombre.value, descripcion.value)
    : await crear(nombre.value, descripcion.value)
  guardando.value = false

  if (res.ok) {
    modalAbierto.value = false
    toast.exito(categoriaEditando.value ? 'Categoría actualizada' : 'Categoría creada')
    await listar()
  } else {
    toast.error(res.error)
  }
}

function pedirConfirmacionEliminar(cat) {
  categoriaAEliminar.value = cat
  modalConfirmAbierto.value = true
}

async function ejecutarEliminar() {
  if (!categoriaAEliminar.value) return
  const id = categoriaAEliminar.value.id
  modalConfirmAbierto.value = false

  const res = await eliminar(id)
  if (res.ok) {
    toast.exito('Categoría eliminada')
    await listar()
  } else {
    toast.error(res.error)
  }
  categoriaAEliminar.value = null
}

const puedeEliminar = computed(() => auth.isSuperUsuario)
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Categorías</h1>
        <p class="text-sm text-[#b8c4c2] mt-1">Clasificación de los equipos del inventario.</p>
      </div>
      <BaseButton v-if="auth.puedeEscribir" variant="primary" @click="abrirCrear" class="w-full sm:w-auto">
        + Nueva categoría
      </BaseButton>
    </div>

    <!-- Tabla -->
    <div class="bg-[#001e2b] border border-[#00684a]/30 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
      <div v-if="cargando" class="p-8 text-center text-[#b8c4c2] animate-pulse">Cargando categorías...</div>

      <div v-else-if="categorias.length > 0" class="overflow-x-auto">
        <table class="w-full text-sm min-w-[600px]">
          <thead class="bg-[#002b3b] text-[#b8c4c2] text-left text-xs uppercase font-mono tracking-wider border-b border-[#00684a]/30">
            <tr>
              <th class="px-6 py-4 font-bold w-20">ID</th>
              <th class="px-6 py-4 font-bold">Nombre</th>
              <th class="px-6 py-4 font-bold">Descripción</th>
              <th class="px-6 py-4 text-right font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#00684a]/20">
            <tr v-for="cat in categorias" :key="cat.id" class="hover:bg-[#00ed64]/5 transition-colors">
              <td class="px-6 py-4 font-mono text-xs text-[#5c6c75]">{{ cat.id }}</td>
              <td class="px-6 py-4 font-bold text-white">{{ cat.nombre }}</td>
              <td class="px-6 py-4 text-[#b8c4c2]">{{ cat.descripcion || '—' }}</td>
              <td class="px-6 py-4 text-right">
                <div class="inline-flex gap-2">
                  <BaseButton v-if="auth.puedeEscribir" size="sm" variant="secondary" @click="abrirEditar(cat)">
                    Editar
                  </BaseButton>
                  <BaseButton v-if="puedeEliminar" size="sm" variant="danger" @click="pedirConfirmacionEliminar(cat)">
                    Eliminar
                  </BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="p-8 text-center text-[#5c6c75]">No hay categorías registradas.</div>
    </div>

    <!-- Modal Formulario -->
    <BaseModal :open="modalAbierto" :title="categoriaEditando ? 'Editar categoría' : 'Nueva categoría'" size="md" @close="modalAbierto = false">
      <form class="space-y-4" @submit.prevent="onGuardar">
        <div>
          <label class="block text-sm font-bold text-[#b8c4c2] mb-1">Nombre *</label>
          <input v-model="nombre" required placeholder="Ej: Impresora" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50 transition" />
        </div>
        <div>
          <label class="block text-sm font-bold text-[#b8c4c2] mb-1">Descripción</label>
          <textarea v-model="descripcion" rows="3" placeholder="Descripción opcional" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50 transition" />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="cancel" @click="modalAbierto = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="guardando">Guardar</BaseButton>
        </div>
      </form>
    </BaseModal>

    <!-- Modal Confirmación -->
    <ConfirmModal
      :open="modalConfirmAbierto"
      title="¡Cuidado!"
      :message="`¿Eliminar la categoría '${categoriaAEliminar?.nombre}'? Si tiene equipos asociados, no se podrá eliminar.`"
      confirm-text="Sí, eliminar"
      @confirm="ejecutarEliminar"
      @cancel="modalConfirmAbierto = false; categoriaAEliminar = null"
    />
  </div>
</template>