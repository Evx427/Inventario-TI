import { supabase } from '../lib/supabase'

export function usePerifericos() {
  async function guardarPerifericos(equipoId, perifericos) {
    try {
      // 1. Borrar los periféricos anteriores (para edición)
      await supabase
        .from('perifericos_equipos')
        .delete()
        .eq('equipo_id', equipoId)

      // 2. Insertar los nuevos
      if (perifericos.length > 0) {
        const datosLimpios = perifericos.map(p => ({
          equipo_id: equipoId,
          tipo: p.tipo,
          marca: p.marca || null,
          modelo: p.modelo || null,
          codigo_bien_publico: p.codigo_bien_publico || 'No aplica',
          codigo_bien_privado: p.codigo_bien_privado || 'No aplica',
          conexion_video: p.tipo === 'monitor' ? (p.conexion_video || null) : null,
          estado: p.estado || 'bueno',
          observaciones: p.observaciones || null
        }))

        const { error } = await supabase
          .from('perifericos_equipos')
          .insert(datosLimpios)

        if (error) throw error
      }

      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  async function obtenerPerifericos(equipoId) {
    try {
      const { data, error } = await supabase
        .from('perifericos_equipos')
        .select('*')
        .eq('equipo_id', equipoId)

      if (error) throw error
      return { ok: true, data: data || [] }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  return { guardarPerifericos, obtenerPerifericos }
}