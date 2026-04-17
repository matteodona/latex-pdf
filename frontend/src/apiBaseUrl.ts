function fromWindowLocation(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:3001'
  }

  const { protocol, hostname, port } = window.location
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1'
  const isViteDevPort = port === '5173' || port === '5174'

  // In sviluppo Vite gira tipicamente su 5173/5174 mentre il backend su 3001.
  // Usiamo anche hostname non-localhost (es. IP LAN) per non rompere accesso da altri device.
  if (isViteDevPort) {
    return `${protocol}//${hostname}:3001`
  }

  if (isLocalHost) {
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`
  }

  // In produzione assumiamo reverse proxy/API sullo stesso origin.
  return `${protocol}//${hostname}${port ? `:${port}` : ''}`
}

export const API_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL?.trim() || fromWindowLocation()
).replace(/\/+$/, '')
