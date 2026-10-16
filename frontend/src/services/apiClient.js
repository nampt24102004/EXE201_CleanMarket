let csrfToken = null
export const AUTH_DENIED_EVENT = 'cleanmarket:auth-denied'

export class ApiError extends Error {
  constructor(message, status, code, errors = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.errors = errors
  }
}

async function readPayload(response) {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) return null
  return response.json()
}

async function loadCsrfToken() {
  const response = await fetch('/api/auth/csrf', { credentials: 'include' })
  const payload = await readPayload(response)
  if (!response.ok || !payload?.data?.token) throw new ApiError('Không thể khởi tạo phiên bảo mật.', response.status, 'CSRF_ERROR')
  csrfToken = payload.data.token
  return csrfToken
}

export function resetCsrfToken() {
  csrfToken = null
}

export async function apiRequest(path, options = {}, retryCsrf = true) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = new Headers(options.headers || {})
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(method)
  if (options.body !== undefined && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (unsafe) headers.set('X-CSRF-TOKEN', csrfToken || await loadCsrfToken())

  const response = await fetch(path, {
    ...options,
    method,
    headers,
    credentials: 'include',
    body: options.body === undefined || options.body instanceof FormData ? options.body : JSON.stringify(options.body),
  })
  const payload = await readPayload(response)
  if (unsafe && retryCsrf && response.status === 403 && payload?.code === 'CSRF_INVALID') {
    resetCsrfToken()
    return apiRequest(path, options, false)
  }
  // 401/403 often means the session changed underneath this tab (logout or another account in another tab).
  // Let AuthProvider re-check who is logged in; /me itself is excluded so the check cannot loop.
  if ((response.status === 401 || response.status === 403) && path !== '/api/auth/me' && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_DENIED_EVENT))
  }
  if (!response.ok || payload?.success === false) {
    // 502/503/504 without a JSON body come from the dev proxy or gateway: the backend is down or restarting.
    if (!payload && [502, 503, 504].includes(response.status)) {
      throw new ApiError('Không kết nối được máy chủ, vui lòng thử lại sau ít phút.', response.status, 'SERVER_UNAVAILABLE')
    }
    throw new ApiError(payload?.message || `Yêu cầu thất bại (${response.status}).`, response.status, payload?.code, payload?.errors || [])
  }
  return payload?.data ?? null
}

export const api = {
  get: (path) => apiRequest(path),
  post: (path, body) => apiRequest(path, { method: 'POST', body }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body }),
  delete: (path) => apiRequest(path, { method: 'DELETE' }),
}
