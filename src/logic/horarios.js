/**
 * ============================================================================
 *  LÓGICA DE NEGOCIO  ·  Optimizador de Horarios FIB
 * ============================================================================
 *
 *  El layout (la interfaz de React) está totalmente desacoplado de la lógica.
 *  Toda la comunicación entre ambos ocurre de forma puramente funcional a
 *  través de las tres funciones exportadas más abajo. La UI llama a estas
 *  funciones y pinta lo que devuelven.
 *
 * ----------------------------------------------------------------------------
 *  CONTRATO DE TIPOS COMPARTIDO
 * ----------------------------------------------------------------------------
 *
 *  @typedef {string} Quadri        Identificador de cuatrimestre. Ej: "2024Q1".
 *  @typedef {string} Asignatura    Identificador de asignatura. Ej: "EDA".
 *  @typedef {string} Grupo         Identificador de grupo. Ej: "10", "11".
 *  @typedef {string} Dia           Uno de: "Lunes" | "Martes" | "Miercoles"
 *                                   | "Jueves" | "Viernes".
 *  @typedef {number} Hora          Hora de inicio del bloque (entero 8..20).
 *                                   Cada bloque dura 1h: 8 => "8-9h".
 *
 *  // Celda del horario seleccionada por el usuario.
 *  @typedef {[Dia, Hora]} Celda
 *
 *  // Bloque de clase que devuelve el cálculo y que se pinta en el horario.
 *  @typedef {[Asignatura, Grupo, Dia, Hora]} BloqueHorario
 *
 * ============================================================================
 */

/** Días de la semana usados por el horario (orden de columnas). */
export const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes']

/** Horas de inicio de cada bloque (orden de filas). 8 => "8-9h", ... 20 => "20-21h". */
export const HORAS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

/**
 * Identificador de cliente para la API de la FIB.
 * Variable de entorno `VITE_CLIENT_ID` (Vite solo expone variables con prefijo `VITE_`).
 */
export const clientId = import.meta.env.VITE_CLIENT_ID ?? ''

const apiHeaders = {
  Accept: 'application/json',
}

/** Cuatrimestre activo; se rellena al llamar a `obtenerQuadriMasReciente()`. */
export let quadriActual = null

function mapDiaNumberToString(diaNumber) {
  switch (diaNumber) {
    case 1: return 'Lunes';
    case 2: return 'Martes';
    case 3: return 'Miercoles';
    case 4: return 'Jueves';
    case 5: return 'Viernes';
    default: return null;
  }
}

function mapDiaStringToNumber(diaString) {
  return DIAS.indexOf(diaString) + 1; // 0-indexed to 1-indexed
}

function mapHoraStringToNumber(horaString) {
  switch (horaString) {
    case '08:00': return 8;
    case '09:00': return 9;
    case '10:00': return 10;
    case '11:00': return 11;
    case '12:00': return 12;
    case '13:00': return 13;
    case '14:00': return 14;
    case '15:00': return 15;
    case '16:00': return 16;
    case '17:00': return 17;
    case '18:00': return 18;
    case '19:00': return 19;
    case '20:00': return 20;
    default: return null;
  }
}

/** Convierte hora de inicio (8..20) al índice de fila en la matriz (0..12). */
function horaToRowIndex(hora) {
  return hora - HORAS[0]
}

/** Primer carácter del identificador de grupo (familia grupo/subgrupo). */
function primerDigitoGrupo(grup) {
  return String(grup).charAt(0)
}

function esGrupoPrincipal(grup) {
  return String(grup).endsWith('0')
}

function ordenarGrupos(grupA, grupB) {
  const numA = Number(grupA)
  const numB = Number(grupB)
  if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB
  return String(grupA).localeCompare(String(grupB))
}

function sesionABloques(data) {
  const dia = mapDiaNumberToString(data.dia_setmana)
  const horaInicio = mapHoraStringToNumber(data.inici)
  if (dia == null || horaInicio == null) return []

  const bloques = []
  for (let i = 0; i < data.durada; i++) {
    bloques.push({
      assig: data.codi_assig,
      grup: data.grup,
      dia,
      hora: horaInicio + i,
    })
  }
  return bloques
}

function celdaSeleccionada(horarioMatrix, dia, hora) {
  const col = mapDiaStringToNumber(dia) - 1
  const row = horaToRowIndex(hora)
  if (col < 0 || row < 0 || row >= horarioMatrix.length) return false
  return horarioMatrix[row][col].selected
}

function sesionCompletaCabe(
  sesion,
  horarioMatrix,
  ocupacion,
  assig,
  permitirSolapamientosEntreAsignaturas,
) {
  const bloques = sesionABloques(sesion)
  if (bloques.length === 0) return false

  for (const bloque of bloques) {
    if (!celdaSeleccionada(horarioMatrix, bloque.dia, bloque.hora)) return false

    if (!permitirSolapamientosEntreAsignaturas) {
      const clave = `${bloque.dia}|${bloque.hora}`
      const ocupante = ocupacion.get(clave)
      if (ocupante && ocupante.assig !== assig) return false
    }
  }

  return true
}

function colocarSesion(sesion, resultado, ocupacion) {
  for (const bloque of sesionABloques(sesion)) {
    const clave = `${bloque.dia}|${bloque.hora}`
    if (!ocupacion.has(clave)) ocupacion.set(clave, bloque)
    resultado.push(bloque)
  }
}

function todasLasSesionesCaben(
  sesiones,
  horarioMatrix,
  ocupacion,
  assig,
  permitirSolapamientosEntreAsignaturas,
) {
  return sesiones.length > 0 && sesiones.every((sesion) =>
    sesionCompletaCabe(sesion, horarioMatrix, ocupacion, assig, permitirSolapamientosEntreAsignaturas),
  )
}

function colocarSesionesCompletas(
  sesiones,
  horarioMatrix,
  ocupacion,
  assig,
  resultado,
  permitirSolapamientosEntreAsignaturas,
) {
  for (const sesion of sesiones) {
    if (sesionCompletaCabe(sesion, horarioMatrix, ocupacion, assig, permitirSolapamientosEntreAsignaturas)) {
      colocarSesion(sesion, resultado, ocupacion)
    }
  }
}

function filtrarSesionesExcluidas(sesiones, gruposExcluidos) {
  if (!gruposExcluidos?.length) return sesiones
  const excluidos = new Set(gruposExcluidos.map(String))
  return sesiones.filter((sesion) => !excluidos.has(String(sesion.grup)))
}

function armarHorario(
  asignaturas,
  info,
  horarioMatrix,
  exclusionesPorAsignatura = {},
  permitirSolapamientosEntreAsignaturas = true,
) {
  const ocupacion = new Map()
  const resultado = []

  for (const assig of asignaturas) {
    const gruposExcluidos = exclusionesPorAsignatura[assig] ?? []
    const sesiones = filtrarSesionesExcluidas(
      info.filter((clase) => clase.codi_assig === assig),
      gruposExcluidos,
    )
    const familias = construirFamiliasPorAsignatura(sesiones)

    for (const familia of familias) {
      if (
        !todasLasSesionesCaben(
          familia.principal.sesiones,
          horarioMatrix,
          ocupacion,
          assig,
          permitirSolapamientosEntreAsignaturas,
        )
      ) {
        continue
      }

      familia.subgrupos.sort((a, b) => ordenarGrupos(a.grup, b.grup))

      const subgruposCompatibles = familia.subgrupos.filter((subgrupo) =>
        todasLasSesionesCaben(
          subgrupo.sesiones,
          horarioMatrix,
          ocupacion,
          assig,
          permitirSolapamientosEntreAsignaturas,
        ),
      )

      if (subgruposCompatibles.length === 0) continue

      colocarSesionesCompletas(
        familia.principal.sesiones,
        horarioMatrix,
        ocupacion,
        assig,
        resultado,
        permitirSolapamientosEntreAsignaturas,
      )

      for (const subgrupo of subgruposCompatibles) {
        colocarSesionesCompletas(
          subgrupo.sesiones,
          horarioMatrix,
          ocupacion,
          assig,
          resultado,
          permitirSolapamientosEntreAsignaturas,
        )
      }
    }
  }

  return resultado
}

function construirFamiliasPorAsignatura(sesiones) {
  const porGrup = new Map()

  for (const sesion of sesiones) {
    if (!porGrup.has(sesion.grup)) porGrup.set(sesion.grup, [])
    porGrup.get(sesion.grup).push(sesion)
  }

  const familias = new Map()

  for (const [grup, grupoSesiones] of porGrup) {
    const familia = primerDigitoGrupo(grup)
    if (!familias.has(familia)) {
      familias.set(familia, { principal: null, subgrupos: [] })
    }

    const entrada = {
      grup,
      sesiones: grupoSesiones,
    }

    if (esGrupoPrincipal(grup)) {
      familias.get(familia).principal = entrada
    } else {
      familias.get(familia).subgrupos.push(entrada)
    }
  }

  return [...familias.values()]
    .filter((familia) => familia.principal)
    .sort((a, b) => ordenarGrupos(a.principal.grup, b.principal.grup))
}

/* ──────────────────────────────────────────────────────────────────────────
 * 1) obtenerQuadriMasReciente()
 *    Se ejecuta automáticamente nada más cargar la página de React.
 *
 *    @returns {Quadri} El cuatrimestre más reciente disponible.
 * ────────────────────────────────────────────────────────────────────────── */
export async function obtenerQuadriMasReciente() {
  try {
    const response = await fetch(
      `https://api.fib.upc.edu/v2/quadrimestres/actual-horaris/?client_id=${clientId}`,
      { headers: apiHeaders },
    );
    //console.log(response.text());
    const data = await response.json()
    quadriActual = data.id ?? null
    return quadriActual
  } catch (error) {
    console.error('Error al obtener el cuatrimestre más reciente:', error)
    quadriActual = null
    return null
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * 2) obtenerListaAsignaturas(quadri)
 *    Devuelve los identificadores de asignaturas que se ofrecen en ese
 *    cuatrimestre. La UI los usa como universo para la BÚSQUEDA PARCIAL.
 *
 *    @param   {Quadri} quadri  El cuatrimestre (normalmente el más reciente).
 *    @returns {Asignatura[]}   Conjunto de identificadores de asignatura.
 * ────────────────────────────────────────────────────────────────────────── */
export async function obtenerListaAsignaturas(quadri) {
  if (!quadri) return []

  try {
    const response = await fetch(
      `https://api.fib.upc.edu/v2/quadrimestres/${quadri}/assignatures/?client_id=${clientId}`,
      { headers: apiHeaders },
    )
    if (!response.ok) {
      console.error('Error HTTP al obtener la lista de asignaturas:', response.status)
      return []
    }

    const data = await response.json()
    return Array.isArray(data.results) ? data.results : []
  } catch (error) {
    console.error('Error al obtener la lista de asignaturas:', error)
    return []
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * 3) calcularHorario(quadri, asignaturas, celdasSeleccionadas)
 *    Dada la selección del usuario, decide qué bloques de clase colocar.
 *    La UI limpia el horario y pinta exactamente lo que devuelve esta función.
 *
 *    Por cada asignatura (en el orden en que fueron escogidas), se recorren
 *    todas las familias de grupo (10, 20…) y se muestran las sesiones
 *    compatibles de cada una. Una familia solo es válida si el grupo principal
 *    (x0) encaja por completo y tiene al menos un subgrupo (xy) compatible;
 *    sin grupo no hay subgrupos, y sin subgrupo compatible se descarta el grupo.
 *    Cada sesión debe caber entera (inici + durada en franjas seleccionadas).
 *    Los grupos indicados en `exclusionesPorAsignatura` no se consideran.
 *    Un bloque se excluye si alguna hora de su sesión no está seleccionada o,
 *    con la opción desactivada, solapa con otra asignatura ya colocada; la
 *    prioridad la tiene lo escogido antes.
 *
 *    @param {Quadri}       quadri              Cuatrimestre.
 *    @param {Asignatura[]} asignaturas         Asignaturas seleccionadas (orden = prioridad).
 *    @param {Celda[]}      celdasSeleccionadas  Celdas (dia, hora) marcadas.
 *    @param {Object.<Asignatura, Grupo[]>} [exclusionesPorAsignatura]
 *                                Grupos/subgrupos excluidos por asignatura.
 *    @param {boolean}      [permitirSolapamientosEntreAsignaturas=true]
 *    @returns {BloqueHorario[]}  Conjunto de (asignatura, grupo, dia, hora)
 *                                a pintar en el horario.
 * ────────────────────────────────────────────────────────────────────────── */
export async function calcularHorario(
  quadri,
  asignaturas,
  celdasSeleccionadas,
  exclusionesPorAsignatura = {},
  permitirSolapamientosEntreAsignaturas = true,
) {
  try {
    if (asignaturas.length === 0) return []

    const assesStr = asignaturas.join(',')
    const response = await fetch(
      `https://api.fib.upc.edu/v2/quadrimestres/${quadri}/classes/?client_id=${clientId}&codi_assig=${assesStr}`,
      { headers: apiHeaders },
    )
    const inter = await response.json()
    const info = inter.results ?? []

    const rows = HORAS.length
    const cols = DIAS.length
    const horarioMatrix = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({ selected: false })),
    )

    for (const [dia, horaNumber] of celdasSeleccionadas) {
      const diaNumber = mapDiaStringToNumber(dia) - 1
      horarioMatrix[horaToRowIndex(horaNumber)][diaNumber].selected = true
    }

    const bloques = armarHorario(
      asignaturas,
      info,
      horarioMatrix,
      exclusionesPorAsignatura,
      permitirSolapamientosEntreAsignaturas,
    )

    return bloques.map((bloque) => [bloque.assig, bloque.grup, bloque.dia, bloque.hora])
  } catch (error) {
    console.error('Error al calcular el horario:', error)
    return []
  }
}