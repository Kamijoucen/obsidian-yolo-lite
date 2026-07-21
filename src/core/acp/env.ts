import { shellEnv } from 'shell-env'

let cached: Promise<NodeJS.ProcessEnv> | null = null

/**
 * Resolves the user's login-shell environment exactly once, asynchronously.
 * shellEnvSync() would block the renderer main thread (it spawns the user's
 * shell synchronously) which is especially costly on the app-startup path.
 */
export function getShellEnv(): Promise<NodeJS.ProcessEnv> {
  if (!cached) {
    cached = shellEnv().catch(() => ({ ...process.env }))
  }
  return cached
}
