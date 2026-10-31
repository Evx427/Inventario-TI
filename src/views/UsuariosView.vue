<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useUsuarios } from '../composables/useUsuarios'
import { useNotificacionesStore } from '../stores/notificaciones'
import { supabase } from '../lib/supabase'
import BaseButton from '../components/ui/BaseButton.vue'
import BaseModal from '../components/ui/BaseModal.vue'

const auth = useAuth()
const toast = useNotificacionesStore()
const { usuarios, cargando, listar, invitarUsuario, actualizarRol, actualizarActivo, eliminarUsuario } = useUsuarios()

const roles = ref([])
const modalAbierto = ref(false)
const guardando = ref(false)

// Formulario de invitación
const form = ref({
  email: '',
  nombre_completo: '',
  rol_id: 2, // Usuario por defecto
})

onMounted(async () => {
  const { data } = await supabase.from('roles').select('*').order('id')
  roles.value = data || []
  await listar()
})

function abrirInvitar() {
  form.value = { email: '', nombre_completo: '', rol_id: 2 }
  modalAbierto.value = true
}

async function onInvitar() {
  if (!form.value.email.trim() || !form.value.nombre_completo.trim()) {
    toast.advertencia('Todos los campos son obligatorios.')
    return
  }

  // Validación básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.value.email)) {
    toast.advertencia('Ingresa un correo válido.')
    return
  }

  guardando.value = true
  const res = await invitarUsuario(
    form.value.email,
    form.value.nombre_completo,
    form.value.rol_id
  )
  guardando.value = false

  if (res.ok) {
    modalAbierto.value = false
    toast.exito(`Invitación enviada a ${form.value.email}`)
    await listar()
  } else {
    toast.error(res.error)
  }
}

async function cambiarRol(usuario, nuevoRolId) {
  if (usuario.id === auth.user.id) {
    toast.advertencia('No puedes cambiar tu propio rol.')
    return
  }

  const res = await actualizarRol(usuario.id, nuevoRolId, usuario.email)
  if (res.ok) {
    toast.exito(`Rol de ${usuario.email} actualizado`)
    await listar()
  } else {
    toast.error(res.error)
  }
}

async function toggleActivo(usuario) {
  if (usuario.id === auth.user.id) {
    toast.advertencia('No puedes desactivar tu propia cuenta.')
    return
  }

  const res = await actualizarActivo(usuario.id, !usuario.activo, usuario.email)
  if (res.ok) {
    toast.exito(`Usuario ${usuario.activo ? 'desactivado' : 'activado'}`)
    await listar()
  } else {
    toast.error(res.error)
  }
}

async function eliminarUsuarioConfirm(usuario) {
  if (usuario.id === auth.user.id) {
    toast.advertencia('No puedes eliminar tu propia cuenta.')
    return
  }

  if (!confirm(`¿Eliminar al usuario ${usuario.email}? Esta acción no se puede deshacer.`)) {
    return
  }

  const res = await eliminarUsuario(usuario.id, usuario.email)
  if (res.ok) {
    toast.exito(`Usuario ${usuario.email} eliminado`)
    await listar()
  } else {
    toast.error(res.error)
  }
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Administración de Usuarios</h1>
        <p class="text-sm text-slate-500 mt-1">
          Gestiona los roles y el acceso de los usuarios del sistema.
        </p>
      </div>
      <BaseButton variant="primary" @click="abrirInvitar">
        + Invitar usuario
      </BaseButton>
    </div>

    <div class="bg-white border border-orange-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
      <div v-if="cargando" class="p-8 text-center text-slate-500 animate-pulse">
        Cargando usuarios...
      </div>

      <table v-else-if="usuarios.length > 0" class="w-full text-sm min-w-[800px]">
        <thead class="bg-orange-50 text-orange-900 text-left">
          <tr>
            <th class="px-4 py-3 font-semibold">Usuario</th>
            <th class="px-4 py-3 font-semibold">Rol</th>
            <th class="px-4 py-3 font-semibold">Último acceso</th>
            <th class="px-4 py-3 font-semibold">Estado</th>
            <th class="px-4 py-3 font-semibold text-right">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-orange-100">
          <tr
            v-for="u in usuarios"
            :key="u.id"
            class="hover:bg-orange-50/50 transition"
            :class="u.id === auth.user.id ? 'bg-orange-50/30' : ''"
          >
            <td class="px-4 py-3">
              <p class="font-medium text-slate-800">
                {{ u.nombre_completo || 'Sin nombre' }}
                <span v-if="u.id === auth.user.id" class="text-xs text-orange-600 ml-2 font-normal">(Tú)</span>
              </p>
              <p class="text-xs text-slate-500">{{ u.email }}</p>
            </td>
            <td class="px-4 py-3">
              <select
                :value="u.rol_id"
                :disabled="u.id === auth.user.id"
                class="bg-white border border-orange-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-50 transition"
                @change="cambiarRol(u, $event.target.value)"
              >
                <option v-for="r in roles" :key="r.id" :value="r.id">
                  {{ r.nombre }}
                </option>
              </select>
            </td>
            <td class="px-4 py-3 text-xs text-slate-600">
              {{ formatearFecha(u.last_login) }}
            </td>
            <td class="px-4 py-3">
              <span
                class="px-2.5 py-1 rounded-md text-xs font-medium"
                :class="u.activo
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'"
              >
                {{ u.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="inline-flex gap-2">
                <button
                  :disabled="u.id === auth.user.id"
                  class="text-xs px-3 py-1.5 rounded-lg transition font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  :class="u.activo
                    ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'"
                  @click="toggleActivo(u)"
                >
                  {{ u.activo ? 'Desactivar' : 'Activar' }}
                </button>
                <button
                  :disabled="u.id === auth.user.id"
                  class="text-xs px-3 py-1.5 rounded-lg transition font-medium bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  @click="eliminarUsuarioConfirm(u)"
                >
                  Eliminar
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="p-8 text-center text-slate-500">
        No hay usuarios registrados.
      </div>
    </div>

    <!-- Modal de Invitación -->
    <BaseModal
      :open="modalAbierto"
      title="Invitar nuevo usuario"
      size="md"
      @close="modalAbierto = false"
    >
      <form class="space-y-4" @submit.prevent="onInvitar">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Nombre completo *</label>
          <input
            v-model="form.nombre_completo"
            required
            placeholder="Ej: Juan Pérez"
            class="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Correo electrónico *</label>
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="juan@correo.com"
            class="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Rol asignado *</label>
          <select
            v-model="form.rol_id"
            required
            class="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition"
          >
            <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.nombre }}</option>
          </select>
        </div>
        
        <p class="text-xs text-slate-500 bg-blue-50 p-3 rounded-lg border border-blue-100">
          ℹ️ Se enviará un correo de invitación. El usuario deberá hacer clic en el enlace para establecer su contraseña y acceder al sistema.
        </p>

        <div class="flex justify-end gap-2 pt-2">
          <BaseButton variant="cancel" @click="modalAbierto = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="guardando">Enviar invitación</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>