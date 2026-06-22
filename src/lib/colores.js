/**
 * Color estable por asignatura (solo presentación).
 *
 * Asigna de forma determinista un color de la paleta a cada identificador de
 * asignatura, de modo que el mismo nombre tenga siempre el mismo color tanto
 * en el chip de "seleccionadas" como en los bloques del horario.
 */

/** Paleta de colores para distinguir asignaturas. */
export const PALETA = [
  '#ffffff', // blanco
  '#ef4444', // rojo
  '#10b981', // esmeralda
  '#d97706', // ámbar
  '#8b5cf6', // violeta
  '#ec4899', // rosa
  '#0891b2', // cian
  '#ea580c', // naranja
  '#14b8a6', // turquesa
  '#6366f1', // índigo
]

/**
 * @param {string} nombre  Identificador de la asignatura.
 * @returns {string}       Color hexadecimal de la paleta.
 */
export function colorDeAsignatura(nombre) {
  let h = 0
  for (let i = 0; i < nombre.length; i++) {
    h = (h * 31 + nombre.charCodeAt(i)) >>> 0
  }
  return PALETA[h % PALETA.length]
}

/**
 * Color de texto legible (claro u oscuro) según la luminancia del fondo.
 * Permite que colores claros como el blanco lleven texto oscuro.
 *
 * @param {string} hex  Color de fondo (#rrggbb).
 * @returns {string}    '#0c0f14' (oscuro) o '#ffffff' (claro).
 */
export function textoLegible(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  // Luminancia relativa aproximada (sRGB).
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminancia > 0.6 ? '#222222' : '#ffffff'
}
