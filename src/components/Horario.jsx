import { useMemo } from 'react'
import { colorDeAsignatura, textoLegible } from '../lib/colores.js'

/** Etiqueta de una fila a partir de la hora de inicio: 8 => "8-9h". */
const etiquetaHora = (hora) => `${hora} - ${hora + 1}`

/**
 * Rejilla del horario semanal (estilo tabla).
 *
 * Cada celda:
 *  - es seleccionable (clic) — guardado en `celdas`,
 *  - las celdas NO seleccionadas se muestran rayadas (no disponibles),
 *  - muestra los bloques de clase que la lógica haya colocado en `horario`,
 *    ocupando toda la celda.
 *
 * Componente presentacional: no conoce la lógica de negocio.
 */
export function Horario({ dias, horas, celdas, horario, claveCelda, onAlternarCelda }) {
  // Índice rápido: clave de celda -> bloques [{ asignatura, grupo }].
  const bloquesPorCelda = useMemo(() => {
    const mapa = new Map()
    for (const [asignatura, grupo, dia, hora] of horario) {
      const clave = claveCelda(dia, hora)
      if (!mapa.has(clave)) mapa.set(clave, [])
      mapa.get(clave).push({ asignatura, grupo })
    }
    return mapa
  }, [horario, claveCelda])

  return (
    <section className="horario">
      <div className="horario__head">
        <h2 className="horario__title">Horario semanal</h2>
        <ul className="leyenda">
          <li className="leyenda__item">
            <span className="leyenda__muestra leyenda__muestra--libre" />
            Disponible
          </li>
          <li className="leyenda__item">
            <span className="leyenda__muestra leyenda__muestra--rayada" />
            No seleccionada
          </li>
          <li className="leyenda__item">
            <span className="leyenda__muestra leyenda__muestra--clase" />
            Clase (color por asignatura)
          </li>
        </ul>
      </div>

      <div className="horario__scroll">
        <div
          className="horario__grid"
          style={{ '--cols': dias.length }}
          role="grid"
          aria-label="Horario semanal"
        >
          {/* Cabecera */}
          <div className="horario__corner" role="columnheader" aria-label="Hora" />
          {dias.map((dia) => (
            <div key={dia} className="horario__dia titol-assig" role="columnheader">
              {dia}
            </div>
          ))}

          {/* Filas */}
          {horas.map((hora) => (
            <FilaHora
              key={hora}
              hora={hora}
              dias={dias}
              celdas={celdas}
              bloquesPorCelda={bloquesPorCelda}
              claveCelda={claveCelda}
              onAlternarCelda={onAlternarCelda}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function FilaHora({ hora, dias, celdas, bloquesPorCelda, claveCelda, onAlternarCelda }) {
  return (
    <>
      <div className="horario__hora" role="rowheader">
        {etiquetaHora(hora)}
      </div>
      {dias.map((dia) => {
        const clave = claveCelda(dia, hora)
        const seleccionada = celdas.has(clave)
        const bloques = bloquesPorCelda.get(clave) ?? []
        return (
          <button
            type="button"
            key={clave}
            className={
              'horario__celda casella' +
              (seleccionada ? ' is-selected' : '') +
              (bloques.length ? ' has-block' : '')
            }
            onClick={() => onAlternarCelda(dia, hora)}
            aria-pressed={seleccionada}
            aria-label={`${dia} ${etiquetaHora(hora)}h`}
          >
            {bloques.length > 0 && (
              <span className="horario__bloques">
                {bloques.map((b, i) => {
                  const color = colorDeAsignatura(b.asignatura)
                  return (
                  <span
                    key={`${b.asignatura}-${b.grupo}-${i}`}
                    className="celda-bloque classe-horari"
                    style={{ background: color, color: textoLegible(color) }}
                  >
                    <span className="celda-bloque__asig">{b.asignatura}</span>
                    <span className="celda-bloque__grupo">{b.grupo}</span>
                  </span>
                  )
                })}
              </span>
            )}
          </button>
        )
      })}
    </>
  )
}
