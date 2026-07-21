import { access, constants } from 'node:fs/promises'
import * as path from 'node:path'

import { getShellEnv } from './env'

function firstNonEmpty(
  ...values: Array<string | undefined>
): string | undefined {
  for (const value of values) {
    if (value !== undefined && value !== '') return value
  }
  return undefined
}

export async function findOnPath(
  name: string,
  env: NodeJS.ProcessEnv,
): Promise<string | null> {
  const envPath = firstNonEmpty(env.PATH, env.Path, env.path) ?? ''
  const pathDirs = envPath.split(path.delimiter).filter(Boolean)
  const isWindows = process.platform === 'win32'
  const pathext = isWindows
    ? (
        firstNonEmpty(env.PATHEXT, env.Pathext, env.pathext) ??
        '.COM;.EXE;.BAT;.CMD'
      )
        .split(';')
        .filter(Boolean)
    : ['']
  const nameExt = path.extname(name)
  const candidateNames =
    isWindows && nameExt ? [name] : pathext.map((ext) => name + ext)

  for (const dir of pathDirs) {
    for (const candidateName of candidateNames) {
      const candidate = path.join(dir, candidateName)
      try {
        await access(candidate, constants.X_OK)
        return candidate
      } catch {
        // try next candidate
      }
    }
  }
  return null
}

export async function resolveOpencodeBinary(
  configuredPath: string,
): Promise<string | null> {
  const env = await getShellEnv()
  const trimmed = configuredPath.trim()
  if (trimmed) {
    try {
      await access(trimmed, constants.X_OK)
      return trimmed
    } catch {
      return null
    }
  }
  return findOnPath('opencode', env)
}

export type SpawnedProcess = {
  pid: number | null
  stdin: NodeJS.WritableStream
  stdout: NodeJS.ReadableStream
  stderr: NodeJS.ReadableStream
  onExit: (
    callback: (code: number | null, signal: string | null) => void,
  ) => void
  kill: () => void
}

export async function spawnOpencodeAcp(params: {
  binary: string
  args: string[]
  cwd: string
}): Promise<SpawnedProcess> {
  const { default: spawn } = await import('cross-spawn')
  const env = { ...(await getShellEnv()) }
  const child = spawn(params.binary, ['acp', ...params.args], {
    cwd: params.cwd,
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
  })
  if (!child.stdin || !child.stdout || !child.stderr) {
    throw new Error('Failed to open stdio pipes for opencode acp')
  }
  return {
    pid: child.pid ?? null,
    stdin: child.stdin,
    stdout: child.stdout,
    stderr: child.stderr,
    onExit: (callback) => {
      child.on('exit', (code, signal) => callback(code, signal))
    },
    kill: () => {
      child.kill()
    },
  }
}
