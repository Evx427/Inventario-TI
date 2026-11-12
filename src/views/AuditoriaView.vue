<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuditoria } from '../composables/useAuditoria'
import VelocimetroDenegados from '../components/ui/VelocimetroDenegados.vue'
import GraficoTransacciones from '../components/ui/GraficoTransacciones.vue'

const { 
  registros, usuarios, cargando, estadisticas, traducirAccion, 
  paginaActual, totalRegistros, registrosPorPagina, 
  listar, cargarUsuarios, irAPagina 
} = useAuditoria()

const filtros = ref({ accion: '', resultado: '', usuario_email: '' })

onMounted(async () => {
  await Promise.all([
    listar(filtros.value, 1),
    cargarUsuarios()
  ])
})

async function aplicarFiltros() {
  await listar(filtros.value, 1)
}

function limpiarFiltros() {
  filtros.value = { accion: '', resultado: '', usuario_email: '' }
  listar(filtros.value, 1)
}

const totalPaginas = computed(() => Math.ceil(totalRegistros.value / registrosPorPagina))

async function cambiarPagina(nuevaPagina) {
  if (nuevaPagina < 1 || nuevaPagina > totalPaginas.value) return
  await irAPagina(nuevaPagina, filtros.value)
}

function formatearFecha(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

function colorResultado(r) {
  if (r === 'exito') return 'bg-[#00ed64]/10 text-[#00ed64] border-[#00ed64]/30'
  if (r === 'denegado') return 'bg-red-500/10 text-red-400 border-red-500/30'
  return 'bg-[#5c6c75]/20 text-[#b8c4c2] border-[#5c6c75]/30'
}

const accionesDisponibles = [
  'LOGIN', 'LOGOUT', 'LOGIN_FALLIDO', 'INSERT', 'UPDATE', 'DELETE',
  'DELETE_EQUIPO_DENEGADO', 'DELETE_CATEGORIA_DENEGADO', 'CAMBIO_ROL'
]
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div>
      <h1 class="text-2xl font-bold text-white">Auditoría del Sistema</h1>
      <p class="text-sm text-[#b8c4c2] mt-1">Registro completo de todas las acciones realizadas en el sistema.</p>
    </div>

    <!-- Tarjetas de usuarios -->
    <div class="bg-[#001e2b] border border-[#00684a]/30 rounded-2xl p-6 shadow-lg shadow-black/20">
      <h2 class="text-sm font-bold text-white uppercase tracking-wide mb-4 font-mono">
        Usuarios del Sistema ({{ usuarios.length }})
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="u in usuarios" 
          :key="u.id"
          class="bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-4 flex items-center gap-3"
        >
          <div class="w-12 h-12 rounded-full bg-[#00ed64]/20 border border-[#00ed64]/50 text-[#00ed64] flex items-center justify-center font-bold text-lg shrink-0">
            {{ u.nombre_completo?.charAt(0) || u.email?.charAt(0) || 'U' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-white truncate">{{ u.nombre_completo || 'Sin nombre' }}</p>
            <p class="text-xs text-[#b8c4c2] truncate">{{ u.email }}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border"
                :class="u.roles?.nombre === 'SuperUsuario' ? 'bg-violet-500/10 text-violet-400 border-violet-500/30' : u.roles?.nombre === 'Usuario' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-[#5c6c75]/20 text-[#b8c4c2] border-[#5c6c75]/30'">
                {{ u.roles?.nombre }}
              </span>
              <span class="text-[10px] font-semibold" :class="u.activo ? 'text-[#00ed64]' : 'text-[#5c6c75]'">
                {{ u.activo ? '● Activo' : '○ Inactivo' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Gráficos -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Velocímetro -->
      <div class="bg-[#001e2b] border border-[#00684a]/30 rounded-2xl p-6 shadow-lg shadow-black/20 flex flex-col items-center">
        <h2 class="text-sm font-bold text-white uppercase tracking-wide mb-4 self-start font-mono">Alertas de Seguridad</h2>
        <VelocimetroDenegados 
          :valor="estadisticas.denegados" 
          :maximo="Math.max(estadisticas.denegados * 2, 10)" 
        />
        <div class="mt-4 w-full grid grid-cols-2 gap-2 text-center">
          <div class="bg-[#00ed64]/10 rounded-lg p-2 border border-[#00ed64]/30">
            <p class="text-xl font-bold text-[#00ed64]">{{ estadisticas.exitosos }}</p>
            <p class="text-[10px] font-bold text-[#00ed64] uppercase font-mono">Exitosas</p>
          </div>
          <div class="bg-red-500/10 rounded-lg p-2 border border-red-500/30">
            <p class="text-xl font-bold text-red-400">{{ estadisticas.denegados }}</p>
            <p class="text-[10px] font-bold text-red-400 uppercase font-mono">Denegadas</p>
          </div>
        </div>
      </div>

      <!-- Gráfico de transacciones -->
      <div class="bg-[#001e2b] border border-[#00684a]/30 rounded-2xl p-6 shadow-lg shadow-black/20 lg:col-span-2">
        <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 class="text-sm font-bold text-white uppercase tracking-wide font-mono">Transacciones por Acción</h2>
          <div class="flex gap-2 text-xs font-mono">
            <span class="px-2 py-1 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/30 font-bold">
              {{ estadisticas.logins }} Logins
            </span>
            <span class="px-2 py-1 bg-[#5c6c75]/20 text-[#b8c4c2] rounded-full border border-[#5c6c75]/30 font-bold">
              {{ estadisticas.logouts }} Logouts
            </span>
          </div>
        </div>
        <GraficoTransacciones :datos="estadisticas.porAccion" />
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-[#001e2b] border border-[#00684a]/30 rounded-2xl p-4 shadow-lg shadow-black/20">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          v-model="filtros.usuario_email"
          placeholder="Buscar por correo..."
          class="bg-[#002b3b] border border-[#00684a]/50 rounded-full px-4 py-2.5 text-sm text-white placeholder-[#5c6c75] focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50"
          @input="aplicarFiltros"
        />
        <select v-model="filtros.accion" class="bg-[#002b3b] border border-[#00684a]/50 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" @change="aplicarFiltros">
          <option value="">Todas las acciones</option>
          <option v-for="a in accionesDisponibles" :key="a" :value="a">{{ traducirAccion(a) }}</option>
        </select>
        <select v-model="filtros.resultado" class="bg-[#002b3b] border border-[#00684a]/50 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" @change="aplicarFiltros">
          <option value="">Todos los resultados</option>
          <option value="exito">Exitosas</option>
          <option value="denegado">Denegadas</option>
        </select>
        <button class="bg-[#5c6c75]/20 hover:bg-[#5c6c75]/30 text-[#b8c4c2] font-bold rounded-full px-4 py-2.5 text-sm transition border border-[#5c6c75]/30" @click="limpiarFiltros">
          Limpiar filtros
        </button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="bg-[#001e2b] border border-[#00684a]/30 rounded-2xl overflow-hidden shadow-lg shadow-black/20">
      <div v-if="cargando" class="p-8 text-center text-[#b8c4c2] animate-pulse">Cargando registros...</div>
      <div v-else-if="registros.length === 0" class="p-8 text-center text-[#5c6c75]">No hay registros de auditoría.</div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm min-w-[900px]">
          <thead class="bg-[#002b3b] text-[#b8c4c2] text-left text-xs uppercase font-mono tracking-wider border-b border-[#00684a]/30">
            <tr>
              <th class="px-6 py-4 font-bold">Fecha y Hora</th>
              <th class="px-6 py-4 font-bold">Usuario</th>
              <th class="px-6 py-4 font-bold">Acción</th>
              <th class="px-6 py-4 font-bold">Resultado</th>
              <th class="px-6 py-4 font-bold">IP</th>
              <th class="px-6 py-4 font-bold">Registro</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#00684a]/20">
            <tr v-for="r in registros" :key="r.id" class="hover:bg-[#00ed64]/5 transition-colors">
              <td class="px-6 py-4 text-xs text-[#b8c4c2] font-mono whitespace-nowrap">{{ formatearFecha(r.fecha) }}</td>
              <td class="px-6 py-4">
                <p class="font-semibold text-white text-xs">{{ r.usuario_email || '—' }}</p>
              </td>
              <td class="px-6 py-4">
                <span class="font-bold text-[#b8c4c2] text-xs">{{ traducirAccion(r.accion) }}</span>
              </td>
              <td class="px-6 py-4">
                <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase border" :class="colorResultado(r.resultado)">
                  {{ r.resultado }}
                </span>
              </td>
              <td class="px-6 py-4 font-mono text-xs text-[#5c6c75]">{{ r.ip || '—' }}</td>
              <td class="px-6 py-4 font-mono text-xs text-[#5c6c75]">{{ r.registro_id || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="totalPaginas > 1" class="px-6 py-4 border-t border-[#00684a]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-xs font-mono text-[#b8c4c2]">
          Mostrando <span class="font-bold text-white">{{ (paginaActual - 1) * registrosPorPagina + 1 }}</span> 
          a <span class="font-bold text-white">{{ Math.min(paginaActual * registrosPorPagina, totalRegistros) }}</span> 
          de <span class="font-bold text-white">{{ totalRegistros }}</span> registros
        </p>
        <div class="flex items-center gap-2">
          <button :disabled="paginaActual === 1" class="px-4 py-1.5 rounded-full text-xs font-bold border" :class="paginaActual === 1 ? 'bg-[#5c6c75]/20 text-[#5c6c75] border-[#5c6c75]/30 cursor-not-allowed' : 'bg-transparent text-white border-[#5c6c75] hover:border-[#00ed64] hover:text-[#00ed64]'" @click="cambiarPagina(paginaActual - 1)">Anterior</button>
          <span class="text-xs font-mono font-bold text-[#00ed64] px-2">Página {{ paginaActual }} de {{ totalPaginas }}</span>
          <button :disabled="paginaActual === totalPaginas" class="px-4 py-1.5 rounded-full text-xs font-bold border" :class="paginaActual === totalPaginas ? 'bg-[#5c6c75]/20 text-[#5c6c75] border-[#5c6c75]/30 cursor-not-allowed' : 'bg-transparent text-white border-[#5c6c75] hover:border-[#00ed64] hover:text-[#00ed64]'" @click="cambiarPagina(paginaActual + 1)">Siguiente</button>
        </div>
      </div>
    </div>
  </div>
</template>