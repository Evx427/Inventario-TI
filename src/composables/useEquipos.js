  import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { registrarAuditoria } from './useAudit'

export function useEquipos() {
  const equipos = ref([])
  const totalEquipos = ref(0) 
  const cargando = ref(false)
  const error = ref('')
  
  async function listar(filtros = {}, pagina = 1) {
    cargando.value = true
    error.value = ''
    
    const porPagina = 10
    const desde = (pagina - 1) * porPagina
    const hasta = desde + porPagina - 1

    try {
      let query = supabase
        .from('equipos')
        .select(`
          *,
          categorias:categoria_id (id, nombre),
          sistemas_operativos:so_id (id, nombre, familia)
        `, { count: 'exact' }) 
        .order ('created_at', { ascending: false })

      // Filtros opcionales
      if (filtros.categoria_id) {
        query = query.eq('categoria_id', filtros.categoria_id)
      }
      if (filtros.estado) {
        query = query.eq('estado', filtros.estado)
      }
      if (filtros.busqueda) {
        const b = `%${filtros.busqueda}%`
        query = query.or(
          `codigo_bien_publico.ilike.${b},codigo_bien_privado.ilike.${b},marca.ilike.${b},modelo.ilike.${b},numero_serie.ilike.${b}`
        )
      }

     // Aplicar paginación
      const { data, error: err, count } = await query.range(desde, hasta)
      
      if (err) throw err
      
      equipos.value = data || []
      totalEquipos.value = count || 0 // <-- ASIGNACIÓN CRUCIAL
      
      return { ok: true, data: equipos.value }
    } catch (err) {
      error.value = err.message
      return { ok: false, error: err.message }
    } finally {
      cargando.value = false
    }
  }

  /**
   * Obtiene un equipo con TODOS sus componentes de hardware.
   */
  async function obtener(codigoPublico) {
    try {
      const { data: equipo, error: err1 } = await supabase
        .from('equipos')
        .select(`
          *,
          categorias:categoria_id (id, nombre),
          sistemas_operativos:so_id (id, nombre, familia)
        `)
        .eq('codigo_bien_publico', codigoPublico)
        .single()

      if (err1) throw err1

      const { data: hardware, error: err2 } = await supabase
        .from('hardware_equipos')
        .select('*')
        .eq('equipo_id', codigoPublico)

      if (err2) throw err2

      return { ok: true, data: { ...equipo, hardware: hardware || [] } }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  /**
   * Crea un equipo con sus componentes de hardware.
   */
  async function crear(equipo, hardware = []) {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      // 1. Sanitizar datos del equipo
      const equipoLimpio = {
        codigo_bien_publico: equipo.codigo_bien_publico,
        codigo_bien_privado: equipo.codigo_bien_privado || null,
        categoria_id: equipo.categoria_id ? parseInt(equipo.categoria_id) : null,
        marca: equipo.marca || null,
        modelo: equipo.modelo || null,
        numero_serie: equipo.numero_serie || null,
        fecha_registro: equipo.fecha_registro || null,
        fecha_fabricacion: equipo.fecha_fabricacion || null,
        estado: equipo.estado || 'activo',
        so_id: equipo.so_id ? parseInt(equipo.so_id) : null,
        so_version_exacta: equipo.so_version_exacta || null,
        so_compilacion: equipo.so_compilacion || null,
        ubicacion: equipo.ubicacion || null,
        notas: equipo.notas || null,    
        //created_by: session?.user?.id ?? null,
      }

      const { data, error: err } = await supabase
        .from('equipos')
        .insert(equipoLimpio)
        .select()
        .single()

      if (err) throw err

      // 2. Insertar hardware sanitizado
      if (hardware.length > 0) {
        const hardwareLimpio = hardware
          .map((h) => {
            if (!h.tipo) return null
            return {
              equipo_id: data.codigo_bien_publico,
              tipo: h.tipo,
              marca: h.marca || null,
              modelo: h.modelo || null,
              identificador: h.identificador || null,
              tipo_ram: h.tipo === 'ram' ? (h.tipo_ram || null) : null,
              cantidad_modulos:
                h.tipo === 'ram' && h.cantidad_modulos
                  ? parseInt(h.cantidad_modulos)
                  : null,
              tipo_almacenamiento:
                h.tipo === 'almacenamiento' ? (h.tipo_almacenamiento || null) : null,
              capacidad_gb:
                h.tipo === 'almacenamiento' && h.capacidad_gb
                  ? parseInt(h.capacidad_gb)
                  : null,
              detalles: h.detalles || {},
            }
          })
          .filter(Boolean)

        if (hardwareLimpio.length > 0) {
          const { error: err2 } = await supabase
            .from('hardware_equipos')
            .insert(hardwareLimpio)

          if (err2) {
            console.error('Error insertando hardware:', err2)
            return { ok: false, error: `Equipo creado pero hardware falló: ${err2.message}` }
          }
        }
      }

      return { ok: true, data }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  /**
   * Actualiza un equipo y sus componentes.
   */
  async function actualizar(codigoPublico, equipo, hardware = []) {
    try {
      // Sanitizar datos
      const equipoLimpio = {
        codigo_bien_privado: equipo.codigo_bien_privado || null,
        categoria_id: equipo.categoria_id ? parseInt(equipo.categoria_id) : null,
        marca: equipo.marca || null,
        modelo: equipo.modelo || null,
        numero_serie: equipo.numero_serie || null,
        fecha_registro: equipo.fecha_registro || null,
        fecha_fabricacion: equipo.fecha_fabricacion || null,
        estado: equipo.estado || 'activo',
        so_id: equipo.so_id ? parseInt(equipo.so_id) : null,
        so_version_exacta: equipo.so_version_exacta || null,
        so_compilacion: equipo.so_compilacion || null,
        ubicacion: equipo.ubicacion || null,
        notas: equipo.notas || null,
      }

      const { error: err } = await supabase
        .from('equipos')
        .update(equipoLimpio)
        .eq('codigo_bien_publico', codigoPublico)

      if (err) throw err

      // Borrar hardware viejo
      const { error: errDel } = await supabase
        .from('hardware_equipos')
        .delete()
        .eq('equipo_id', codigoPublico)

      if (errDel) throw errDel

      // Reinsertar sanitizado
      if (hardware.length > 0) {
        const hardwareLimpio = hardware
          .map((h) => {
            if (!h.tipo) return null
            return {
              equipo_id: codigoPublico,
              tipo: h.tipo,
              marca: h.marca || null,
              modelo: h.modelo || null,
              identificador: h.identificador || null,
              tipo_ram: h.tipo === 'ram' ? (h.tipo_ram || null) : null,
              cantidad_modulos:
                h.tipo === 'ram' && h.cantidad_modulos
                  ? parseInt(h.cantidad_modulos)
                  : null,
              tipo_almacenamiento:
                h.tipo === 'almacenamiento' ? (h.tipo_almacenamiento || null) : null,
              capacidad_gb:
                h.tipo === 'almacenamiento' && h.capacidad_gb
                  ? parseInt(h.capacidad_gb)
                  : null,
              detalles: h.detalles || {},
            }
          })
          .filter(Boolean)

        if (hardwareLimpio.length > 0) {
          const { error: err2 } = await supabase
            .from('hardware_equipos')
            .insert(hardwareLimpio)
          if (err2) throw err2
        }
      }

      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  /**
   * Elimina un equipo. Si RLS lo bloquea, se registra intento denegado.
   */
  async function eliminar(codigoPublico) {
    try {
      const { error: err } = await supabase
        .from('equipos')
        .delete()
        .eq('codigo_bien_publico', codigoPublico)

      if (err) {
        await registrarAuditoria({
          accion: 'DELETE_EQUIPO_DENEGADO',
          tabla: 'equipos',
          registroId: codigoPublico,
          resultado: 'denegado',
          metadata: { motivo: err.message },
        })
        throw err
      }
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  
  const totalReportes = ref(0) // Paginacion de registros totales

  async function obtenerParaReporte(filtros = {}, pagina = 1) {
    const porPagina = 10
    const desde = (pagina - 1) * porPagina
    const hasta = desde + porPagina - 1

    try {
      let query = supabase
        .from('equipos')
        .select(`
          *,
          categorias:categoria_id (nombre),
          hardware_equipos (tipo, marca, modelo, tipo_ram, cantidad_modulos, tipo_almacenamiento, capacidad_gb)
        `, { count: 'exact' }) // <-- IMPORTANTE: Para saber el total
        .order('fecha_registro', { ascending: false })

      if (filtros.fecha_desde) query = query.gte('fecha_registro', filtros.fecha_desde)
      if (filtros.fecha_hasta) query = query.lte('fecha_registro', filtros.fecha_hasta)
      if (filtros.categoria_id) query = query.eq('categoria_id', filtros.categoria_id)
      if (filtros.ubicacion) query = query.eq('ubicacion', filtros.ubicacion)
      if (filtros.estado) query = query.eq('estado', filtros.estado)

      // Aplicar paginación
      const { data, error: err, count } = await query.range(desde, hasta)
      
      if (err) throw err
      
      totalReportes.value = count || 0
      
      return { ok: true, data: data || [] }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }


  return {
    equipos,
    totalEquipos,
    totalReportes,
    cargando,
    error,
    listar,
    obtener,
    crear,
    actualizar,
    eliminar,
    obtenerParaReporte  
  }
  }
