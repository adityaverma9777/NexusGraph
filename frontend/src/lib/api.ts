type ApiOptions = RequestInit & { baseUrl?: string }

const defaultBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

export async function apiClient(path: string, options: ApiOptions = {}) {
  const response = await fetch(`${options.baseUrl ?? defaultBaseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  return response.json()
}
