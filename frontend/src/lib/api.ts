type ApiOptions = RequestInit & { baseUrl?: string }

const defaultBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

export async function apiClient(path: string, options: ApiOptions = {}) {
  const method = (options.method ?? 'GET').toUpperCase()
  const mergedHeaders = new Headers(options.headers ?? {})

  if (options.body && !mergedHeaders.has('Content-Type')) {
    mergedHeaders.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${options.baseUrl ?? defaultBaseUrl}${path}`, {
    ...options,
    method,
    headers: mergedHeaders,
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json()
}
