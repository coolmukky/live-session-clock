import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works on GitHub Pages (project sites) as well as
// any other static host without further configuration.
export default defineConfig({
  base: './',
  plugins: [react()],
});
