import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { useTheme } from './hooks/useTheme.js'
import { Controles } from './components/Controles.jsx'
import { Horario } from './components/Horario.jsx'
import {
  DIAS,
  HORAS,
  obtenerQuadriMasReciente,
  obtenerListaAsignaturas,
  calcularHorario,
} from './logic/horarios.js'

/** Clave única para una celda (dia, hora) del horario. */
const claveCelda = (dia, hora) => `${dia}|${hora}`

function asignaturasValidas(lista) {
  if (!Array.isArray(lista)) return []
  return lista.filter((item) => typeof item === 'string' && item.length > 0)
}

export default function App() {
  // Mantiene el tema claro FIB aplicado a <html> (sin conmutador visible).
  useTheme()

  // ── Datos provenientes de la lógica de negocio ──────────────────────────
  const [quadri, setQuadri] = useState(null)
  const [listaAsignaturas, setListaAsignaturas] = useState([])

  // ── Estado de la interacción (lo gestiona el layout) ─────────────────────
  const [busqueda, setBusqueda] = useState('')
  const [seleccionadas, setSeleccionadas] = useState([]) // Asignatura[]
  const [gruposExcluidos, setGruposExcluidos] = useState({}) // { [asignatura]: Grupo[] }
  const [permitirSolapamientosEntreAsignaturas, setPermitirSolapamientosEntreAsignaturas] =
    useState(true)
  const [celdas, setCeldas] = useState(() => new Set()) // Set<clave>
  const [horario, setHorario] = useState([]) // BloqueHorario[]

  // 1) Al cargar la página: cuatrimestre más reciente + lista de asignaturas.
  useEffect(() => {
    let cancelled = false

    async function cargar() {
      const quadriActual = await obtenerQuadriMasReciente()
      const lista = await obtenerListaAsignaturas(quadriActual)
      if (!cancelled) {
        setQuadri(quadriActual)
        setListaAsignaturas(asignaturasValidas(lista))
      }
    }

    cargar()

    return () => {
      cancelled = true
    }
  }, [])

  // Búsqueda parcial sobre los identificadores, excluyendo las ya elegidas.
  const resultados = useMemo(() => {
    const termino = busqueda.trim().toUpperCase()
    if (!termino) return []

    return asignaturasValidas(listaAsignaturas).filter(
      (a) => a.toUpperCase().includes(termino) && !seleccionadas.includes(a),
    )
  }, [busqueda, listaAsignaturas, seleccionadas])

  const anadirAsignatura = (a) => {
    if (!seleccionadas.includes(a)) setSeleccionadas((s) => [...s, a])
    setBusqueda('')
  }

  const quitarAsignatura = (a) => {
    setSeleccionadas((s) => s.filter((x) => x !== a))
    setGruposExcluidos((prev) => {
      const next = { ...prev }
      delete next[a]
      return next
    })
  }

  const anadirGrupoExcluido = (asignatura, grup) => {
    const valor = grup.trim()
    if (!valor) return
    setGruposExcluidos((prev) => {
      const actuales = prev[asignatura] ?? []
      if (actuales.includes(valor)) return prev
      return { ...prev, [asignatura]: [...actuales, valor] }
    })
  }

  const quitarGrupoExcluido = (asignatura, grup) => {
    setGruposExcluidos((prev) => ({
      ...prev,
      [asignatura]: (prev[asignatura] ?? []).filter((g) => g !== grup),
    }))
  }

  const alternarCelda = (dia, hora) => {
    const clave = claveCelda(dia, hora)
    setCeldas((prev) => {
      const next = new Set(prev)
      if (next.has(clave)) next.delete(clave)
      else next.add(clave)
      return next
    })
  }

  const seleccionarTodo = () => {
    const todas = new Set()
    for (const dia of DIAS) for (const hora of HORAS) todas.add(claveCelda(dia, hora))
    setCeldas(todas)
  }

  const deseleccionarTodo = () => setCeldas(new Set())

  // "Calcular": limpia el horario y lo rellena con lo que devuelva la lógica.
  const calcular = async () => {
    if (!quadri) return

    const celdasTuplas = [...celdas].map((c) => {
      const [dia, hora] = c.split('|')
      return [dia, Number(hora)]
    })
    const resultado = await calcularHorario(
      quadri,
      seleccionadas,
      celdasTuplas,
      gruposExcluidos,
      permitirSolapamientosEntreAsignaturas,
    )
    setHorario(resultado)
  }

  return (
    <div className="app body-page">
      <div className="topbar">
        <div className="topbar__inner">
        </div>
      </div>

      <div className="breadcrumb-content-inner">
        <div className="breadcrumb-content-main gva-block-breadcrumb">
          <h1 className="page-title">Optimizador de horarios</h1>
          <p className="intro__text">
            Herramienta para explorar combinaciones de grupos y subgrupos de las asignaturas
            de la FIB. Busca las asignaturas que quieres cursar, indica las franjas en las que
            puedes asistir a clase (clic en la rejilla) y pulsa <strong>Calcular</strong>.
            Se mostrarán todos los horarios compatibles: cada grupo principal (10, 20…) necesita
            al menos un subgrupo válido de la misma familia, puedes excluir grupos concretos por
            asignatura y el orden en que añades las asignaturas marca la prioridad ante
            solapamientos.
          </p>
          <br />
          <p className="intro__text">
            NOTA: Esta herramienta es una herramienta de ayuda para los estudiantes de la FIB hecha 
            por un estudiante de la FIB. No es una herramienta oficial de la FIB.
          </p>
        </div>
      </div>

      <main className="app__main">
        <div className="caixa_sombra">
          <Controles
          busqueda={busqueda}
          onBusqueda={setBusqueda}
          resultados={resultados}
          seleccionadas={seleccionadas}
          gruposExcluidos={gruposExcluidos}
          onAnadir={anadirAsignatura}
          onQuitar={quitarAsignatura}
          onAnadirGrupoExcluido={anadirGrupoExcluido}
          onQuitarGrupoExcluido={quitarGrupoExcluido}
          permitirSolapamientosEntreAsignaturas={permitirSolapamientosEntreAsignaturas}
          onPermitirSolapamientosEntreAsignaturas={setPermitirSolapamientosEntreAsignaturas}
          onSeleccionarTodo={seleccionarTodo}
          onDeseleccionarTodo={deseleccionarTodo}
          onCalcular={calcular}
          />
        </div>

        <Horario
          dias={DIAS}
          horas={HORAS}
          celdas={celdas}
          horario={horario}
          claveCelda={claveCelda}
          onAlternarCelda={alternarCelda}
        />
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <p className="site-footer__aviso">
            Recuerda consultar las horas de los exámenes en la web de la FIB oficial ya que aquí
            no se tienen en cuenta.
          </p>
        </div>
      </footer>
    </div>
  )
}
