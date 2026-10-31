import { useAuthStore } from '../stores/auth'
import { registrarAuditoria } from './useAudit'

export function useAuth() {
  const auth = useAuthStore()

  async function login(email, password) {
    const res = await auth.login(email, password)
    if (res.ok) {
      await registrarAuditoria({ accion: 'LOGIN', resultado: 'exito' })
    } else {
      await registrarAuditoria({
        accion: 'LOGIN_FALLIDO',
        resultado: 'error',
        metadata: { email, motivo: res.error },
      })
    }
    return res
  }

  async function logout() {
    await registrarAuditoria({ accion: 'LOGOUT', resultado: 'exito' })
    await auth.logout()
  }

  async function register(email, password, nombreCompleto) {
    const res = await auth.register(email, password, nombreCompleto)
    await registrarAuditoria({
      accion: 'REGISTRO',
      resultado: res.ok ? 'exito' : 'error',
      metadata: { email, motivo: res.error },
    })
    return res
  }

  async function recuperarPassword(email) {
    const res = await auth.recuperarPassword(email)
    await registrarAuditoria({
      accion: 'RECUPERAR_PASSWORD',
      resultado: res.ok ? 'exito' : 'error',
      metadata: { email },
    })
    return res
  }

  async function actualizarPassword(nuevaPassword) {
    const res = await auth.actualizarPassword(nuevaPassword)
    await registrarAuditoria({
      accion: 'PASSWORD_ACTUALIZADA',
      resultado: res.ok ? 'exito' : 'error',
    })
    return res
  }

  return {
    ...auth,
    login,
    logout,
    register,
    recuperarPassword,
    actualizarPassword,
  }
}