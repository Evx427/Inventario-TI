<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuth } from '../composables/useAuth'

const auth = useAuth()
const cargando = ref(true)
const totales = ref({ total: 0, activo: 0, reparacion: 0, baja: 0 })
const ultimosEquipos = ref([])

onMounted(async () => {
  const { data: equipos, error } = await supabase
    .from('equipos')
    .select(`codigo_bien_publico, marca, modelo, estado, created_at, categorias:categoria_id (nombre)`)
    .order('created_at', { ascending: false })

  if (!error && equipos) {
    totales.value.total = equipos.length
    totales.value.activo = equipos.filter((e) => e.estado === 'activo').length
    totales.value.reparacion = equipos.filter((e) => e.estado === 'reparacion').length
    totales.value.baja = equipos.filter((e) => e.estado === 'baja').length
    ultimosEquipos.value = equipos.slice(0, 5)
  }
  cargando.value = false
})

const porcentajeActivo = computed(() => (totales.value.activo / (totales.value.total || 1)) * 100)
const porcentajeReparacion = computed(() => (totales.value.reparacion / (totales.value.total || 1)) * 100)
const porcentajeBaja = computed(() => (totales.value.baja / (totales.value.total || 1)) * 100)

const pastelStyle = computed(() => {
  if (totales.value.total === 0) return { background: '#e2e8f0' }
  const a = porcentajeActivo.value
  const r = porcentajeReparacion.value
  return {
    background: `conic-gradient(
      #10b981 0% ${a}%, 
      #f59e0b ${a}% ${a + r}%, 
      #f43f5e ${a + r}% 100%
    )`,
  }
})

function formatearFecha(fechaISO) {
  if (!fechaISO) return '—'
  return new Date(fechaISO).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-3xl font-bold text-slate-800 tracking-tight">Panel de Control</h1>
      <p class="text-slate-500 font-medium mt-1">
        Bienvenido, {{ auth.perfil?.nombre_completo || auth.user?.email }}
      </p>
    </div>

    <!-- Tarjetas de Totales -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <p class="text-xs uppercase text-slate-400 font-bold tracking-wider">Ultimo 5 Registros</p>
        <p class="text-4xl font-bold mt-2 text-slate-800">{{ totales.total }}</p>
      </div>
      <div class="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 shadow-sm">
        <p class="text-xs uppercase text-emerald-600 font-bold tracking-wider">Activos</p>
        <p class="text-4xl font-bold mt-2 text-emerald-700">{{ totales.activo }}</p>
      </div>
      <div class="bg-amber-50 border border-amber-100 rounded-2xl p-6 shadow-sm">
        <p class="text-xs uppercase text-amber-600 font-bold tracking-wider">En Reparación</p>
        <p class="text-4xl font-bold mt-2 text-amber-700">{{ totales.reparacion }}</p>
      </div>
      <div class="bg-rose-50 border border-rose-100 rounded-2xl p-6 shadow-sm">
        <p class="text-xs uppercase text-rose-600 font-bold tracking-wider">De Baja</p>
        <p class="text-4xl font-bold mt-2 text-rose-700">{{ totales.baja }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Gráfico de Pastel -->
      <div class="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center">
        <h3 class="text-sm font-bold text-slate-700 mb-6 w-full text-left uppercase">Estado del Inventario</h3>
        
        <div class="relative w-48 h-48 mb-6">
          <div class="w-full h-full rounded-full" :style="pastelStyle"></div>
          <div class="absolute inset-0 m-auto w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center shadow-md">
            <span class="text-3xl font-bold text-slate-800">{{ totales.total }}</span>
            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Equipos</span>
          </div>
        </div>

        <div class="w-full space-y-3 mt-2">
          <div class="flex items-center justify-between text-sm font-semibold">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span class="text-slate-600">Activos</span>
            </div>
            <span class="text-slate-800">{{ totales.activo }}</span>
          </div>
          <div class="flex items-center justify-between text-sm font-semibold">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-amber-500"></span>
              <span class="text-slate-600">Reparación</span>
            </div>
            <span class="text-slate-800">{{ totales.reparacion }}</span>
          </div>
          <div class="flex items-center justify-between text-sm font-semibold">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-rose-500"></span>
              <span class="text-slate-600">De baja</span>
            </div>
            <span class="text-slate-800">{{ totales.baja }}</span>
          </div>
        </div>
      </div>

      <!-- Tabla de Últimos Registros -->
      <div class="lg:col-span-2 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div class="p-6 border-b border-slate-100">
          <h3 class="text-sm font-bold text-slate-700 uppercase tracking-wide">Últimos 10 registros</h3>
        </div>
        
        <div class="flex-1 overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
              <tr>
                <th class="px-6 py-4">Código</th>
                <th class="px-6 py-4">Equipo</th>
                <th class="px-6 py-4">Fecha</th>
                <th class="px-6 py-4">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="ultimosEquipos.length === 0">
                <td colspan="4" class="px-6 py-8 text-center text-slate-400 font-medium">
                  No hay equipos registrados aún.
                </td>
              </tr>
              <tr v-for="eq in ultimosEquipos" :key="eq.codigo_bien_publico" class="hover:bg-blue-50/30 transition-colors">
                <td class="px-6 py-4 font-mono text-xs font-semibold text-slate-500">{{ eq.codigo_bien_publico }}</td>
                <td class="px-6 py-4">
                  <p class="font-bold text-slate-800">{{ eq.marca }} {{ eq.modelo }}</p>
                  <p class="text-xs font-medium text-slate-400">{{ eq.categorias?.nombre || 'Sin categoría' }}</p>
                </td>
                <td class="px-6 py-4 font-medium text-slate-500">{{ formatearFecha(eq.created_at) }}</td>
                <td class="px-6 py-4">
                  <span
                    class="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border"
                    :class="{
                      'bg-emerald-50 text-emerald-600 border-emerald-200': eq.estado === 'activo',
                      'bg-amber-50 text-amber-600 border-amber-200': eq.estado === 'reparacion',
                      'bg-rose-50 text-rose-600 border-rose-200': eq.estado === 'baja',
                    }"
                  >
                    {{ eq.estado }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>