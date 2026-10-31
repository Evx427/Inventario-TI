import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const perfil = ref(null)
  const rol = ref(null)
  const loading = ref(false)
  const inicializado = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isSuperUsuario = computed(() => rol.value === 'SuperUsuario')
  const isUsuario = computed(() => rol.value === 'Usuario')
  const isVisor = computed(() => rol.value === 'Visor')
  const puedeEscribir = computed(
    () => rol.value === 'SuperUsuario' || rol.value === 'Usuario'
  )

  async function cargarPerfil() {
    if (!user.value) return

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*, roles(nombre)')
        .eq('id', user.value.id)
        .single()

      if (error) {
        console.error('Error cargando perfil:', error)
        // Fallback al metadata del JWT
        perfil.value = {
          nombre_completo: user.value.user_metadata?.nombre_completo || user.value.email,
        }
        rol.value = user.value.user_metadata?.rol || 'Usuario'
        return
      }

      perfil.value = data

      // `roles` puede venir como objeto o array
      let nombreRol = null
      if (data?.roles) {
        if (Array.isArray(data.roles)) {
          nombreRol = data.roles[0]?.nombre
        } else {
          nombreRol = data.roles.nombre
        }
      }

      rol.value = nombreRol || user.value.user_metadata?.rol || 'Usuario'
    } catch (err) {
      console.error('Error inesperado cargando perfil:', err)
      perfil.value = {
        nombre_completo: user.value.user_metadata?.nombre_completo || user.value.email,
      }
      rol.value = user.value.user_metadata?.rol || 'Usuario'
    }
  }

  async function init() {
    if (inicializado.value) return
    loading.value = true

    try {
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user ?? null

      if (user.value) {
        await cargarPerfil()
      }
    } catch (err) {
      console.error('Error inicializando auth:', err)
    } finally {
      loading.value = false
      inicializado.value = true
    }

    // Escuchar cambios de sesión (login, logout, refresh de token)
    supabase.auth.onAuthStateChange(async (_event, session) => {
      user.value = session?.user ?? null
      if (user.value) {
        await cargarPerfil()
      } else {
        perfil.value = null
        rol.value = null
      }
    })
  }

  async function login(email, password) {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      
      user.value = data.user
      
      // Actualizar last_login
      await supabase
        .from('usuarios')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.user.id)
      
      // Cargar perfil DESPUÉS del login
      await cargarPerfil()
      
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  async function register(email, password, nombreCompleto) {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre_completo: nombreCompleto } },
      })
      if (error) throw error
      return { ok: true, data }
    } catch (err) {
      return { ok: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  async function recuperarPassword(email) {
    loading.value = true
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  async function actualizarPassword(nuevaPassword) {
    loading.value = true
    try {
      const { error } = await supabase.auth.updateUser({ password: nuevaPassword })
      if (error) throw error
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

   async function logout() {
    loading.value = true
    try {
      await supabase.auth.signOut()
      
      // Limpieza profunda del estado de Pinia
      
      user.value = null
      perfil.value = null
      rol.value = null
      
      // Limpiar el almacenamiento local del navegador
      localStorage.removeItem('supabase.auth.token')
      sessionStorage.clear()
      
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      loading.value = false
    }
  }

  return {
    user, perfil, rol, loading, inicializado,
    isAuthenticated, isSuperUsuario, isUsuario, isVisor, puedeEscribir,
    init, login, register, recuperarPassword, actualizarPassword, logout, cargarPerfil,
  }
})