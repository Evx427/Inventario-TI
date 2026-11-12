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

const form = ref({
  email: '',
  nombre_completo: '',
  rol_id: 2,
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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(form.value.email)) {
    toast.advertencia('Ingresa un correo válido.')
    return
  }

  guardando.value = true
  const res = await invitarUsuario(form.value.email, form.value.nombre_completo, form.value.rol_id)
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
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">Administración de Usuarios</h1>
        <p class="text-sm text-[#b8c4c2] mt-1">Gestiona los roles y el acceso de los usuarios del sistema.</p>
      </div>
      <BaseButton variant="primary" @click="abrirInvitar" class="w-full sm:w-auto">
        + Invitar usuario
      </BaseButton>
    </div>

    <!-- Tabla -->
    <div class="bg-[#001e2b] border border-[#00684a]/30 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
      <div v-if="cargando" class="p-8 text-center text-[#b8c4c2] animate-pulse">Cargando usuarios...</div>

      <div v-else-if="usuarios.length > 0" class="overflow-x-auto">
        <table class="w-full text-sm min-w-[900px]">
          <thead class="bg-[#002b3b] text-[#b8c4c2] text-left text-xs uppercase font-mono tracking-wider border-b border-[#00684a]/30">
            <tr>
              <th class="px-6 py-4 font-bold">Usuario</th>
              <th class="px-6 py-4 font-bold">Rol</th>
              <th class="px-6 py-4 font-bold">Último acceso</th>
              <th class="px-6 py-4 font-bold">Estado</th>
              <th class="px-6 py-4 text-right font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#00684a]/20">
            <tr v-for="u in usuarios" :key="u.id" class="hover:bg-[#00ed64]/5 transition-colors" :class="u.id === auth.user.id ? 'bg-[#00ed64]/5' : ''">
              <td class="px-6 py-4">
                <p class="font-bold text-white">
                  {{ u.nombre_completo || 'Sin nombre' }}
                  <span v-if="u.id === auth.user.id" class="text-xs text-[#00ed64] ml-2 font-mono">(Tú)</span>
                </p>
                <p class="text-xs text-[#5c6c75]">{{ u.email }}</p>
              </td>
              <td class="px-6 py-4">
                <select
                  :value="u.rol_id"
                  :disabled="u.id === auth.user.id"
                  class="bg-[#002b3b] border border-[#00684a]/50 rounded-full px-3 py-1 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50 disabled:opacity-50"
                  @change="cambiarRol(u, $event.target.value)"
                >
                  <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.nombre }}</option>
                </select>
              </td>
              <td class="px-6 py-4 text-xs text-[#b8c4c2] font-mono">{{ formatearFecha(u.last_login) }}</td>
              <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase border"
                  :class="u.activo ? 'bg-[#00ed64]/10 text-[#00ed64] border-[#00ed64]/30' : 'bg-[#5c6c75]/20 text-[#5c6c75] border-[#5c6c75]/30'">
                  {{ u.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="inline-flex gap-2">
                  <button
                    :disabled="u.id === auth.user.id"
                    class="text-xs px-3 py-1.5 rounded-full transition font-bold disabled:opacity-40"
                    :class="u.activo ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30' : 'bg-[#00ed64]/20 text-[#00ed64] border border-[#00ed64]/30 hover:bg-[#00ed64]/30'"
                    @click="toggleActivo(u)"
                  >
                    {{ u.activo ? 'Desactivar' : 'Activar' }}
                  </button>
                  <button
                    :disabled="u.id === auth.user.id"
                    class="text-xs px-3 py-1.5 rounded-full transition font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-40"
                    @click="eliminarUsuarioConfirm(u)"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="p-8 text-center text-[#5c6c75]">No hay usuarios registrados.</div>
    </div>

    <!-- Modal Invitar -->
    <BaseModal :open="modalAbierto" title="Invitar nuevo usuario" size="md" @close="modalAbierto = false">
      <form class="space-y-4" @submit.prevent="onInvitar">
        <div>
          <label class="block text-sm font-bold text-[#b8c4c2] mb-1">Nombre completo *</label>
          <input v-model="form.nombre_completo" required placeholder="Ej: Juan Pérez" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" />
        </div>
        <div>
          <label class="block text-sm font-bold text-[#b8c4c2] mb-1">Correo electrónico *</label>
          <input v-model="form.email" type="email" required placeholder="juan@correo.com" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" />
        </div>
        <div>
          <label class="block text-sm font-bold text-[#b8c4c2] mb-1">Rol asignado *</label>
          <select v-model="form.rol_id" required class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50">
            <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.nombre }}</option>
          </select>
        </div>
        
        <p class="text-xs text-[#5c6c75] bg-[#002b3b] p-3 rounded-xl border border-[#00684a]/30">
          ℹ️ Se enviará un correo de invitación. El usuario deberá hacer clic en el enlace para establecer su contraseña.
        </p>

        <div class="flex justify-end gap-3 pt-2">
          <BaseButton variant="cancel" @click="modalAbierto = false">Cancelar</BaseButton>
          <BaseButton type="submit" variant="primary" :loading="guardando">Enviar invitación</BaseButton>
        </div>
      </form>
    </BaseModal>
  </div>
</template>