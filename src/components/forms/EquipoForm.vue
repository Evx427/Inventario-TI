<script setup>
import { ref, watch, computed } from 'vue'
import { supabase } from '../../lib/supabase'
import BaseButton from '../ui/BaseButton.vue'

const props = defineProps({
  equipo: { type: Object, default: null },
})

const emit = defineEmits(['guardar', 'cancelar'])

// --- ESTADO DEL FORMULARIO ---
const form = ref(getFormVacio())
const categorias = ref([])
const sistemasOperativos = ref([])
const guardando = ref(false)
const errores = ref({})

// Estado para el hardware dinámico
const hardware = ref({
  placa_base: { marca: '', modelo: '', identificador: '' },
  ram: { tipo: 'DDR4', cantidad_modulos: 1 },
  almacenamiento: { tipo: 'SSD', capacidad_gb: 256 },
  tiene_gpu: false,
  gpu: { marca: '', modelo: '' },
  tiene_red: false,
  red: { marca: '', modelo: '' },
})

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

// --- CARGA DE CATÁLOGOS ---
async function cargarCatalogos() {
  const [cat, so] = await Promise.all([
    supabase.from('categorias').select('*').order('id'),
    supabase.from('sistemas_operativos').select('*').order('nombre'),
  ])
  categorias.value = cat.data || []
  sistemasOperativos.value = so.data || []
}

// --- CARGA DE DATOS PARA EDICIÓN ---
watch(
  () => props.equipo,
  async (eq) => {
    await cargarCatalogos()
    if (eq) {
      // Cargar datos del equipo
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

      // Reconstruir el hardware desde la BD
      const hardwareBD = eq.hardware || []
      
      // Placa base
      const placa = hardwareBD.find(h => h.tipo === 'placa_base')
      if (placa) {
        hardware.value.placa_base = { marca: placa.marca || '', modelo: placa.modelo || '', identificador: placa.identificador || '' }
      }

      // RAM
      const ram = hardwareBD.find(h => h.tipo === 'ram')
      if (ram) {
        hardware.value.ram = { tipo: ram.tipo_ram || 'DDR4', cantidad_modulos: ram.cantidad_modulos || 1 }
      }

      // Almacenamiento (tomamos el primero o sumamos si hay varios)
      const discos = hardwareBD.filter(h => h.tipo === 'almacenamiento')
      if (discos.length > 0) {
        hardware.value.almacenamiento = { 
          tipo: discos[0].tipo_almacenamiento || 'SSD', 
          capacidad_gb: discos.reduce((sum, d) => sum + (d.capacidad_gb || 0), 0) 
        }
      }

      // GPU
      const gpu = hardwareBD.find(h => h.tipo === 'gpu')
      if (gpu) {
        hardware.value.tiene_gpu = true
        hardware.value.gpu = { marca: gpu.marca || '', modelo: gpu.modelo || '' }
      }

      // Red
      const red = hardwareBD.find(h => h.tipo === 'red')
      if (red) {
        hardware.value.tiene_red = true
        hardware.value.red = { marca: red.marca || '', modelo: red.modelo || '' }
      }

    } else {
      form.value = getFormVacio()
      hardware.value = {
        placa_base: { marca: '', modelo: '', identificador: '' },
        ram: { tipo: 'DDR4', cantidad_modulos: 1 },
        almacenamiento: { tipo: 'SSD', capacidad_gb: 256 },
        tiene_gpu: false,
        gpu: { marca: '', modelo: '' },
        tiene_red: false,
        red: { marca: '', modelo: '' },
      }
    }
  },
  { immediate: true }
)

// --- LÓGICA DINÁMICA ---
// Determinar si mostrar secciones de SO y Hardware
const mostrarSeccionesAvanzadas = computed(() => {
  const catId = parseInt(form.value.categoria_id)
  // 1 = Equipo de sobremesa, 2 = Laptop, 5 = Servidor
  return [1, 2, 5].includes(catId)
})

// --- VALIDACIONES ---
function validarFormulario() {
  errores.value = {}
  let valido = true

  // Código público: Alfanumérico y obligatorio
  if (!form.value.codigo_bien_publico.trim()) {
    errores.value.codigo_bien_publico = 'El código público es obligatorio.'
    valido = false
  } else if (!/^[a-zA-Z0-9-]+$/.test(form.value.codigo_bien_publico)) {
    errores.value.codigo_bien_publico = 'Solo letras, números y guiones.'
    valido = false
  }

  // Código privado: Alfanumérico (opcional)
  if (form.value.codigo_bien_privado && !/^[a-zA-Z0-9-]+$/.test(form.value.codigo_bien_privado)) {
    errores.value.codigo_bien_privado = 'Solo letras, números y guiones.'
    valido = false
  }

  // Categoría: Obligatoria
  if (!form.value.categoria_id) {
    errores.value.categoria_id = 'Debes seleccionar una categoría.'
    valido = false
  }

  // Marca/Modelo: Solo texto
  if (form.value.marca && !/^[a-zA-Z0-9\s.-]+$/.test(form.value.marca)) {
    errores.value.marca = 'Caracteres no válidos.'
    valido = false
  }

  // Si mostramos secciones avanzadas, validar hardware
  if (mostrarSeccionesAvanzadas.value) {
    if (hardware.value.ram.cantidad_modulos < 1 || hardware.value.ram.cantidad_modulos > 8) {
      errores.value.ram = 'Cantidad de módulos debe ser entre 1 y 8.'
      valido = false
    }
    if (hardware.value.almacenamiento.capacidad_gb < 1) {
      errores.value.almacenamiento = 'La capacidad debe ser mayor a 0.'
      valido = false
    }
  }

  return valido
}

// --- ENVÍO ---
async function onSubmit() {
  if (!validarFormulario()) return

  guardando.value = true

  // Construir array de hardware para enviar
  const hardwareArray = []

  if (mostrarSeccionesAvanzadas.value) {
    // Placa base
    if (hardware.value.placa_base.marca || hardware.value.placa_base.modelo) {
      hardwareArray.push({
        tipo: 'placa_base',
        ...hardware.value.placa_base
      })
    }

    // RAM
    hardwareArray.push({
      tipo: 'ram',
      marca: '', // Opcional
      modelo: '',
      tipo_ram: hardware.value.ram.tipo,
      cantidad_modulos: parseInt(hardware.value.ram.cantidad_modulos)
    })

    // Almacenamiento
    hardwareArray.push({
      tipo: 'almacenamiento',
      marca: '',
      modelo: '',
      tipo_almacenamiento: hardware.value.almacenamiento.tipo,
      capacidad_gb: parseInt(hardware.value.almacenamiento.capacidad_gb)
    })

    // GPU (si checkbox marcado)
    if (hardware.value.tiene_gpu) {
      hardwareArray.push({
        tipo: 'gpu',
        marca: hardware.value.gpu.marca,
        modelo: hardware.value.gpu.modelo
      })
    }

    // Red (si checkbox marcado)
    if (hardware.value.tiene_red) {
      hardwareArray.push({
        tipo: 'red',
        marca: hardware.value.red.marca,
        modelo: hardware.value.red.modelo
      })
    }
  }

  emit('guardar', {
    equipo: { ...form.value },
    hardware: hardwareArray
  })
  
  guardando.value = false
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="onSubmit">
    
    <!-- SECCIÓN: Identificación -->
    <fieldset class="space-y-4 bg-blue-50/50 border border-blue-100 rounded-xl p-4">
      <legend class="text-sm font-bold text-blue-700 uppercase tracking-wide px-2">
        Identificación
      </legend>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Código de bien público *</label>
          <input
            v-model="form.codigo_bien_publico"
            required
            :disabled="!!props.equipo"
            placeholder="Ej: EQ-2024-001"
            class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
            :class="{ 'border-rose-400': errores.codigo_bien_publico }"
          />
          <p v-if="errores.codigo_bien_publico" class="text-xs text-rose-500 mt-1">{{ errores.codigo_bien_publico }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Código de bien privado</label>
          <input
            v-model="form.codigo_bien_privado"
            placeholder="Ej: INT-001"
            class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            :class="{ 'border-rose-400': errores.codigo_bien_privado }"
          />
          <p v-if="errores.codigo_bien_privado" class="text-xs text-rose-500 mt-1">{{ errores.codigo_bien_privado }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Categoría *</label>
          <select
            v-model="form.categoria_id"
            required
            class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            :class="{ 'border-rose-400': errores.categoria_id }"
          >
            <option value="">— Seleccionar —</option>
            <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
          <p v-if="errores.categoria_id" class="text-xs text-rose-500 mt-1">{{ errores.categoria_id }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Estado *</label>
          <select
            v-model="form.estado"
            class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="activo">Activo</option>
            <option value="reparacion">En reparación</option>
            <option value="baja">De baja</option>
          </select>
        </div>
      </div>
    </fieldset>

    <!-- SECCIÓN: Datos del equipo -->
    <fieldset class="space-y-4 bg-slate-50/50 border border-slate-100 rounded-xl p-4">
      <legend class="text-sm font-bold text-slate-700 uppercase tracking-wide px-2">
        Datos del equipo
      </legend>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Marca</label>
          <input v-model="form.marca" placeholder="Ej: Dell" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
          <input v-model="form.modelo" placeholder="Ej: Latitude 5420" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">N° de serie</label>
          <input v-model="form.numero_serie" placeholder="Ej: SN-12345" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Fecha de registro</label>
          <input v-model="form.fecha_registro" type="date" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Fecha de fabricación</label>
          <input v-model="form.fecha_fabricacion" type="date" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
        </div>
        <div>
  <label class="block text-sm font-medium text-slate-700 mb-1">Ubicación</label>
  <select 
    v-model="form.ubicacion" 
    class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
  >
    <option value="">— Seleccionar Ubicación —</option>
    <option value="Laboratorio de Informática (1)">Laboratorio de Informática (1)</option>
    <option value="Control de Estudio">Control de Estudio</option>
    <option value="Oficina Académica">Oficina Académica</option>
    <option value="Oficina General">Oficina General</option>
    <option value="Oficina del Muru47">Oficina del Muru47</option>
    <option value="Sala de profesores">Sala de profesores</option>

    <!-- Mantiene la ubicación antigua si estás editando un equipo viejo -->
    <option 
      v-if="form.ubicacion && !['Laboratorio de Informática (1)', 'Control de Estudio', 'Oficina Académica', 'Oficina General', 'Oficina del Muru47', 'Sala de profesores'].includes(form.ubicacion)" 
      :value="form.ubicacion"
    > {{ form.ubicacion }} (Ubicación anterior)
    </option>
    </select>
      </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Notas</label>
        <textarea v-model="form.notas" rows="2" placeholder="Observaciones adicionales..." class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
      </div>
    </fieldset>

    <!-- SECCIÓN DINÁMICA: Solo se muestra si la categoría es PC, Laptop o Servidor -->
    <div v-if="mostrarSeccionesAvanzadas" class="space-y-6">
      
      <!-- Sistema Operativo -->
      <fieldset class="space-y-4 bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
        <legend class="text-sm font-bold text-emerald-700 uppercase tracking-wide px-2">
          Sistema Operativo
        </legend>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">SO</label>
            <select v-model="form.so_id" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
              <option value="">— Ninguno —</option>
              <option v-for="so in sistemasOperativos" :key="so.id" :value="so.id">{{ so.nombre }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Versión exacta</label>
            <input v-model="form.so_version_exacta" placeholder="Ej: 22H2" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Compilación</label>
            <input v-model="form.so_compilacion" placeholder="Ej: 19045.3803" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
          </div>
        </div>
      </fieldset>

      <!-- Hardware -->
      <fieldset class="space-y-4 bg-amber-50/50 border border-amber-100 rounded-xl p-4">
        <legend class="text-sm font-bold text-amber-700 uppercase tracking-wide px-2">
          Hardware
        </legend>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Placa Base -->
          <div class="bg-white p-4 rounded-lg border border-slate-100 shadow-sm space-y-3">
            <h4 class="text-xs font-bold text-slate-500 uppercase">Placa Base</h4>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-slate-500 mb-1">Marca</label>
                <input v-model="hardware.placa_base.marca" placeholder="Asus, Gigabyte..." class="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">Modelo</label>
                <input v-model="hardware.placa_base.modelo" placeholder="B550M..." class="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div class="col-span-2">
                <label class="block text-xs text-slate-500 mb-1">ID / Código</label>
                <input v-model="hardware.placa_base.identificador" placeholder="Número de serie de la placa" class="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500" />
              </div>
            </div>
          </div>

          <!-- RAM -->
          <div class="bg-white p-4 rounded-lg border border-slate-100 shadow-sm space-y-3">
            <h4 class="text-xs font-bold text-slate-500 uppercase">Memoria RAM</h4>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-slate-500 mb-1">Tipo</label>
                <select v-model="hardware.ram.tipo" class="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500">
                  <option>DDR2</option><option>DDR3</option><option>DDR4</option><option>DDR5</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">Módulos</label>
                <input v-model.number="hardware.ram.cantidad_modulos" type="number" min="1" max="8" class="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500" />
              </div>
            </div>
          </div>

          <!-- Almacenamiento -->
          <div class="bg-white p-4 rounded-lg border border-slate-100 shadow-sm space-y-3">
            <h4 class="text-xs font-bold text-slate-500 uppercase">Almacenamiento</h4>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-slate-500 mb-1">Tipo</label>
                <select v-model="hardware.almacenamiento.tipo" class="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500">
                  <option>SSD</option><option>HDD</option><option>NVMe</option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-slate-500 mb-1">Capacidad (GB)</label>
                <input v-model.number="hardware.almacenamiento.capacidad_gb" type="number" min="1" class="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500" />
              </div>
            </div>
          </div>

          <!-- GPU y Red (con checkboxes) -->
          <div class="bg-white p-4 rounded-lg border border-slate-100 shadow-sm space-y-4">
            
            <!-- GPU -->
            <div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="hardware.tiene_gpu" class="w-4 h-4 text-amber-500 rounded focus:ring-amber-400" />
                <span class="text-sm font-bold text-slate-700">¿Tiene Tarjeta Gráfica (GPU)?</span>
              </label>
              <div v-if="hardware.tiene_gpu" class="mt-2 pl-6 grid grid-cols-2 gap-3">
                <input v-model="hardware.gpu.marca" placeholder="Marca GPU" class="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500" />
                <input v-model="hardware.gpu.modelo" placeholder="Modelo GPU" class="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500" />
              </div>
            </div>

            <!-- Red -->
            <div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="hardware.tiene_red" class="w-4 h-4 text-amber-500 rounded focus:ring-amber-400" />
                <span class="text-sm font-bold text-slate-700">¿Tiene Tarjeta de Red?</span>
              </label>
              <div v-if="hardware.tiene_red" class="mt-2 pl-6 grid grid-cols-2 gap-3">
                <input v-model="hardware.red.marca" placeholder="Marca Red" class="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500" />
                <input v-model="hardware.red.modelo" placeholder="Modelo Red" class="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-amber-500" />
              </div>
            </div>

          </div>

        </div>
      </fieldset>
    </div>

    <!-- Botones -->
    <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
      <BaseButton variant="cancel" @click="emit('cancelar')">Cancelar</BaseButton>
      <BaseButton type="submit" variant="primary" :loading="guardando">Guardar Equipo</BaseButton>
    </div>
  </form>
</template>