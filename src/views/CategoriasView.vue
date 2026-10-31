<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useCategorias } from '../composables/useCategorias'
import { useNotificacionesStore } from '../stores/notificaciones'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseModal from '../components/ui/BaseModal.vue'

const auth = useAuth()
const toast = useNotificacionesStore()
const { categorias, cargando, listar, crear, actualizar, eliminar } = useCategorias()

const modalAbierto = ref(false)
const categoriaEditando = ref(null)
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
    toast.exito(categoriaEditando.value ? 'Categoría actualizada correctamente' : 'Categoría creada con éxito')
    await listar()
  } else {
    toast.error(res.error)
  }
}

async function eliminarCategoria(cat) {
  if (!confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return

  const res = await eliminar(cat.id)
  if (res.ok) {
    toast.exito('Categoría eliminada correctamente')
    await listar()
  } else {
    toast.error(res.error)
  }
}

const puedeEliminar = computed(() => auth.isSuperUsuario)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Categorías</h1>
        <p class="text-sm text-slate-500 mt-1">Clasificación de los equipos del inventario.</p>
      </div>
      <BaseButton v-if="auth.puedeEscribir" variant="primary" @click="abrirCrear">
        Registrar categoría
      </BaseButton>
    </div>

    <div class="bg-white border border-orange-200 rounded-xl overflow-hidden shadow-sm">
      <div v-if="cargando" class="p-8 text-center text-slate-500 animate-pulse">
        Cargando categorías...
      </div>

      <table v-else-if="categorias.length > 0" class="w-full text-sm">
        <thead class="bg-orange-50 text-orange-900 text-left">
          <tr>
            <th class="px-4 py-3 font-semibold w-16">ID</th>
            <th class="px-4 py-3 font-semibold">Nombre</th>
            <th class="px-4 py-3 font-semibold">Descripción</th>
            <th class="px-4 py-3 font-semibold text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-orange-100">
          <tr v-for="cat in categorias" :key="cat.id" class="hover:bg-orange-50/50 transition">
            <td class="px-4 py-3 text-slate-500 font-mono text-xs">{{ cat.id }}</td>
            <td class="px-4 py-3 font-medium text-slate-800">{{ cat.nombre }}</td>
            <td class="px-4 py-3 text-slate-600">{{ cat.descripcion || '—' }}</td>
            <td class="px-4 py-3 text-right">
              <div class="inline-flex gap-2">
                <BaseButton
                  v-if="auth.puedeEscribir"
                  size="sm"
                  variant="secondary"
                  @click="abrirEditar(cat)"
                >
                  Editar
                </BaseButton>
                <BaseButton
                  v-if="puedeEliminar"
                  size="sm"
                  variant="danger"
                  @click="eliminarCategoria(cat)"
                >
                  Eliminar
                </BaseButton>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="p-8 text-center text-slate-500">
        No hay categorías registradas.
      </div>
    </div>

    <BaseModal
      :open="modalAbierto"
      :title="categoriaEditando ? 'Editar categoría' : 'Nueva categoría'"
      size="md"
      @close="modalAbierto = false"
    >
      <form class="space-y-4" @submit.prevent="onGuardar">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
          <input
            v-model="nombre"
            required
            placeholder="Ej: Impresora"
            class="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
          <textarea
            v-model="descripcion"
            rows="3"
            placeholder="Descripción opcional"
            class="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
          />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="cancel" @click="modalAbierto = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="guardando">Guardar</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>