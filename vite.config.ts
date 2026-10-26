import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    // TanStack Start 1.0 (Vite plugin). No Nitro here on purpose: the
    // default srvx server runtime is what Railway's builder picks for a
    // plain Vite build, and it avoids pinning Nitro's 3.0 beta.
    // See README "Why no Nitro?" and AGENTS.md.
    tanstackStart(),
    viteReact(),
  ],
})
