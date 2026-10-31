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

// Refrescar desde la primera página cuando cambian los filtros
async function aplicarFiltros() {
  await listar(filtros.value, 1)
}

function limpiarFiltros() {
  filtros.value = { accion: '', resultado: '', usuario_email: '' }
  listar(filtros.value, 1)
}

// Cálculo de páginas totales
const totalPaginas = computed(() => Math.ceil(totalRegistros.value / registrosPorPagina))

// Cambiar de página
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
  if (r === 'exito') return 'bg-emerald-50 text-emerald-600 border-emerald-200'
  if (r === 'denegado') return 'bg-rose-50 text-rose-600 border-rose-200'
  return 'bg-slate-50 text-slate-600 border-slate-200'
}

const accionesDisponibles = computed(() => {
  // En lugar de calcular sobre los 10 registros actuales,
  // aquí podrías traer una lista fija o dejar las más comunes.
  // Para simplificar, usamos un listado fijo de acciones comunes.
  return [
    'LOGIN', 'LOGOUT', 'LOGIN_FALLIDO', 'INSERT', 'UPDATE', 'DELETE',
    'DELETE_EQUIPO_DENEGADO', 'DELETE_CATEGORIA_DENEGADO', 'CAMBIO_ROL'
  ]
})
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div>
      <h1 class="text-2xl font-bold text-slate-800">Auditoría del Sistema</h1>
      <p class="text-sm text-slate-500 mt-1">
        Registro completo de todas las acciones realizadas en el sistema.
      </p>
    </div>

    <!-- Tarjetas de usuarios -->
    <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
      <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4">
        Usuarios del Sistema ({{ usuarios.length }})
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="u in usuarios" 
          :key="u.id"
          class="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center gap-3"
        >
          <div class="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
            {{ u.nombre_completo?.charAt(0) || u.email?.charAt(0) || 'U' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-bold text-slate-800 truncate">{{ u.nombre_completo || 'Sin nombre' }}</p>
            <p class="text-xs text-slate-500 truncate">{{ u.email }}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded border"
                :class="u.roles?.nombre === 'SuperUsuario' ? 'bg-violet-50 text-violet-600 border-violet-200' : u.roles?.nombre === 'Usuario' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-100 text-slate-500 border-slate-200'">
                {{ u.roles?.nombre }}
              </span>
              <span class="text-[10px] font-semibold" :class="u.activo ? 'text-emerald-600' : 'text-slate-400'">
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
      <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col items-center">
        <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wide mb-4 self-start">
          Alertas de Seguridad
        </h2>
        <VelocimetroDenegados 
          :valor="estadisticas.denegados" 
          :maximo="Math.max(estadisticas.denegados * 2, 10)" 
        />
        <div class="mt-4 w-full grid grid-cols-2 gap-2 text-center">
          <div class="bg-emerald-50 rounded-lg p-2">
            <p class="text-xl font-bold text-emerald-600">{{ estadisticas.exitosos }}</p>
            <p class="text-[10px] font-bold text-emerald-500 uppercase">Exitosas</p>
          </div>
          <div class="bg-rose-50 rounded-lg p-2">
            <p class="text-xl font-bold text-rose-600">{{ estadisticas.denegados }}</p>
            <p class="text-[10px] font-bold text-rose-500 uppercase">Denegadas</p>
          </div>
        </div>
      </div>

      <!-- Gráfico de transacciones -->
      <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm lg:col-span-2">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wide">
            Transacciones por Acción
          </h2>
          <div class="flex gap-2 text-xs">
            <span class="px-2 py-1 bg-blue-50 text-blue-600 rounded font-bold">
              {{ estadisticas.logins }} Logins
            </span>
            <span class="px-2 py-1 bg-slate-100 text-slate-600 rounded font-bold">
              {{ estadisticas.logouts }} Logouts
            </span>
          </div>
        </div>
        <GraficoTransacciones :datos="estadisticas.porAccion" />
      </div>
    </div>

    <!-- Filtros -->
    <div class="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          v-model="filtros.usuario_email"
          placeholder="Buscar por correo..."
          class="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          @input="aplicarFiltros"
        />
        <select
          v-model="filtros.accion"
          class="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          @change="aplicarFiltros"
        >
          <option value="">Todas las acciones</option>
          <option v-for="a in accionesDisponibles" :key="a" :value="a">
            {{ traducirAccion(a) }}
          </option>
        </select>
        <select
          v-model="filtros.resultado"
          class="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          @change="aplicarFiltros"
        >
          <option value="">Todos los resultados</option>
          <option value="exito">Exitosas</option>
          <option value="denegado">Denegadas</option>
        </select>
        <button
          class="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl px-4 py-2.5 text-sm transition"
          @click="limpiarFiltros"
        >
          Limpiar filtros
        </button>
      </div>
    </div>

    <!-- Tabla -->
    <div class="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div v-if="cargando" class="p-8 text-center text-slate-500 animate-pulse">Cargando registros...</div>

      <div v-else-if="registros.length === 0" class="p-8 text-center text-slate-400">
        No hay registros de auditoría.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-500 text-left text-xs uppercase font-bold">
            <tr>
              <th class="px-4 py-4">Fecha y Hora</th>
              <th class="px-4 py-4">Usuario</th>
              <th class="px-4 py-4">Acción</th>
              <th class="px-4 py-4">Resultado</th>
              <th class="px-4 py-4">IP</th>
              <th class="px-4 py-4">Registro</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="r in registros" :key="r.id" class="hover:bg-blue-50/30 transition-colors">
              <td class="px-4 py-3 text-xs font-medium text-slate-600 whitespace-nowrap">
                {{ formatearFecha(r.fecha) }}
              </td>
              <td class="px-4 py-3">
                <p class="font-semibold text-slate-800 text-xs">{{ r.usuario_email || '—' }}</p>
              </td>
              <td class="px-4 py-3">
                <span class="font-bold text-slate-700 text-xs">
                  {{ traducirAccion(r.accion) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border"
                  :class="colorResultado(r.resultado)">
                  {{ r.resultado }}
                </span>
              </td>
              <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ r.ip || '—' }}</td>
              <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ r.registro_id || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="totalPaginas > 1" class="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
        <p class="text-xs font-medium text-slate-500">
          Mostrando <span class="font-bold text-slate-700">{{ (paginaActual - 1) * registrosPorPagina + 1 }}</span> 
          a 
          <span class="font-bold text-slate-700">{{ Math.min(paginaActual * registrosPorPagina, totalRegistros) }}</span> 
          de <span class="font-bold text-slate-700">{{ totalRegistros }}</span> registros
        </p>
        <div class="flex items-center gap-2">
          <button
            :disabled="paginaActual === 1"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border"
            :class="paginaActual === 1 ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
            @click="cambiarPagina(paginaActual - 1)"
          >
            Anterior
          </button>
          
          <span class="text-xs font-bold text-slate-700 px-2">
            Página {{ paginaActual }} de {{ totalPaginas }}
          </span>

          <button
            :disabled="paginaActual === totalPaginas"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border"
            :class="paginaActual === totalPaginas ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
            @click="cambiarPagina(paginaActual + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>