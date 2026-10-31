import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'


export async function generarPlanillasPDF(solicitudes) {
  const doc = new jsPDF('landscape', 'mm', 'letter')
  const anchoPagina = doc.internal.pageSize.getWidth()

  // --- 2. ENCABEZADO DEL TÍTULO ---
  
  const yTitulo = 40 
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('FORMATO DE CONTROL Y SOLICITUD DE EQUIPOS TECNOLÓGICOS', anchoPagina / 2, yTitulo, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Fecha de Emisión: ' + new Date().toLocaleDateString('es-ES'), anchoPagina - 15, yTitulo + 8, { align: 'right' })

  // --- 3. CONSTRUIR LOS DATOS DE LA TABLA ---
  const filas = solicitudes.map((s) => {
    const fSol = new Date(s.fecha_solicitud)
    const fEnt = s.fecha_entrega ? new Date(s.fecha_entrega) : null
    
    const formatFechaHora = (date) => {
      if (!date) return '—'
      const d = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
      const h = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      return `${d} ${h}`
    }

    const accesorios = []
    if (s.con_extension) accesorios.push('Extensión')
    if (s.con_cable_hdmi) accesorios.push('HDMI')
    if (s.con_cable_vga) accesorios.push('VGA')
    if (s.con_caja) accesorios.push('Caja')
    if (s.con_alimentador) accesorios.push('Alimentador')

    return [
      s.nombre_completo,
      s.cedula || '—',
      s.pnf || '—',
      s.tipo_solicitante === 'docente' ? '[ X ] Docente\n[   ] Estudiante' : '[   ] Docente\n[ X ] Estudiante',
      s.equipos?.codigo_bien_publico || '—',
      accesorios.join(', ') || 'Ninguno',
      formatFechaHora(fSol),
      formatFechaHora(fEnt),
      s.estado.toUpperCase()
    ]
  })

  // --- 4. DIBUJAR LA TABLA ---
  autoTable(doc, {
    startY: yTitulo + 15, // Bajamos la tabla para que quede debajo del título
    head: [[
      'Nombre del Solicitante', 
      'Cédula', 
      'PNF', 
      'Tipo Solicitante', 
      'ID / Código Equipo', 
      'Accesorios Entregados', 
      'Fecha Salida', 
      'Fecha Retorno', 
      'Estado'
    ]],
    body: filas,
    theme: 'grid',
    headStyles: { 
      fillColor: [30, 58, 138], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { 
      fontSize: 8, 
      cellPadding: 3, 
      textColor: [0, 0, 0],
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 40 }, // Nombre
      1: { cellWidth: 20, halign: 'center' }, // Cédula
      2: { cellWidth: 30 }, // PNF
      3: { cellWidth: 25, halign: 'center', fontSize: 7 }, // Tipo
      4: { cellWidth: 25, halign: 'center' }, // Código Equipo
      5: { cellWidth: 45 }, // Accesorios
      6: { cellWidth: 25, halign: 'center' }, // Salida
      7: { cellWidth: 25, halign: 'center' }, // Retorno
      8: { cellWidth: 20, halign: 'center' }  // Estado
    },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  })

  // --- 5. SECCIÓN DE FIRMAS AL FINAL ---
  let finalY = doc.lastAutoTable.finalY + 20

  if (finalY > 180) {
    doc.addPage()
    finalY = 40
  }

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Firma del Responsable de Entrega/Recibe:', anchoPagina / 2, finalY, { align: 'center' })
  
  doc.line(anchoPagina / 2 - 40, finalY + 15, anchoPagina / 2 + 40, finalY + 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Firma y Sello', anchoPagina / 2, finalY + 20, { align: 'center' })

  // Guardar el archivo
  const fechaHoy = new Date().toISOString().slice(0, 10)
  doc.save(`Control_Solicitudes_${fechaHoy}.pdf`)
}