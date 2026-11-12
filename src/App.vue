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

const menuCompleto = [
  { to: '/', label: 'Inicio', icon: '🏠', roles: ['SuperUsuario', 'Usuario', 'Visor'] },
  { to: '/equipos', label: 'Equipos', icon: '💻', roles: ['SuperUsuario', 'Usuario',] },
  { to: '/categorias', label: 'Categorías', icon: '📁', roles: ['SuperUsuario', 'Usuario',] },
  { to: '/solicitudes', label: 'Solicitudes', icon: '📋', roles: ['SuperUsuario', 'Usuario', ] },
  { to: '/control-mac', label: 'Control MAC', icon: '📡', roles: ['SuperUsuario', 'Usuario', ] },
  { to: '/consultas', label: 'Consultas', icon: '❓', roles: ['SuperUsuario', 'Visor'] },
  { to: '/reportes', label: 'Reportes', icon: '📊', roles: ['SuperUsuario', 'Usuario', 'Visor'] },
  { to: '/auditoria', label: 'Auditoría', icon: '🔍', roles: ['SuperUsuario'] }, 
  { to: '/usuarios', label: 'Adm. Usuarios', icon: '👥', roles: ['SuperUsuario'] }, 
]

const menu = computed(() => {
  const rolActual = auth.rol
  if (!rolActual) return []
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

  <!-- Fondo general Teal-Black -->
  <div v-else class="min-h-screen bg-[#001e2b] flex text-white font-sans overflow-x-hidden">
    
    <!-- Fondo oscuro para móviles -->
    <div 
      v-if="menuAbierto" 
      class="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
      @click="menuAbierto = false"
    ></div>

    <!-- SIDEBAR: Estilo MongoDB -->
    <aside 
      class="w-64 bg-[#001e2b] border-r border-[#00684a]/30 flex flex-col fixed h-full z-50 transition-transform duration-300 ease-in-out lg:translate-x-0"
      :class="menuAbierto ? 'translate-x-0' : '-translate-x-full'"
    >
      
      <!-- Cabecera del Sidebar -->
      <div class="h-20 flex items-center gap-3 px-6 border-b border-[#00684a]/30">
        <img src="/logito.png" alt="Logo" class="w-10 h-10 rounded-full border-2 border-[#00ed64] object-cover shrink-0" />
        <h1 class="text-lg font-bold text-white tracking-tight">Inventario TI</h1>
      </div>

      <!-- Navegación -->
      <nav class="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <RouterLink
          v-for="item in menu"
          :key="item.to"
          :to="item.to"
          @click="cerrarMenu"
          class="flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200"
          :class="isActive(item.to)
            ? 'bg-[#00ed64]/10 text-[#00ed64] border border-[#00ed64]/30' 
            : 'text-[#b8c4c2] hover:bg-[#00684a]/20 hover:text-white border border-transparent'"
        >
          <span class="text-lg">{{ item.icon }}</span>
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- Perfil de Usuario -->
      <div class="p-4 border-t border-[#00684a]/30">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-[#00684a] border border-[#00ed64]/50 text-white flex items-center justify-center font-bold text-sm">
           {{ auth.perfil?.nombre_completo?.charAt(0) || auth.user?.email?.charAt(0) || 'U' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-white truncate">
              {{ auth.perfil?.nombre_completo || auth.user?.email || 'Usuario' }}
            </p>
            <p class="text-xs text-[#00ed64] font-mono uppercase tracking-wider truncate">
              {{ auth.rol || 'Cargando...' }}
            </p>
          </div>
        </div>
        <button
          class="w-full text-xs bg-transparent border border-[#5c6c75] hover:border-[#00ed64] hover:text-[#00ed64] text-[#b8c4c2] py-2.5 rounded-full transition-all font-bold flex justify-center items-center gap-2"
          @click="mostrarConfirmacionSalir = true"
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>

    <!-- CONTENIDO PRINCIPAL -->
    <main class="flex-1 lg:ml-64 flex flex-col min-h-screen w-full">
      
      <!-- Header superior -->
      <header class="h-16 bg-[#001e2b]/80 backdrop-blur-md border-b border-[#00684a]/30 flex items-center justify-between px-4 lg:px-8">
        <div class="flex items-center gap-3">
          <button 
            @click="menuAbierto = true"
            class="lg:hidden p-2 text-[#b8c4c2] hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <h2 class="text-sm font-bold text-[#b8c4c2] font-mono uppercase tracking-widest hidden sm:block">
            {{ menu.find(m => m.to === route.path)?.label || 'Sistema' }}
          </h2>
        </div>
        <div class="lg:hidden text-sm font-bold text-white">
          {{ auth.perfil?.nombre_completo?.split(' ')[0] || 'Usuario' }}
        </div>
      </header>

      <!-- Vistas -->
      <div class="flex-1 p-4 lg:p-8">
        <RouterView />
      </div>

      <!-- Footer -->
      <footer class="py-4 text-center text-xs font-mono text-[#5c6c75] border-t border-[#00684a]/30">
        Inventario TI · MongoDB Forest Neon Style © 2026
      </footer>
    </main>

    <!-- Modal de Confirmación de Salida -->
    <Teleport to="body">
      <div
        v-if="mostrarConfirmacionSalir"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="mostrarConfirmacionSalir = false"
      >
        <div class="bg-[#001e2b] border border-[#00684a]/50 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center">
          <h3 class="text-xl font-bold text-white mb-2">¿Cerrar sesión?</h3>
          <p class="text-sm text-[#b8c4c2] mb-6">
            Tendrás que introducir los datos si quieres acceder de nuevo al sistema.
          </p>
          <div class="flex gap-3 justify-center">
            <button
              class="px-5 py-2.5 rounded-full bg-transparent border border-[#5c6c75] text-[#b8c4c2] hover:text-white font-bold transition-all text-sm w-full"
              @click="mostrarConfirmacionSalir = false"
            >
              Cancelar
            </button>
            <button
              class="px-5 py-2.5 rounded-full bg-[#00ed64] text-[#001e2b] font-bold transition-all text-sm w-full hover:bg-[#00ed64]/90"
              @click="confirmarCerrarSesion"
            >
              Sí, salir
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>