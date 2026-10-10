import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { unstable_readConfig } from 'wrangler'
import { publicBuildDefines } from './src/lib/public-build-env'

export default defineConfig(({ mode }) => ({
  define: publicBuildDefines(
    unstable_readConfig({
      config: 'wrangler.jsonc',
      env: process.env.CLOUDFLARE_ENV,
    }).vars,
    loadEnv(mode, process.cwd(), 'VITE_'),
  ),
  server: { port: 3000, strictPort: true },
  resolve: { tsconfigPaths: true },
  ssr: { noExternal: ['@convex-dev/better-auth'] },
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart(),
    react(),
  ],
}))
