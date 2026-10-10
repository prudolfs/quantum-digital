declare module 'cloudflare:workers' {
  export function waitUntil(promise: Promise<unknown>): void
  export const env: {
    INTAKE_BRIDGE_SECRET?: string
    AI_GATEWAY_API_KEY?: string
    TURNSTILE_SECRET_KEY?: string
    AI_MODEL?: string
  }
}
