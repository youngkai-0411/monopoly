import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: { groups: [
          { name: 'three-core', test: /three\.core\.js$/ },
          { name: 'three-renderer', test: /three\.module\.js$/ },
        ] },
      },
      onwarn(warning, handler) {
        // This is a client-only app. Framer Motion's server/client boundary
        // annotations have no meaning here; keep every other warning visible.
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client') && warning.id?.includes('framer-motion')) return;
        handler(warning);
      },
    },
  },
});
