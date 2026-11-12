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

// --- ESTADO ---
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

// ¿Es un equipo de sobremesa? (ID 1)
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

// --- WATCH: Cargar datos al editar ---
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

      // Cargar hardware
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

      // Cargar periféricos si es sobremesa
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

// --- VALIDACIONES ---
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

// --- ENVÍO ---
async function onSubmit() {
  if (!validarFormulario()) return
  guardando.value = true

  // Construir hardware
  const hardwareArray = []
  
  // Solo enviamos hardware si es una categoría que lo requiere
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
    
    <!-- TABS: Solo si es sobremesa -->
    <div v-if="esSobremesa" class="flex border-b border-slate-200 mb-6">
      <button 
        type="button"
        @click="pestanaActiva = 'basico'"
        class="px-6 py-3 font-bold text-sm transition-colors border-b-2"
        :class="pestanaActiva === 'basico' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
      >
        1. Datos del Equipo
      </button>
      <button 
        type="button"
        @click="pestanaActiva = 'perifericos'"
        class="px-6 py-3 font-bold text-sm transition-colors border-b-2"
        :class="pestanaActiva === 'perifericos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'"
      >
        2. Anexo: Periféricos
      </button>
    </div>

    <!-- PESTAÑA 1: FORMULARIO PRINCIPAL -->
    <div v-show="!esSobremesa || pestanaActiva === 'basico'" class="space-y-6">
      
      <!-- IDENTIFICACIÓN -->
      <fieldset class="space-y-4 bg-blue-50/50 border border-blue-100 rounded-xl p-4">
        <legend class="text-sm font-bold text-blue-700 uppercase tracking-wide px-2">Identificación</legend>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Código de bien público *</label>
            <input v-model="form.codigo_bien_publico" required :disabled="!!props.equipo" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" :class="{ 'border-rose-400': errores.codigo_bien_publico }" />
            <p v-if="errores.codigo_bien_publico" class="text-xs text-rose-500 mt-1">{{ errores.codigo_bien_publico }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Código de bien privado</label>
            <input v-model="form.codigo_bien_privado" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Categoría *</label>
            <select v-model="form.categoria_id" required class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" :class="{ 'border-rose-400': errores.categoria_id }">
              <option value="">— Seleccionar —</option>
              <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
            <p v-if="errores.categoria_id" class="text-xs text-rose-500 mt-1">{{ errores.categoria_id }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Estado *</label>
            <select v-model="form.estado" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="activo">Activo</option>
              <option value="reparacion">En reparación</option>
              <option value="baja">De baja</option>
            </select>
          </div>
        </div>
      </fieldset>

      <!-- DATOS DEL EQUIPO -->
      <fieldset class="space-y-4 bg-slate-50/50 border border-slate-100 rounded-xl p-4">
        <legend class="text-sm font-bold text-slate-700 uppercase tracking-wide px-2">Datos del equipo</legend>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Marca</label><input v-model="form.marca" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Modelo</label><input v-model="form.modelo" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">N° de serie</label><input v-model="form.numero_serie" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Fecha de registro</label><input v-model="form.fecha_registro" type="date" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Fecha de fabricación</label><input v-model="form.fecha_fabricacion" type="date" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Ubicación</label>
            <select v-model="form.ubicacion" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
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
        <div><label class="block text-sm font-medium text-slate-700 mb-1">Notas</label><textarea v-model="form.notas" rows="2" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" /></div>
      </fieldset>

      <!-- SO Y HARDWARE (igual que tu código anterior) -->
      <div v-if="[1, 2, 5].includes(parseInt(form.categoria_id))" class="space-y-6">
        <!-- ... (bloque de SO y Hardware igual que antes) ... -->
      </div>
    </div>

    <!-- PESTAÑA 2: PERIFÉRICOS -->
    <div v-show="esSobremesa && pestanaActiva === 'perifericos'" class="space-y-6">
      
      <!-- MONITOR -->
      <fieldset class="bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-4">
        <legend class="text-sm font-bold text-blue-700 uppercase tracking-wide px-2">Monitor</legend>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Marca</label><input v-model="perifericos[0].marca" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Modelo</label><input v-model="perifericos[0].modelo" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Código Público</label><input v-model="perifericos[0].codigo_bien_publico" placeholder="No aplica si no tiene" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Código Privado</label><input v-model="perifericos[0].codigo_bien_privado" placeholder="No aplica si no tiene" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Conexión</label>
            <select v-model="perifericos[0].conexion_video" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm">
              <option value="VGA">VGA</option><option value="HDMI">HDMI</option><option value="DVI">DVI</option><option value="DisplayPort">DisplayPort</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Estado</label>
            <select v-model="perifericos[0].estado" class="w-full border rounded-lg px-3 py-2 text-sm font-bold"
              :class="{
                'border-emerald-300 text-emerald-700 bg-emerald-50': perifericos[0].estado === 'bueno',
                'border-amber-300 text-amber-700 bg-amber-50': perifericos[0].estado === 'medio',
                'border-rose-300 text-rose-700 bg-rose-50': perifericos[0].estado === 'malo',
              }">
              <option value="bueno">Buen estado</option><option value="medio">Medio</option><option value="malo">Malo</option>
            </select>
          </div>
        </div>
      </fieldset>

      <!-- TECLADO Y MOUSE (similar, ocupa perifericos[1] y perifericos[2]) -->
      <fieldset class="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-4">
        <legend class="text-sm font-bold text-slate-700 uppercase tracking-wide px-2">Teclado</legend>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Marca</label><input v-model="perifericos[1].marca" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Modelo</label><input v-model="perifericos[1].modelo" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Código Público</label><input v-model="perifericos[1].codigo_bien_publico" placeholder="No aplica si no tiene" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Código Privado</label><input v-model="perifericos[1].codigo_bien_privado" placeholder="No aplica si no tiene" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Estado</label>
            <select v-model="perifericos[1].estado" class="w-full border rounded-lg px-3 py-2 text-sm font-bold"
              :class="{
                'border-emerald-300 text-emerald-700 bg-emerald-50': perifericos[1].estado === 'bueno',
                'border-amber-300 text-amber-700 bg-amber-50': perifericos[1].estado === 'medio',
                'border-rose-300 text-rose-700 bg-rose-50': perifericos[1].estado === 'malo',
              }">
              <option value="bueno">Buen estado</option><option value="medio">Medio</option><option value="malo">Malo</option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset class="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-4">
        <legend class="text-sm font-bold text-slate-700 uppercase tracking-wide px-2">Mouse</legend>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Marca</label><input v-model="perifericos[2].marca" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Modelo</label><input v-model="perifericos[2].modelo" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Código Público</label><input v-model="perifericos[2].codigo_bien_publico" placeholder="No aplica si no tiene" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label class="block text-sm font-medium text-slate-700 mb-1">Código Privado</label><input v-model="perifericos[2].codigo_bien_privado" placeholder="No aplica si no tiene" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm" /></div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Estado</label>
            <select v-model="perifericos[2].estado" class="w-full border rounded-lg px-3 py-2 text-sm font-bold"
              :class="{
                'border-emerald-300 text-emerald-700 bg-emerald-50': perifericos[2].estado === 'bueno',
                'border-amber-300 text-amber-700 bg-amber-50': perifericos[2].estado === 'medio',
                'border-rose-300 text-rose-700 bg-rose-50': perifericos[2].estado === 'malo',
              }">
              <option value="bueno">Buen estado</option><option value="medio">Medio</option><option value="malo">Malo</option>
            </select>
          </div>
        </div>
      </fieldset>

    </div>

    <!-- BOTONES -->
    <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
      <BaseButton type="button" variant="cancel" @click="emit('cancelar')">Cancelar</BaseButton>
      <BaseButton type="submit" variant="primary" :loading="guardando">Guardar Equipo</BaseButton>
    </div>
  </form>
</template>