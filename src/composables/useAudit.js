import { supabase } from '../lib/supabase'

let cachedIP = null

/**
 * Obtiene la IP pública del usuario (cachea el resultado).
 * Usa un servicio gratuito.
 */
async function getUserIP() {
  if (cachedIP) return cachedIP
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    const data = await res.json()
    cachedIP = data.ip
    return cachedIP
  } catch (err) {
    console.warn('No se pudo obtener la IP:', err)
    return null
  }
}

/**
 * Registra un evento en la tabla de auditoría.
 *
 * @param {Object} params
 * @param {string} params.accion       - 'LOGIN', 'LOGOUT', 'LOGIN_FALLIDO', 'ACCION_DENEGADA', ...
 * @param {string} [params.tabla]      - Tabla afectada (opcional)
 * @param {string} [params.registroId] - ID del registro afectado (opcional)
 * @param {string} [params.resultado]  - 'exito' | 'denegado' | 'error'
 * @param {Object} [params.metadata]   - Datos extra
 */
export async function registrarAuditoria({
  accion,
  tabla = null,
  registroId = null,
  resultado = 'exito',
  metadata = {},
}) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user

    const ip = await getUserIP()

    await supabase.from('auditoria').insert({
      tabla,
      registro_id: registroId,
      accion,
      resultado,
      usuario_id: user?.id ?? null,
      usuario_email: user?.email ?? null,
      ip,
      user_agent: navigator.userAgent,
      metadata,
    })
  } catch (err) {
    console.error('Error al registrar auditoría:', err)
  }
}