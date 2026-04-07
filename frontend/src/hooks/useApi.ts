import { useState, useEffect } from 'react'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: unknown[] = []
): UseApiState<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        const result = await apiCall()
        if (isMounted) {
          setState({ data: result, loading: false, error: null })
        }
      } catch (error) {
        if (isMounted) {
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : 'An error occurred',
          })
        }
      }
    }

    fetchData()

    return () => {
      isMounted = false
    }
  }, dependencies)

  return state
}
