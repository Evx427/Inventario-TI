import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { registrarAuditoria } from './useAudit'

export function useSolicitudes() {
  const solicitudes = ref([])
  const cargando = ref(false)
  const error = ref('')
  const estadisticas = ref({
    total: 0,
    prestados: 0,
    devueltos: 0,
    con_novedad: 0,
    porSemana: [],
    porMes: [],
  })

  async function listar(filtros = {}) {
    cargando.value = true
    error.value = ''
    try {
      let query = supabase
        .from('solicitudes')
        .select(`*, equipos(codigo_bien_publico, marca, modelo)`)
        .order('fecha_solicitud', { ascending: false })

      if (filtros.estado) query = query.eq('estado', filtros.estado)
      if (filtros.tipo_solicitante) query = query.eq('tipo_solicitante', filtros.tipo_solicitante)

      const { data, error: err } = await query
      if (err) throw err
      solicitudes.value = data || []
      calcularEstadisticas()
      return { ok: true, data: solicitudes.value }
    } catch (err) {
      error.value = err.message
      return { ok: false, error: err.message }
    } finally {
      cargando.value = false
    }
  }

  async function crear(solicitud) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const { data, error: err } = await supabase
        .from('solicitudes')
        .insert({
          ...solicitud,
          created_by: session?.user?.id ?? null,
        })
        .select()
        .single()

      if (err) throw err
      
      await registrarAuditoria({
        accion: 'INSERT_SOLICITUD',
        tabla: 'solicitudes',
        registroId: data.id,
        resultado: 'exito',
        metadata: { equipo_id: solicitud.equipo_id, tipo_solicitante: solicitud.tipo_solicitante },
      })

      return { ok: true, data }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

 async function registrarDevolucion(id, observaciones, conNovedad = false, fechaDevolucion = null) {
  try {
    const updateData = {
      estado: conNovedad ? 'con_novedad' : 'devuelto',
      observaciones,
      fecha_devolucion: fechaDevolucion ? new Date(fechaDevolucion).toISOString() : new Date().toISOString(),
    }

    const { error: err } = await supabase
      .from('solicitudes')
      .update(updateData)
      .eq('id', id)

    if (err) throw err

    await registrarAuditoria({
      accion: conNovedad ? 'DEVOLUCION_CON_NOVEDAD' : 'DEVOLUCION_EQUIPO',
      tabla: 'solicitudes',
      registroId: id,
      resultado: 'exito',
      metadata: { observaciones },
    })

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

  function calcularEstadisticas() {
    // Totales
    estadisticas.value.total = solicitudes.value.length
    estadisticas.value.prestados = solicitudes.value.filter(s => s.estado === 'prestado').length
    estadisticas.value.devueltos = solicitudes.value.filter(s => s.estado === 'devuelto').length
    estadisticas.value.con_novedad = solicitudes.value.filter(s => s.estado === 'con_novedad').length

    // Agrupar por semana (últimas 4 semanas)
    const semanas = {}
    const hoy = new Date()
    for (let i = 3; i >= 0; i--) {
      const d = new Date(hoy)
      d.setDate(d.getDate() - (i * 7))
      const key = `Sem ${getSemanaDelAno(d)}`
      semanas[key] = 0
    }

    // Agrupar por mes (últimos 6 meses)
    const meses = {}
    const nombresMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy)
      d.setMonth(d.getMonth() - i)
      meses[nombresMeses[d.getMonth()]] = 0
    }

    solicitudes.value.forEach(s => {
      const fecha = new Date(s.fecha_solicitud)
      const diffDias = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24))
      
      if (diffDias <= 28) {
        const semana = Math.floor(diffDias / 7)
        const d = new Date(hoy)
        d.setDate(d.getDate() - (semana * 7))
        const key = `Sem ${getSemanaDelAno(d)}`
        if (semanas[key] !== undefined) semanas[key]++
      }

      if (diffDias <= 180) {
        const mes = nombresMeses[fecha.getMonth()]
        if (meses[mes] !== undefined) meses[mes]++
      }
    })

    estadisticas.value.porSemana = Object.entries(semanas).map(([label, valor]) => ({ label, valor }))
    estadisticas.value.porMes = Object.entries(meses).map(([label, valor]) => ({ label, valor }))
  }

  function getSemanaDelAno(d) {
    const onejan = new Date(d.getFullYear(), 0, 1)
    return Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7)
  }

  return { solicitudes, cargando, error, estadisticas, listar, crear, registrarDevolucion }
}