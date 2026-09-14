import { useEffect, useState } from 'react'
import { api } from './api.js'

/**
 * Load an API endpoint and re-load when `key` changes. Returns { data, error, loading }.
 * Pass `null` as the endpoint to skip loading.
 */
export function useApi(endpoint, options, key) {
  const [state, setState] = useState({ data: null, error: null, loading: endpoint !== null })

  useEffect(() => {
    if (endpoint === null) {
      setState({ data: null, error: null, loading: false })
      return
    }
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))

    api(endpoint, options)
      .then((data) => !cancelled && setState({ data, error: null, loading: false }))
      .catch((error) => !cancelled && setState({ data: null, error, loading: false }))

    return () => {
      cancelled = true
    }
    // `key` stands in for `options`, which is a new object on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, key])

  return state
}
