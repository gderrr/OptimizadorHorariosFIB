# Optimizador de Horarios FIB

SPA en React (Vite) para explorar combinaciones de grupos y subgrupos de las
asignaturas de la **FIB · UPC**. Consulta la API oficial de horarios, permite
marcar franjas disponibles, excluir grupos concretos y calcular horarios
compatibles. Pensada para desplegarse en **GitHub Pages**, con estilo visual
inspirado en El Racó de la FIB.

> **Aviso:** herramienta no oficial, hecha por un estudiante para ayudar a otros
> estudiantes. No incluye horarios de exámenes; conviene contrastar el resultado
> con la web de la FIB.

## Qué hace

1. Carga el cuatrimestre actual y la lista de asignaturas desde la API de la FIB.
2. Permite buscar y seleccionar asignaturas, excluir grupos/subgrupos y marcar
   las franjas horarias disponibles en una rejilla semanal.
3. Al pulsar **Calcular**, muestra todos los horarios compatibles respetando el
   orden de prioridad entre asignaturas y la opción de permitir o no solapamientos.

## Arquitectura: layout desacoplado de la lógica

La interfaz y la lógica de negocio se comunican de forma puramente funcional a
través de tres funciones exportadas en `src/logic/horarios.js`:

| Función | Cuándo se llama | Devuelve |
| --- | --- | --- |
| `obtenerQuadriMasReciente()` | Al cargar la página | `Quadri` con el cuatrimestre más reciente |
| `obtenerListaAsignaturas(quadri)` | Tras conocer el cuatrimestre | `Asignatura[]` para la búsqueda parcial |
| `calcularHorario(quadri, asignaturas, celdasSeleccionadas, exclusionesPorAsignatura, permitirSolapamientosEntreAsignaturas)` | Al pulsar **Calcular** | `BloqueHorario[]` a pintar en el horario |

Tipos del contrato (ver JSDoc en `src/logic/horarios.js`):

- `Celda` = `[dia: string, hora: number]` — hora = inicio del bloque (`8` ⇒ `8-9h`).
- `BloqueHorario` = `[asignatura, grupo, dia, hora]`.

## Estructura

```
src/
├─ logic/horarios.js        ← lógica de negocio y llamadas a la API FIB
├─ hooks/useTheme.js        ← tema claro/oscuro (localStorage)
├─ lib/colores.js           ← colores estables por asignatura
├─ components/
│  ├─ Controles.jsx         ← buscador, asignaturas, opciones, "Calcular"
│  └─ Horario.jsx           ← rejilla del horario semanal
├─ styles/
│  ├─ fib-raco.css          ← tokens y componentes estilo FIB / El Racó
│  └─ theme.css             ← variables de color por tema
├─ App.jsx                  ← orquesta el estado y llama a las 3 funciones
├─ App.css                  ← layout de la aplicación
└─ index.css                ← estilos base
```

## Configuración

La API de la FIB requiere un identificador de cliente. Crear un archivo `.env` en
la raíz del proyecto:

```env
VITE_CLIENT_ID=tu_client_id
```

Vite solo expone variables con prefijo `VITE_`. El archivo `.env` está en
`.gitignore` y no se sube al repositorio.

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm run build    # build de producción en dist/
npm run preview  # previsualizar el build
```

## Despliegue en GitHub Pages

1. Si el nombre del repositorio difiere de `OptimizadorHorariosFIB`, actualizar
   `base` en `vite.config.js` y `homepage` en `package.json`.
2. Configurar `VITE_CLIENT_ID` como secret del repositorio si el build en CI
   necesita acceder a la API.
3. Despliegue manual con la rama `gh-pages`:

   ```bash
   npm run deploy
   ```

   O bien usar el workflow de GitHub Actions en `.github/workflows/deploy.yml`,
   que se ejecuta al hacer push a `main`.
