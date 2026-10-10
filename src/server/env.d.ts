declare module 'cloudflare:workers' {
  export const env: {
    INTAKE_BRIDGE_SECRET?: string
    AI_GATEWAY_API_KEY?: string
    AI_MODEL?: string
  }
}
