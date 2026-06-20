// Script variables injected by the blade layout via `window.Telescope`.
// Shape comes from `Laravel\Telescope\Telescope::scriptVariables()`.

export type TelescopeScriptVariables = {
  path: string
  timezone: string
  recording: boolean
}

export type EyepieceScriptVariables = {
  appName: string | null
}

declare global {
  interface Window {
    Telescope: TelescopeScriptVariables
    Eyepiece?: EyepieceScriptVariables
  }
}

export function getTelescopePath(): string {
  return '/' + (window.Telescope?.path ?? 'telescope').replace(/^\/+|\/+$/g, '')
}

export function getAppName(): string | undefined {
  return window.Eyepiece?.appName ?? undefined
}

export function getCsrfToken(): string {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
  if (!meta) throw new Error('CSRF meta tag not found')
  return meta.content
}
