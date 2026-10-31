import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificacionesStore = defineStore('notificaciones', () => {
  const notificaciones = ref([])
  let idCounter = 0

  /**
   * Añade una notificación.
   * @param {string} mensaje 
   * @param {string} tipo 
   * @param {number} duracion 
   */
  function agregar(mensaje, tipo = 'info', duracion = 3500) {
    const id = ++idCounter
    notificaciones.value.push({ id, mensaje, tipo })

    if (duracion > 0) {
      setTimeout(() => {
        eliminar(id)
      }, duracion)
    }
  }

  function eliminar(id) {
    const index = notificaciones.value.findIndex((n) => n.id === id)
    if (index !== -1) notificaciones.value.splice(index, 1)
  }

  // Atajos
  const exito = (msg, dur) => agregar(msg, 'exito', dur)
  const error = (msg, dur) => agregar(msg, 'error', dur)
  const info = (msg, dur) => agregar(msg, 'info', dur)
  const advertencia = (msg, dur) => agregar(msg, 'advertencia', dur)

  return { notificaciones, agregar, eliminar, exito, error, info, advertencia }
})