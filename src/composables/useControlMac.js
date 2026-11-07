import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { registrarAuditoria } from './useAudit'

export function useControlMac() {
  const dispositivos = ref([])
  const totalRegistros = ref(0)
  const cargando = ref(false)
  const error = ref('')

    async function listar(filtros = {}, pagina = 1, traerTodo = false) {
    cargando.value = true
    error.value = ''

    const porPagina = 10
    const desde = (pagina - 1) * porPagina
    const hasta = desde + porPagina - 1

    try {
      let query = supabase
        .from('control_mac')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (filtros.busqueda) {
        const b = `%${filtros.busqueda}%`
        query = query.or(`marca.ilike.${b},modelo.ilike.${b},propietario.ilike.${b},direccion_mac.ilike.${b}`)
      }
      if (filtros.tipo_personal) {
        query = query.eq('tipo_personal', filtros.tipo_personal)
      }

      // Atrae todo los registros 
      if (!traerTodo) {
        query = query.range(desde, hasta)
      }

      const { data, error: err, count } = await query

      if (err) throw err

      dispositivos.value = data || []
      totalRegistros.value = count || 0
      
      return { ok: true, data: dispositivos.value }
    } catch (err) {
      error.value = err.message
      return { ok: false, error: err.message }
    } finally {
      cargando.value = false
    }
  }

  async function crear(dispositivo) {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      // Asegurarnos de guardar la MAC en mayúsculas
      const macFormateada = dispositivo.direccion_mac.toUpperCase()

      const { data, error: err } = await supabase
        .from('control_mac')
        .insert({
          ...dispositivo,
          direccion_mac: macFormateada,
          created_by: session?.user?.id ?? null
        })
        .select()
        .single()

      if (err) throw err

      await registrarAuditoria({
        accion: 'INSERT_CONTROL_MAC',
        tabla: 'control_mac',
        registroId: data.id,
        resultado: 'exito',
        metadata: { propietario: dispositivo.propietario }
      })

      return { ok: true, data }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  async function actualizar(id, dispositivo) {
    try {
      const macFormateada = dispositivo.direccion_mac.toUpperCase()

      const { error: err } = await supabase
        .from('control_mac')
        .update({
          ...dispositivo,
          direccion_mac: macFormateada
        })
        .eq('id', id)

      if (err) throw err

      await registrarAuditoria({
        accion: 'UPDATE_CONTROL_MAC',
        tabla: 'control_mac',
        registroId: id,
        resultado: 'exito'
      })

      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  async function eliminar(id) {
    try {
      const { error: err } = await supabase
        .from('control_mac')
        .delete()
        .eq('id', id)

      if (err) throw err

      await registrarAuditoria({
        accion: 'DELETE_CONTROL_MAC',
        tabla: 'control_mac',
        registroId: id,
        resultado: 'exito'
      })

      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  return { dispositivos, totalRegistros, cargando, error, listar, crear, actualizar, eliminar }
}