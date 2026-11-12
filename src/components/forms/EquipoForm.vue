<script setup>
import { ref, watch, computed } from 'vue'
import { supabase } from '../../lib/supabase'
import { usePerifericos } from '../../composables/usePerifericos'
import BaseButton from '../ui/BaseButton.vue'

const props = defineProps({
  equipo: { type: Object, default: null },
})

const emit = defineEmits(['guardar', 'cancelar'])
const { obtenerPerifericos } = usePerifericos()

const form = ref(getFormVacio())
const hardware = ref({
  placa_base: { marca: '', modelo: '', identificador: '' },
  ram: { tipo: 'DDR4', cantidad_modulos: 1 },
  almacenamiento: { tipo: 'SSD', capacidad_gb: 256 },
  tiene_gpu: false,
  gpu: { marca: '', modelo: '' },
  tiene_red: false,
  red: { marca: '', modelo: '' },
})
const perifericos = ref([
  { tipo: 'monitor', marca: '', modelo: '', codigo_bien_publico: '', codigo_bien_privado: '', conexion_video: 'HDMI', estado: 'bueno' },
  { tipo: 'teclado', marca: '', modelo: '', codigo_bien_publico: '', codigo_bien_privado: '', estado: 'bueno' },
  { tipo: 'mouse', marca: '', modelo: '', codigo_bien_publico: '', codigo_bien_privado: '', estado: 'bueno' }
])

const categorias = ref([])
const sistemasOperativos = ref([])
const guardando = ref(false)
const errores = ref({})
const pestanaActiva = ref('basico')

const esSobremesa = computed(() => parseInt(form.value.categoria_id) === 1)

function getFormVacio() {
  return {
    codigo_bien_publico: '',
    codigo_bien_privado: '',
    categoria_id: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    fecha_registro: new Date().toISOString().slice(0, 10),
    fecha_fabricacion: '',
    estado: 'activo',
    so_id: '',
    so_version_exacta: '',
    so_compilacion: '',
    ubicacion: '',
    notas: '',
  }
}

async function cargarCatalogos() {
  const [cat, so] = await Promise.all([
    supabase.from('categorias').select('*').order('id'),
    supabase.from('sistemas_operativos').select('*').order('nombre'),
  ])
  categorias.value = cat.data || []
  sistemasOperativos.value = so.data || []
}

watch(
  () => props.equipo,
  async (eq) => {
    await cargarCatalogos()
    if (eq) {
      form.value = {
        codigo_bien_publico: eq.codigo_bien_publico || '',
        codigo_bien_privado: eq.codigo_bien_privado || '',
        categoria_id: eq.categoria_id || '',
        marca: eq.marca || '',
        modelo: eq.modelo || '',
        numero_serie: eq.numero_serie || '',
        fecha_registro: eq.fecha_registro || '',
        fecha_fabricacion: eq.fecha_fabricacion || '',
        estado: eq.estado || 'activo',
        so_id: eq.so_id || '',
        so_version_exacta: eq.so_version_exacta || '',
        so_compilacion: eq.so_compilacion || '',
        ubicacion: eq.ubicacion || '',
        notas: eq.notas || '',
      }

      const hardwareBD = eq.hardware || []
      const placa = hardwareBD.find(h => h.tipo === 'placa_base')
      if (placa) hardware.value.placa_base = { marca: placa.marca || '', modelo: placa.modelo || '', identificador: placa.identificador || '' }

      const ram = hardwareBD.find(h => h.tipo === 'ram')
      if (ram) hardware.value.ram = { tipo: ram.tipo_ram || 'DDR4', cantidad_modulos: ram.cantidad_modulos || 1 }

      const discos = hardwareBD.filter(h => h.tipo === 'almacenamiento')
      if (discos.length > 0) {
        hardware.value.almacenamiento = { 
          tipo: discos[0].tipo_almacenamiento || 'SSD', 
          capacidad_gb: discos.reduce((sum, d) => sum + (d.capacidad_gb || 0), 0) 
        }
      }

      const gpu = hardwareBD.find(h => h.tipo === 'gpu')
      if (gpu) { hardware.value.tiene_gpu = true; hardware.value.gpu = { marca: gpu.marca || '', modelo: gpu.modelo || '' } }

      const red = hardwareBD.find(h => h.tipo === 'red')
      if (red) { hardware.value.tiene_red = true; hardware.value.red = { marca: red.marca || '', modelo: red.modelo || '' } }

      if (parseInt(eq.categoria_id) === 1) {
        const resPeri = await obtenerPerifericos(eq.codigo_bien_publico)
        if (resPeri.ok) {
          perifericos.value = perifericos.value.map(slot => {
            const encontrado = resPeri.data.find(p => p.tipo === slot.tipo)
            return encontrado ? { ...encontrado } : slot
          })
        }
      }

    } else {
      form.value = getFormVacio()
      hardware.value = {
        placa_base: { marca: '', modelo: '', identificador: '' },
        ram: { tipo: 'DDR4', cantidad_modulos: 1 },
        almacenamiento: { tipo: 'SSD', capacidad_gb: 256 },
        tiene_gpu: false, gpu: { marca: '', modelo: '' },
        tiene_red: false, red: { marca: '', modelo: '' },
      }
      perifericos.value = [
        { tipo: 'monitor', marca: '', modelo: '', codigo_bien_publico: '', codigo_bien_privado: '', conexion_video: 'HDMI', estado: 'bueno' },
        { tipo: 'teclado', marca: '', modelo: '', codigo_bien_publico: '', codigo_bien_privado: '', estado: 'bueno' },
        { tipo: 'mouse', marca: '', modelo: '', codigo_bien_publico: '', codigo_bien_privado: '', estado: 'bueno' }
      ]
    }
  },
  { immediate: true }
)

function validarFormulario() {
  errores.value = {}
  let valido = true
  if (!form.value.codigo_bien_publico.trim()) {
    errores.value.codigo_bien_publico = 'El código público es obligatorio.'
    valido = false
  }
  if (!form.value.categoria_id) {
    errores.value.categoria_id = 'Debes seleccionar una categoría.'
    valido = false
  }
  return valido
}

async function onSubmit() {
  if (!validarFormulario()) return
  guardando.value = true

  const hardwareArray = []
  const catId = parseInt(form.value.categoria_id)
  if ([1, 2, 5].includes(catId)) {
    if (hardware.value.placa_base.marca || hardware.value.placa_base.modelo) {
      hardwareArray.push({ tipo: 'placa_base', ...hardware.value.placa_base })
    }
    hardwareArray.push({ tipo: 'ram', tipo_ram: hardware.value.ram.tipo, cantidad_modulos: parseInt(hardware.value.ram.cantidad_modulos) })
    hardwareArray.push({ tipo: 'almacenamiento', tipo_almacenamiento: hardware.value.almacenamiento.tipo, capacidad_gb: parseInt(hardware.value.almacenamiento.capacidad_gb) })
    if (hardware.value.tiene_gpu) hardwareArray.push({ tipo: 'gpu', ...hardware.value.gpu })
    if (hardware.value.tiene_red) hardwareArray.push({ tipo: 'red', ...hardware.value.red })
  }

  emit('guardar', {
    equipo: { ...form.value },
    hardware: hardwareArray,
    perifericos: esSobremesa.value ? perifericos.value : []
  })
  
  guardando.value = false
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="onSubmit">
    
    <!-- TABS -->
    <div v-if="esSobremesa" class="flex border-b border-[#00684a]/30 mb-6">
      <button 
        type="button"
        @click="pestanaActiva = 'basico'"
        class="px-6 py-3 font-bold text-sm transition-colors border-b-2"
        :class="pestanaActiva === 'basico' ? 'border-[#00ed64] text-[#00ed64]' : 'border-transparent text-[#5c6c75] hover:text-[#b8c4c2]'"
      >
        1. Datos del Equipo
      </button>
      <button 
        type="button"
        @click="pestanaActiva = 'perifericos'"
        class="px-6 py-3 font-bold text-sm transition-colors border-b-2"
        :class="pestanaActiva === 'perifericos' ? 'border-[#00ed64] text-[#00ed64]' : 'border-transparent text-[#5c6c75] hover:text-[#b8c4c2]'"
      >
        2. Anexo: Periféricos
      </button>
    </div>

    <div v-show="!esSobremesa || pestanaActiva === 'basico'" class="space-y-6">
      
      <!-- IDENTIFICACIÓN -->
      <fieldset class="space-y-4 bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-4">
        <legend class="text-sm font-bold text-[#00ed64] uppercase tracking-wide px-2 font-mono">Identificación</legend>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-[#b8c4c2] mb-1">Código de bien público *</label>
            <input v-model="form.codigo_bien_publico" required :disabled="!!props.equipo" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50 disabled:opacity-50" :class="{ 'border-red-500': errores.codigo_bien_publico }" />
            <p v-if="errores.codigo_bien_publico" class="text-xs text-red-400 mt-1">{{ errores.codigo_bien_publico }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-[#b8c4c2] mb-1">Código de bien privado</label>
            <input v-model="form.codigo_bien_privado" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" />
          </div>
          <div>
            <label class="block text-sm font-medium text-[#b8c4c2] mb-1">Categoría *</label>
            <select v-model="form.categoria_id" required class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" :class="{ 'border-red-500': errores.categoria_id }">
              <option value="">— Seleccionar —</option>
              <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
            <p v-if="errores.categoria_id" class="text-xs text-red-400 mt-1">{{ errores.categoria_id }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-[#b8c4c2] mb-1">Estado *</label>
            <select v-model="form.estado" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50">
              <option value="activo">Activo</option>
              <option value="reparacion">En reparación</option>
              <option value="baja">De baja</option>
            </select>
          </div>
        </div>
      </fieldset>

      <!-- DATOS DEL EQUIPO -->
      <fieldset class="space-y-4 bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-4">
        <legend class="text-sm font-bold text-[#00ed64] uppercase tracking-wide px-2 font-mono">Datos del equipo</legend>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">Marca</label><input v-model="form.marca" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" /></div>
          <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">Modelo</label><input v-model="form.modelo" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" /></div>
          <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">N° de serie</label><input v-model="form.numero_serie" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" /></div>
          <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">Fecha de registro</label><input v-model="form.fecha_registro" type="date" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" /></div>
          <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">Fecha de fabricación</label><input v-model="form.fecha_fabricacion" type="date" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" /></div>
          <div>
            <label class="block text-sm font-medium text-[#b8c4c2] mb-1">Ubicación</label>
            <select v-model="form.ubicacion" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50">
              <option value="">— Seleccionar —</option>
              <option value="Laboratorio de Informática (1)">Laboratorio de Informática (1)</option>
              <option value="Control de Estudio">Control de Estudio</option>
              <option value="Oficina Académica">Oficina Académica</option>
              <option value="Oficina General">Oficina General</option>
              <option value="Oficina del Muru47">Oficina del Muru47</option>
              <option value="Sala de profesores">Sala de profesores</option>
            </select>
          </div>
        </div>
        <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">Notas</label><textarea v-model="form.notas" rows="2" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" /></div>
      </fieldset>

      <!-- SO Y HARDWARE -->
      <div v-if="[1, 2, 5].includes(parseInt(form.categoria_id))" class="space-y-6">
        <fieldset class="space-y-4 bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-4">
          <legend class="text-sm font-bold text-[#00ed64] uppercase tracking-wide px-2 font-mono">Sistema Operativo</legend>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-[#b8c4c2] mb-1">SO</label>
              <select v-model="form.so_id" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50">
                <option value="">— Ninguno —</option>
                <option v-for="so in sistemasOperativos" :key="so.id" :value="so.id">{{ so.nombre }}</option>
              </select>
            </div>
            <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">Versión</label><input v-model="form.so_version_exacta" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" /></div>
            <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">Compilación</label><input v-model="form.so_compilacion" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#00ed64]/50" /></div>
          </div>
        </fieldset>

        <fieldset class="space-y-4 bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-4">
          <legend class="text-sm font-bold text-[#00ed64] uppercase tracking-wide px-2 font-mono">Hardware</legend>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div class="bg-[#001e2b] p-4 rounded-xl border border-[#00684a]/30 space-y-3">
              <h4 class="text-xs font-bold text-[#00ed64] uppercase font-mono">Placa Base</h4>
              <div class="grid grid-cols-2 gap-3">
                <div><label class="block text-xs text-[#5c6c75] mb-1">Marca</label><input v-model="hardware.placa_base.marca" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded px-2 py-1.5 text-sm text-white" /></div>
                <div><label class="block text-xs text-[#5c6c75] mb-1">Modelo</label><input v-model="hardware.placa_base.modelo" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded px-2 py-1.5 text-sm text-white" /></div>
                <div class="col-span-2"><label class="block text-xs text-[#5c6c75] mb-1">ID / Código</label><input v-model="hardware.placa_base.identificador" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded px-2 py-1.5 text-sm text-white" /></div>
              </div>
            </div>

            <div class="bg-[#001e2b] p-4 rounded-xl border border-[#00684a]/30 space-y-3">
              <h4 class="text-xs font-bold text-[#00ed64] uppercase font-mono">Memoria RAM</h4>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-[#5c6c75] mb-1">Tipo</label>
                  <select v-model="hardware.ram.tipo" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded px-2 py-1.5 text-sm text-white">
                    <option>DDR2</option><option>DDR3</option><option>DDR4</option><option>DDR5</option>
                  </select>
                </div>
                <div><label class="block text-xs text-[#5c6c75] mb-1">Módulos</label><input v-model.number="hardware.ram.cantidad_modulos" type="number" min="1" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded px-2 py-1.5 text-sm text-white" /></div>
              </div>
            </div>

            <div class="bg-[#001e2b] p-4 rounded-xl border border-[#00684a]/30 space-y-3">
              <h4 class="text-xs font-bold text-[#00ed64] uppercase font-mono">Almacenamiento</h4>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-[#5c6c75] mb-1">Tipo</label>
                  <select v-model="hardware.almacenamiento.tipo" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded px-2 py-1.5 text-sm text-white">
                    <option>SSD</option><option>HDD</option><option>NVMe</option>
                  </select>
                </div>
                <div><label class="block text-xs text-[#5c6c75] mb-1">Capacidad (GB)</label><input v-model.number="hardware.almacenamiento.capacidad_gb" type="number" min="1" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded px-2 py-1.5 text-sm text-white" /></div>
              </div>
            </div>

            <div class="bg-[#001e2b] p-4 rounded-xl border border-[#00684a]/30 space-y-4">
              <div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="hardware.tiene_gpu" class="w-4 h-4 rounded bg-[#002b3b] border-[#00684a] text-[#00ed64] focus:ring-[#00ed64]" />
                  <span class="text-sm font-bold text-white">¿Tiene Tarjeta Gráfica?</span>
                </label>
                <div v-if="hardware.tiene_gpu" class="mt-2 pl-6 grid grid-cols-2 gap-3">
                  <input v-model="hardware.gpu.marca" placeholder="Marca" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded px-2 py-1.5 text-sm text-white placeholder-[#5c6c75]" />
                  <input v-model="hardware.gpu.modelo" placeholder="Modelo" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded px-2 py-1.5 text-sm text-white placeholder-[#5c6c75]" />
                </div>
              </div>
              <div>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" v-model="hardware.tiene_red" class="w-4 h-4 rounded bg-[#002b3b] border-[#00684a] text-[#00ed64] focus:ring-[#00ed64]" />
                  <span class="text-sm font-bold text-white">¿Tiene Tarjeta de Red?</span>
                </label>
                <div v-if="hardware.tiene_red" class="mt-2 pl-6 grid grid-cols-2 gap-3">
                  <input v-model="hardware.red.marca" placeholder="Marca" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded px-2 py-1.5 text-sm text-white placeholder-[#5c6c75]" />
                  <input v-model="hardware.red.modelo" placeholder="Modelo" class="w-full bg-[#002b3b] border border-[#00684a]/50 rounded px-2 py-1.5 text-sm text-white placeholder-[#5c6c75]" />
                </div>
              </div>
            </div>

          </div>
        </fieldset>
      </div>
    </div>

    <!-- PESTAÑA 2: PERIFÉRICOS -->
    <div v-show="esSobremesa && pestanaActiva === 'perifericos'" class="space-y-6">
      <!-- MONITOR -->
      <fieldset class="bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-4 space-y-4">
        <legend class="text-sm font-bold text-[#00ed64] uppercase tracking-wide px-2 font-mono">Monitor</legend>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">Marca</label><input v-model="perifericos[0].marca" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-sm text-white" /></div>
          <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">Modelo</label><input v-model="perifericos[0].modelo" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-sm text-white" /></div>
          <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">Código Público</label><input v-model="perifericos[0].codigo_bien_publico" placeholder="No aplica si no tiene" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-sm text-white placeholder-[#5c6c75]" /></div>
          <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">Código Privado</label><input v-model="perifericos[0].codigo_bien_privado" placeholder="No aplica si no tiene" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-sm text-white placeholder-[#5c6c75]" /></div>
          <div>
            <label class="block text-sm font-medium text-[#b8c4c2] mb-1">Conexión</label>
            <select v-model="perifericos[0].conexion_video" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-sm text-white">
              <option value="VGA">VGA</option><option value="HDMI">HDMI</option><option value="DVI">DVI</option><option value="DisplayPort">DisplayPort</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-[#b8c4c2] mb-1">Estado</label>
            <select v-model="perifericos[0].estado" class="w-full border rounded-lg px-3 py-2 text-sm font-bold"
              :class="{
                'border-[#00ed64]/50 text-[#00ed64] bg-[#00ed64]/10': perifericos[0].estado === 'bueno',
                'border-amber-500/50 text-amber-400 bg-amber-500/10': perifericos[0].estado === 'medio',
                'border-red-500/50 text-red-400 bg-red-500/10': perifericos[0].estado === 'malo',
              }">
              <option value="bueno">Buen estado</option><option value="medio">Medio</option><option value="malo">Malo</option>
            </select>
          </div>
        </div>
      </fieldset>

      <!-- TECLADO -->
      <fieldset class="bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-4 space-y-4">
        <legend class="text-sm font-bold text-[#00ed64] uppercase tracking-wide px-2 font-mono">Teclado</legend>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">Marca</label><input v-model="perifericos[1].marca" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-sm text-white" /></div>
          <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">Modelo</label><input v-model="perifericos[1].modelo" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-sm text-white" /></div>
          <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">Código Público</label><input v-model="perifericos[1].codigo_bien_publico" placeholder="No aplica si no tiene" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-sm text-white placeholder-[#5c6c75]" /></div>
          <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">Código Privado</label><input v-model="perifericos[1].codigo_bien_privado" placeholder="No aplica si no tiene" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-sm text-white placeholder-[#5c6c75]" /></div>
          <div>
            <label class="block text-sm font-medium text-[#b8c4c2] mb-1">Estado</label>
            <select v-model="perifericos[1].estado" class="w-full border rounded-lg px-3 py-2 text-sm font-bold"
              :class="{
                'border-[#00ed64]/50 text-[#00ed64] bg-[#00ed64]/10': perifericos[1].estado === 'bueno',
                'border-amber-500/50 text-amber-400 bg-amber-500/10': perifericos[1].estado === 'medio',
                'border-red-500/50 text-red-400 bg-red-500/10': perifericos[1].estado === 'malo',
              }">
              <option value="bueno">Buen estado</option><option value="medio">Medio</option><option value="malo">Malo</option>
            </select>
          </div>
        </div>
      </fieldset>

      <!-- MOUSE -->
      <fieldset class="bg-[#002b3b] border border-[#00684a]/30 rounded-xl p-4 space-y-4">
        <legend class="text-sm font-bold text-[#00ed64] uppercase tracking-wide px-2 font-mono">Mouse</legend>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">Marca</label><input v-model="perifericos[2].marca" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-sm text-white" /></div>
          <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">Modelo</label><input v-model="perifericos[2].modelo" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-sm text-white" /></div>
          <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">Código Público</label><input v-model="perifericos[2].codigo_bien_publico" placeholder="No aplica si no tiene" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-sm text-white placeholder-[#5c6c75]" /></div>
          <div><label class="block text-sm font-medium text-[#b8c4c2] mb-1">Código Privado</label><input v-model="perifericos[2].codigo_bien_privado" placeholder="No aplica si no tiene" class="w-full bg-[#001e2b] border border-[#00684a]/50 rounded-lg px-3 py-2 text-sm text-white placeholder-[#5c6c75]" /></div>
          <div>
            <label class="block text-sm font-medium text-[#b8c4c2] mb-1">Estado</label>
            <select v-model="perifericos[2].estado" class="w-full border rounded-lg px-3 py-2 text-sm font-bold"
              :class="{
                'border-[#00ed64]/50 text-[#00ed64] bg-[#00ed64]/10': perifericos[2].estado === 'bueno',
                'border-amber-500/50 text-amber-400 bg-amber-500/10': perifericos[2].estado === 'medio',
                'border-red-500/50 text-red-400 bg-red-500/10': perifericos[2].estado === 'malo',
              }">
              <option value="bueno">Buen estado</option><option value="medio">Medio</option><option value="malo">Malo</option>
            </select>
          </div>
        </div>
      </fieldset>
    </div>

    <div class="flex justify-end gap-3 pt-4 border-t border-[#00684a]/30">
      <BaseButton type="button" variant="cancel" @click="emit('cancelar')">Cancelar</BaseButton>
      <BaseButton type="submit" variant="primary" :loading="guardando">Guardar Equipo</BaseButton>
    </div>
  </form>
</template>