import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El `base` debe coincidir con el nombre del repositorio para que las rutas
// de los assets funcionen al desplegar en GitHub Pages
// (https://USUARIO.github.io/OptimizadorHorariosFIB/).
export default defineConfig({
  plugins: [react()],
  base: '/OptimizadorHorariosFIB/',
})
