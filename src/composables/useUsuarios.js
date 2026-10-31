import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { registrarAuditoria } from './useAudit'

export function useUsuarios() {
  const usuarios = ref([])
  const cargando = ref(false)
  const error = ref('')

  async function listar() {
    cargando.value = true
    error.value = ''
    try {
      const { data, error: err } = await supabase
        .from('usuarios')
        .select('*, roles(id, nombre)')
        .order('created_at', { ascending: false })

      if (err) throw err
      usuarios.value = data || []
      return { ok: true, data: usuarios.value }
    } catch (err) {
      error.value = err.message
      return { ok: false, error: err.message }
    } finally {
      cargando.value = false
    }
  }

  /**
   * Invita a un nuevo usuario por correo electrónico.
   * El usuario recibirá un email para establecer su contraseña.
   */
  async function invitarUsuario(email, nombreCompleto, rolId) {
  try {
    const { data, error } = await supabase.functions.invoke('invite-user', {
      body: { email, nombre_completo: nombreCompleto, rol_id: rolId },
    })

    if (error) {
      // Esto te mostrará el mensaje real de la función
      const errorBody = await error.context?.json()
      console.error('Detalle del error de la Edge Function:', errorBody)
      throw new Error(errorBody?.error || error.message)
    }

    if (data?.error) throw new Error(data.error)

    await registrarAuditoria({
      accion: 'INVITACION_USUARIO',
      tabla: 'usuarios',
      resultado: 'exito',
      metadata: { email, rol_id: rolId },
    })

    return { ok: true, data }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

  async function actualizarRol(id, rolId, email) {
    try {
      const { error: err } = await supabase
        .from('usuarios')
        .update({ rol_id: parseInt(rolId) })
        .eq('id', id)

      if (err) throw err

      await registrarAuditoria({
        accion: 'CAMBIO_ROL',
        tabla: 'usuarios',
        registroId: id,
        resultado: 'exito',
        metadata: { email, nuevo_rol_id: rolId },
      })

      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  async function actualizarActivo(id, activo, email) {
    try {
      const { error: err } = await supabase
        .from('usuarios')
        .update({ activo })
        .eq('id', id)

      if (err) throw err

      await registrarAuditoria({
        accion: activo ? 'USUARIO_ACTIVADO' : 'USUARIO_DESACTIVADO',
        tabla: 'usuarios',
        registroId: id,
        resultado: 'exito',
        metadata: { email },
      })

      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  async function eliminarUsuario(id, email) {
    try {
      // Solo se puede eliminar si no está activo (por seguridad)
      const { error: err } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id)

      if (err) throw err

      await registrarAuditoria({
        accion: 'ELIMINAR_USUARIO',
        tabla: 'usuarios',
        registroId: id,
        resultado: 'exito',
        metadata: { email },
      })

      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  return { 
    usuarios, 
    cargando, 
    error, 
    listar, 
    invitarUsuario,
    actualizarRol, 
    actualizarActivo,
    eliminarUsuario
  }
}