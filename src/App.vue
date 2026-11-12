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

  <!-- Fondo general tipo papel -->
  <div v-else class="min-h-screen bg-[#F4F1EA] flex text-slate-800 font-sans overflow-x-hidden">
    
    <!-- Fondo oscuro para móviles -->
    <div 
      v-if="menuAbierto" 
      class="fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity"
      @click="menuAbierto = false"
    ></div>

    <!-- SIDEBAR: Estilo Madera/Marrón -->
    <aside 
      class="w-64 bg-[#8B4513] border-r-4 border-black flex flex-col fixed h-full z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-[4px_0px_0px_0px_rgba(0,0,0,1)]"
      :class="menuAbierto ? 'translate-x-0' : '-translate-x-full'"
    >
      
      <!-- Cabecera del Sidebar -->
      <div class="h-20 flex items-center gap-3 px-6 border-b-4 border-black bg-[#6b3410]">
        <img src="/logito.png" alt="Logo" class="w-10 h-10 rounded-full object-cover border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0" />
        <h1 class="text-xs font-bold text-[#F4F1EA] font-pixel tracking-tight leading-tight">Inventario TI</h1>
      </div>

      <!-- Navegación -->
      <nav class="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        <RouterLink
          v-for="item in menu"
          :key="item.to"
          :to="item.to"
          @click="cerrarMenu"
          class="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold border-2 transition-all duration-200"
          :class="isActive(item.to)
            ? 'bg-[#FF8C00] border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[-2px]' 
            : 'border-transparent text-[#F4F1EA] hover:bg-[#6b3410] hover:border-black'"
        >
          <span class="text-lg">{{ item.icon }}</span>
          {{ item.label }}
        </RouterLink>
      </nav>

      <!-- Perfil de Usuario -->
      <div class="p-4 border-t-4 border-black bg-[#6b3410]">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-[#D2B48C] border-2 border-black text-black flex items-center justify-center font-bold text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
           {{ auth.perfil?.nombre_completo?.charAt(0) || auth.user?.email?.charAt(0) || 'U' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-[#F4F1EA] truncate">
              {{ auth.perfil?.nombre_completo || auth.user?.email || 'Usuario' }}
            </p>
            <p class="text-xs text-[#DAA520] font-bold truncate uppercase tracking-wider">
              {{ auth.rol || 'Cargando...' }}
            </p>
          </div>
        </div>
        <button
          class="w-full text-xs bg-[#F4F1EA] border-2 border-black hover:bg-[#D2B48C] text-black py-2.5 rounded-md transition-all font-bold flex justify-center items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none"
          @click="mostrarConfirmacionSalir = true"
        >
          Cerrar Sesión
        </button>
      </div>
    </aside>

    <!-- CONTENIDO PRINCIPAL -->
    <main class="flex-1 lg:ml-64 flex flex-col min-h-screen w-full">
      
      <!-- Header superior -->
      <header class="h-16 bg-[#D2B48C] border-b-4 border-black flex items-center justify-between px-4 lg:px-8">
        <div class="flex items-center gap-3">
          <button 
            @click="menuAbierto = true"
            class="lg:hidden p-2 text-black border-2 border-transparent hover:border-black rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <h2 class="text-sm font-bold text-black font-pixel uppercase tracking-widest hidden sm:block">
            {{ menu.find(m => m.to === route.path)?.label || 'Sistema' }}
          </h2>
        </div>
        <div class="lg:hidden text-sm font-bold text-black">
          {{ auth.perfil?.nombre_completo?.split(' ')[0] || 'Usuario' }}
        </div>
      </header>

      <!-- Vistas -->
      <div class="flex-1 p-4 lg:p-8">
        <RouterView />
      </div>

      <!-- Footer -->
      <footer class="py-4 text-center text-xs font-bold text-black border-t-4 border-black bg-[#D2B48C]">
        -Inventario TI- © 2026 · By Ever Garcia 
      </footer>
    </main>

    <!-- Modal de Confirmación de Salida (Estilo Retro) -->
    <Teleport to="body">
      <div
        v-if="mostrarConfirmacionSalir"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70"
        @click.self="mostrarConfirmacionSalir = false"
      >
        <div class="bg-[#F4F1EA] border-4 border-black rounded-lg max-w-md w-full p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
          <h3 class="text-xl font-bold text-black mb-2 font-pixel">¿Cerrar sesión?</h3>
          <p class="text-sm font-medium text-slate-700 mb-6">
            Tendrás que introducir los datos si quieres acceder de nuevo al sistema.
          </p>
          <div class="flex gap-4 justify-center">
            <button
              class="px-5 py-2.5 rounded-md bg-[#D2B48C] border-2 border-black text-black font-bold transition-all text-sm w-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none"
              @click="mostrarConfirmacionSalir = false"
            >
              Cancelar
            </button>
            <button
              class="px-5 py-2.5 rounded-md bg-[#FF8C00] border-2 border-black text-black font-bold transition-all text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none"
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