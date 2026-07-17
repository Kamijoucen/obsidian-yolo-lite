/**
 * Shared helpers for honoring shell-supplied proxy env vars
 * (`HTTP_PROXY` / `HTTPS_PROXY` / `ALL_PROXY` / `NO_PROXY`, mixed case).
 *
 * MCP transports consume this helper through `core/mcp/desktopMcpFetch.ts`.
 * The LLM transport keeps its own request setup because the two paths have
 * different lifecycle requirements.
 */

export const PROXY_ENV_KEYS = [
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'ALL_PROXY',
  'NO_PROXY',
  'http_proxy',
  'https_proxy',
  'all_proxy',
  'no_proxy',
] as const

export type ProxyEnvKey = (typeof PROXY_ENV_KEYS)[number]

export const envHasProxy = (env: NodeJS.ProcessEnv): boolean =>
  PROXY_ENV_KEYS.some((key) => typeof env[key] === 'string' && env[key]?.trim())

/**
 * Run `cb` with `process.env` temporarily replaced by `env`. Restores
 * `process.env` afterwards.
 *
 * Callers MUST keep the callback synchronous: any `await` inside the swap
 * window leaks the substituted env to other code paths in the same Node
 * process.
 */
export const withProcessEnv = <T>(env: NodeJS.ProcessEnv, cb: () => T): T => {
  const previousEnv = process.env
  process.env = env
  try {
    return cb()
  } finally {
    process.env = previousEnv
  }
}
