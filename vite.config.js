import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** GitHub Project Pages live at https://maunishs.github.io/rbe-absolute/ — production build needs this base. */
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/rbe-absolute/' : '/',
}));
