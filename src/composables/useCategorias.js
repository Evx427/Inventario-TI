import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { registrarAuditoria } from './useAudit'

export function useCategorias() {
  const categorias = ref([])
  const cargando = ref(false)
  const error = ref('')

  async function listar() {
    cargando.value = true
    error.value = ''
    try {
      const { data, error: err } = await supabase
        .from('categorias')
        .select('*')
        .order('id', { ascending: true })

      if (err) throw err
      categorias.value = data || []
      return { ok: true, data: categorias.value }
    } catch (err) {
      error.value = err.message
      return { ok: false, error: err.message }
    } finally {
      cargando.value = false
    }
  }

  async function crear(nombre, descripcion = null) {
    try {
      const { data, error: err } = await supabase
        .from('categorias')
        .insert({ nombre: nombre.trim(), descripcion: descripcion?.trim() || null })
        .select()
        .single()

      if (err) throw err
      return { ok: true, data }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  async function actualizar(id, nombre, descripcion = null) {
    try {
      const { error: err } = await supabase
        .from('categorias')
        .update({ nombre: nombre.trim(), descripcion: descripcion?.trim() || null })
        .eq('id', id)

      if (err) throw err
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  async function eliminar(id) {
    try {
      const { count, error: errCount } = await supabase
        .from('equipos')
        .select('*', { count: 'exact', head: true })
        .eq('categoria_id', id)

      if (errCount) throw errCount

      if (count > 0) {
        await registrarAuditoria({
          accion: 'DELETE_CATEGORIA_DENEGADO',
          tabla: 'categorias',
          registroId: String(id),
          resultado: 'denegado',
          metadata: { motivo: 'Categoría tiene equipos asociados' },
        })
        return {
          ok: false,
          error: `No se puede eliminar: hay ${count} equipo(s) usando esta categoría.`,
        }
      }

      const { error: err } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id)

      if (err) throw err
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  return { categorias, cargando, error, listar, crear, actualizar, eliminar }
}