import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { builtinModules } from 'module'

// Node built-in modules that should never be bundled
const nodeExternals = [
  'electron',
  ...builtinModules,
  ...builtinModules.map(m => `node:${m}`),
]

// Plugin to remove crossorigin attributes from HTML
// (file:// protocol doesn't support CORS, so crossorigin breaks asset loading)
function removeCrossorigin(): Plugin {
  return {
    name: 'remove-crossorigin',
    enforce: 'post',
    transformIndexHtml(html) {
      return html.replace(/ crossorigin/g, '')
    },
  }
}

// https://vite.dev/config/
export default defineConfig(() => {
  const isElectron = process.env.ELECTRON === 'true'

  return {
    base: isElectron ? './' : '/',
    plugins: [
      react(),
      // Remove crossorigin attributes for Electron builds
      ...(isElectron ? [removeCrossorigin()] : []),
      // Only add electron plugins when building for electron
      ...(isElectron ? [
        electron([
          {
            entry: 'electron/main.ts',
            vite: {
              build: {
                outDir: 'dist-electron',
                rollupOptions: {
                  external: nodeExternals,
                },
              },
            },
          },
          {
            entry: 'electron/preload.ts',
            vite: {
              build: {
                outDir: 'dist-electron',
                rollupOptions: {
                  external: nodeExternals,
                },
              },
            },
            onstart(args) {
              args.reload()
            },
          },
        ]),
        renderer(),
      ] : []),
    ],
    build: {
      // Don't empty outDir for electron build
      emptyOutDir: !isElectron,
    },
  }
})
