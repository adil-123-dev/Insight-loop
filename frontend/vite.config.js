import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Raise warning threshold — we're splitting manually
    chunkSizeWarningLimit: 700,
    // Use esbuild minifier (faster, lighter than terser)
    minify: 'esbuild',
    // Reduce concurrent transforms to ease memory pressure
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // MUI icons — largest chunk, isolate first
          if (id.includes('@mui/icons-material')) return 'vendor-mui-icons';
          // Recharts + d3 deps
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-')) return 'vendor-charts';
          // MUI core system
          if (id.includes('@mui/material') || id.includes('@mui/system') || id.includes('@mui/utils')) return 'vendor-mui';
          // Emotion (MUI styling engine)
          if (id.includes('@emotion')) return 'vendor-emotion';
          // React + Router
          if (id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
          if (id.includes('node_modules/react/')) return 'vendor-react';
          // Axios
          if (id.includes('axios')) return 'vendor-axios';
          // Everything else in node_modules → vendor-misc
          if (id.includes('node_modules')) return 'vendor-misc';
        },
      },
    },
  },
})
