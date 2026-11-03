<script setup>
import { ref, computed } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuth } from './composables/useAuth'
import { useNotificacionesStore } from './stores/notificaciones'
import ToastContainer from './components/ui/ToastContainer.vue'
import PreLoader from './components/ui/PreLoader.vue'



const route = useRoute()
const router = useRouter()
const auth = useAuth()
const toast = useNotificacionesStore()
const menuAbierto = ref(false)

const mostrarConfirmacionSalir = ref(false)




// Menú con roles permitidos
const menuCompleto = [
  { to: '/', label: 'Inicio', icon: '🏠', roles: ['SuperUsuario', 'Usuario', 'Visor'] },
  { to: '/equipos', label: 'Equipos', icon: '💻', roles: ['SuperUsuario', 'Usuario',] },
  { to: '/categorias', label: 'Categorías', icon: '📁', roles: ['SuperUsuario', 'Usuario',] },
  { to: '/solicitudes', label: 'Solicitudes', icon: '📋', roles: ['SuperUsuario', 'Usuario', ] },
  { to: '/control-mac', label: 'Control MAC', icon: '📡', roles: ['SuperUsuario', 'Usuario', ] },
  { to: '/consultas', label: 'Consultas', icon: '❓', roles: ['SuperUsuario', 'Visor',] },
  { to: '/reportes', label: 'Reportes', icon: '📊', roles: ['SuperUsuario', 'Usuario', 'Visor'] },
  { to: '/auditoria', label: 'Auditoría', icon: '🔍', roles: ['SuperUsuario'] }, 
  { to: '/usuarios', label: 'Adm. Usuarios', icon: '👥', roles: ['SuperUsuario'] }, 
]

// Menú filtrado por rol (reactivo)
const menu = computed(() => {
  const rolActual = auth.rol
  if (!rolActual) return [] // Si aún no cargó el rol, no muestra nada
  return menuCompleto.filter(item => item.roles.includes(rolActual))
})

function isActive(path) {
  return route.path === path
}

async function confirmarCerrarSesion() {
  mostrarConfirmacionSalir.value = false
  await auth.logout()
  toast.info('Sesión cerrada correctamente')
  router.push('/login')
}

// Función para cerrar el menú al hacer clic en un enlace
function cerrarMenu() {
  menuAbierto.value = false
}

const esRutaAuth = computed(() =>
  ['/login', '/forgot-password', '/reset-password'].includes(route.path)
)
</script>

<template>
  <ToastContainer />
  <PreLoader />

  <RouterView v-if="esRutaAuth" />

  <!-- Fondo general -->
  <div v-else class="min-h-screen bg-blue-50/50 flex text-slate-800 font-sans">
    
    <!-- SIDEBAR: Morado semi-transparente -->
    <aside class="w-64 bg-violet-100/60 backdrop-blur-md border-r border-violet-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col fixed h-full z-10">
      
      <!-- Cabecera del Sidebar -->
      <div class="h-20 flex items-center gap-3 px-6 border-b border-violet-200/50">
        <!-- Logo circular -->
        <img src="/logito.png" alt="Logo Inventario TI" class="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm shrink-0" />
        <h1 class="text-xl font-bold text-slate-800 tracking-tight">Inventario TI</h1>
      </div>

      <!-- Navegación -->
      <nav class="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        <RouterLink
          v-for="item in menu"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
          :class="isActive(item.to)
            ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/30' 
            : 'text-slate-600 hover:bg-violet-200/50 hover:text-violet-800'"
        >
          <span class="text-lg opacity-80">{{ item.icon }}</span>
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- Perfil de Usuario -->
      <div class="p-4 border-t border-violet-200/50 bg-violet-50/50">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-violet-200 text-violet-700 flex items-center justify-center font-bold text-sm">
           {{ auth.perfil?.nombre_completo?.charAt(0) || auth.user?.email?.charAt(0) || 'U' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-slate-800 truncate">
              {{ auth.perfil?.nombre_completo || auth.user?.email || 'Usuario' }}
            </p>
            <!-- Rol en color morado -->
            <p class="text-xs text-violet-600 font-semibold truncate uppercase tracking-wider">
              {{ auth.rol || 'Cargando...' }}
            </p>
          </div>
        </div>
        <!-- Botón de Salir -->
        <button
          class="w-full text-xs bg-white/80 border border-rose-200 hover:bg-rose-50 text-rose-500 py-2.5 rounded-xl transition-all font-bold flex justify-center items-center gap-2"
          @click="mostrarConfirmacionSalir = true"
        >
          <span></span> Cerrar Sesión
        </button>
      </div>
    </aside>

    <!-- CONTENIDO PRINCIPAL -->
    <main class="flex-1 ml-64 flex flex-col min-h-screen">
      <!-- Header superior -->
      <header class="h-16 bg-white/40 backdrop-blur-sm border-b border-white flex items-center px-8">
        <h2 class="text-sm font-bold text-slate-400 uppercase tracking-widest">
          {{ menu.find(m => m.to === route.path)?.label || 'Sistema' }}
        </h2>
      </header>

      <!-- Vistas -->
      <div class="flex-1 p-8">
        <RouterView />
      </div>

      <!-- Footer -->
      <footer class="py-4 text-center text-xs font-semibold text-slate-400 border-t border-white/50">
        -Inventario TI- Todos los derechos reservados © 2026 · By Ever Garcia 
      </footer>
    </main>

    <!-- Modal de Confirmación de Salida -->
    <Teleport to="body">
      <div
        v-if="mostrarConfirmacionSalir"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm"
        @click.self="mostrarConfirmacionSalir = false"
      >
        <div class="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center border border-slate-100">
          <div class="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-2xl mx-auto mb-4">
            🚶‍♂️
          </div>
          <h3 class="text-xl font-bold text-slate-800 mb-2">¿Cerrar sesión?</h3>
          <p class="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
            Tendrás que introducir los datos si quieres acceder de nuevo al sistema.
          </p>
          <div class="flex gap-3 justify-center">
            <button
              class="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all text-sm w-full"
              @click="mostrarConfirmacionSalir = false"
            >
              Cancelar
            </button>
            <button
              class="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all text-sm shadow-md shadow-rose-500/30 w-full"
              @click="confirmarCerrarSesion"
            >
              Sí, cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>