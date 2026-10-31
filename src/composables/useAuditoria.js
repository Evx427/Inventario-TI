import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export function useAuditoria() {
  const registros = ref([])
  const usuarios = ref([])
  const cargando = ref(false)
  const error = ref('')
  
  // Paginación
  const paginaActual = ref(1)
  const registrosPorPagina = 10
  const totalRegistros = ref(0)

  const estadisticas = ref({
    totalRegistros: 0,
    exitosos: 0,
    denegados: 0,
    logins: 0,
    logouts: 0,
    porAccion: {},
  })

  async function listar(filtros = {}, pagina = 1) {
    cargando.value = true
    error.value = ''
    paginaActual.value = pagina

    try {
      // 1. Construir la consulta base (con o sin filtros)
      let query = supabase.from('auditoria').select('*', { count: 'exact' })

      if (filtros.accion) query = query.eq('accion', filtros.accion)
      if (filtros.resultado) query = query.eq('resultado', filtros.resultado)
      if (filtros.usuario_email) query = query.ilike('usuario_email', `%${filtros.usuario_email}%`)

      // 2. Aplicar paginación (range)
      const desde = (pagina - 1) * registrosPorPagina
      const hasta = desde + registrosPorPagina - 1

      const { data, error: err, count } = await query
        .order('fecha', { ascending: false })
        .range(desde, hasta)

      if (err) throw err
      
      registros.value = data || []
      totalRegistros.value = count || 0
      
      // Las estadísticas se calculan sobre TODOS los registros (no solo los de la página)
      // Para no sobrecargar, haremos una consulta rápida solo para los contadores si es necesario,
      // o las calculamos sobre los filtros actuales.
      await calcularEstadisticas(filtros)

      return { ok: true, data: registros.value }
    } catch (err) {
      error.value = err.message
      return { ok: false, error: err.message }
    } finally {
      cargando.value = false
    }
  }

  // Calculamos estadísticas con una consulta ligera (solo trae los campos necesarios)
  async function calcularEstadisticas(filtros = {}) {
    let query = supabase.from('auditoria').select('accion, resultado')
    
    if (filtros.accion) query = query.eq('accion', filtros.accion)
    if (filtros.resultado) query = query.eq('resultado', filtros.resultado)
    if (filtros.usuario_email) query = query.ilike('usuario_email', `%${filtros.usuario_email}%`)

    const { data } = await query
    
    if (data) {
      const stats = {
        totalRegistros: data.length,
        exitosos: data.filter(r => r.resultado === 'exito').length,
        denegados: data.filter(r => r.resultado === 'denegado').length,
        logins: data.filter(r => r.accion === 'LOGIN').length,
        logouts: data.filter(r => r.accion === 'LOGOUT').length,
        porAccion: {},
      }

      data.forEach(r => {
        const accion = traducirAccion(r.accion)
        stats.porAccion[accion] = (stats.porAccion[accion] || 0) + 1
      })

      estadisticas.value = stats
    }
  }

  async function cargarUsuarios() {
    const { data, error: err } = await supabase
      .from('usuarios')
      .select('*, roles(id, nombre)')
      .order('created_at', { ascending: false })
    if (!err) usuarios.value = data || []
  }

  function traducirAccion(accion) {
    const mapa = {
      'LOGIN': 'Inicio de sesión',
      'LOGOUT': 'Cierre de sesión',
      'LOGIN_FALLIDO': 'Login fallido',
      'REGISTRO': 'Registro',
      'INSERT': 'Creación',
      'UPDATE': 'Actualización',
      'DELETE': 'Eliminación',
      'DELETE_EQUIPO_DENEGADO': 'Eliminación denegada',
      'DELETE_CATEGORIA_DENEGADO': 'Eliminación categoría denegada',
      'INVITACION_USUARIO': 'Invitación de usuario',
      'CAMBIO_ROL': 'Cambio de rol',
      'USUARIO_ACTIVADO': 'Activación de usuario',
      'USUARIO_DESACTIVADO': 'Desactivación de usuario',
      'PASSWORD_ACTUALIZADA': 'Cambio de contraseña',
      'RECUPERAR_PASSWORD': 'Recuperación de contraseña',
      'ACCION_DENEGADA': 'Acción denegada',
    }
    return mapa[accion] || accion
  }

  // Función para ir a una página específica
  async function irAPagina(numeroPagina, filtros) {
    await listar(filtros, numeroPagina)
  }

  return {
    registros, usuarios, cargando, error, estadisticas,
    paginaActual, registrosPorPagina, totalRegistros,
    listar, cargarUsuarios, traducirAccion, irAPagina
  }
}