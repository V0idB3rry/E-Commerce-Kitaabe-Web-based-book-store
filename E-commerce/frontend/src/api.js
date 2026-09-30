/* global __SERVER_ROOT__ */

// Talks to the PHP API in E-commerce/api. Every call sends the session cookie.

export class ApiError extends Error {
  constructor(message, status, fields = {}) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

export async function api(endpoint, { method = 'GET', params, body } = {}) {
  const url = new URL(`${__SERVER_ROOT__}/api/${endpoint}`, window.location.origin)

  for (const [key, value] of Object.entries(params ?? {})) {
    if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(`${key}[]`, v))
    else if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value)
  }

  // FormData (file uploads) is sent as multipart; the browser sets its own Content-Type
  const isForm = body instanceof FormData

  let response
  try {
    response = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Can’t reach the server. Is Apache running in XAMPP?', 0)
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new ApiError(data.error ?? `Request failed (${response.status})`, response.status, data.fields)
  }
  return data
}

export function coverUrl(image) {
  return `${__SERVER_ROOT__}/uploads/books/${encodeURIComponent(image)}`
}

export function rupees(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

/** "2026-09-14 11:20:05" (MySQL) → Date */
export function parseDate(value) {
  return new Date(String(value).replace(' ', 'T'))
}

export function formatDate(value, withTime = false) {
  return parseDate(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : { year: 'numeric' }),
  })
}

export function percentOff(price, mrp) {
  return mrp ? Math.round((1 - price / mrp) * 100) : 0
}

export const CONDITIONS = {
  'Like New': { className: 'b-new', text: 'Looks unread. Tight spine, crisp pages, no names or markings.' },
  Good: { className: 'b-good', text: 'Read with care. Light cover wear or a creased spine; pages clean.' },
  Fair: { className: 'b-fair', text: 'Well loved. Visible wear and maybe a name inside, but every page intact.' },
}
