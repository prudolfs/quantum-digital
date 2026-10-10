import { spawnSync } from 'node:child_process'
import { unstable_readConfig } from 'wrangler'
import { releasePublicEnvironment } from '../../src/lib/release-build-env.ts'

const configured = unstable_readConfig({ config: 'wrangler.jsonc' })
const publicSettings = releasePublicEnvironment(configured.vars, process.env)
const environment = { ...process.env, ...publicSettings }
delete environment.CLOUDFLARE_ENV
console.log(
  'Building release for',
  new URL(publicSettings.VITE_SITE_URL).origin,
  'using approved Wrangler/CI public settings.',
)
const result = process.env.npm_execpath
  ? spawnSync(process.execPath, [process.env.npm_execpath, 'run', 'build'], {
      env: environment,
      stdio: 'inherit',
    })
  : spawnSync('pnpm', ['run', 'build'], { env: environment, stdio: 'inherit' })
if (result.error) throw result.error
process.exitCode = result.status ?? 1
