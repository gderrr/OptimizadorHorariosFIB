import { useState } from 'react'
import { colorDeAsignatura } from '../lib/colores.js'

/**
 * Barra de controles superior (como en el boceto inicial).
 *
 * De izquierda a derecha / arriba a abajo: buscador con resultados, asignaturas
 * seleccionadas, atajos de selección de franjas y el botón
 * "Calcular". El horario va debajo, a todo el ancho.
 *
 * Componente puramente presentacional: recibe estado y callbacks por props.
 */
export function Controles({
  busqueda,
  onBusqueda,
  resultados = [],
  seleccionadas,
  gruposExcluidos,
  onAnadir,
  onQuitar,
  onAnadirGrupoExcluido,
  onQuitarGrupoExcluido,
  permitirSolapamientosEntreAsignaturas,
  onPermitirSolapamientosEntreAsignaturas,
  onSeleccionarTodo,
  onDeseleccionarTodo,
  onCalcular,
}) {
  const hayBusqueda = busqueda.trim().length > 0

  return (
    <section className="controles">
      <div className="controles__fila">
        {/* Buscador + resultados de búsqueda parcial */}
        <div className="controles__buscar">
          <label className="campo__label" htmlFor="buscador">
            Buscar asignatura
          </label>
          <div className="buscador-wrap">
            <div className="buscador">
              <span className="buscador__icon" aria-hidden="true">
                <IconoBuscar />
              </span>
              <input
                id="buscador"
                className="buscador__input"
                type="text"
                placeholder="EDA, AS, M1…"
                value={busqueda}
                onChange={(e) => onBusqueda(e.target.value)}
                autoComplete="off"
              />
            </div>

            {hayBusqueda && (
              <ul className="resultados">
                {resultados.length === 0 ? (
                  <li className="resultados__vacio">Ningún resultado.</li>
                ) : (
                  resultados.map((a) => (
                    <li key={a}>
                      <button
                        type="button"
                        className="resultados__item"
                        onClick={() => onAnadir(a)}
                      >
                        <span
                          className="resultados__dot"
                          style={{ background: colorDeAsignatura(a) }}
                          aria-hidden="true"
                        />
                        <span>{a}</span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          {seleccionadas.length > 0 && (
            <ul className="asig-cards">
              {seleccionadas.map((a) => (
                <TarjetaAsignatura
                  key={a}
                  asignatura={a}
                  excluidos={gruposExcluidos[a] ?? []}
                  onQuitar={() => onQuitar(a)}
                  onAnadirExcluido={(grup) => onAnadirGrupoExcluido(a, grup)}
                  onQuitarExcluido={(grup) => onQuitarGrupoExcluido(a, grup)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Acción principal */}
        <button type="button" className="btn btn--primary btn-theme" onClick={onCalcular}>
          Calcular
        </button>
      </div>

      <div className="controles__opciones">
        <label className="check">
          <input
            type="checkbox"
            checked={permitirSolapamientosEntreAsignaturas}
            onChange={(e) => onPermitirSolapamientosEntreAsignaturas(e.target.checked)}
          />
          <span className="check__box" aria-hidden="true" />
          <span className="check__text">
            Permitir solapamientos entre diferentes asignaturas
          </span>
        </label>

        <div className="controles__franjas">
          <button type="button" className="btn btn--ghost" onClick={onSeleccionarTodo}>
            Seleccionar todo
          </button>
          <button type="button" className="btn btn--ghost" onClick={onDeseleccionarTodo}>
            Deseleccionar todo
          </button>
        </div>
      </div>
    </section>
  )
}

function TarjetaAsignatura({ asignatura, excluidos, onQuitar, onAnadirExcluido, onQuitarExcluido }) {
  const [entrada, setEntrada] = useState('')

  const anadir = () => {
    onAnadirExcluido(entrada)
    setEntrada('')
  }

  return (
    <li className="asig-card fitxa">
      <div className="asig-card__head">
        <span className="asig-card__dot" aria-hidden="true" />
        <span className="asig-card__label">{asignatura}</span>
        <button
          type="button"
          className="asig-card__remove"
          onClick={onQuitar}
          aria-label={`Quitar ${asignatura}`}
        >
          <IconoCerrar />
        </button>
      </div>

      <div className="excluir-grupos">
        <span className="excluir-grupos__label">Excluir grupos</span>
        <div className="excluir-grupos__fila">
          <input
            className="excluir-grupos__input"
            type="text"
            inputMode="numeric"
            placeholder="10"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                anadir()
              }
            }}
            aria-label={`Número de grupo a excluir en ${asignatura}`}
          />
          <button type="button" className="btn btn--ghost btn--sm" onClick={anadir}>
            Añadir
          </button>
        </div>

        {excluidos.length > 0 && (
          <ul className="excluidos">
            {excluidos.map((grup) => (
              <li key={grup} className="excluido-chip">
                <span>{grup}</span>
                <button
                  type="button"
                  className="excluido-chip__remove"
                  onClick={() => onQuitarExcluido(grup)}
                  aria-label={`Quitar grupo ${grup} de la exclusión`}
                >
                  <IconoCerrar />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}

function IconoBuscar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function IconoCerrar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
