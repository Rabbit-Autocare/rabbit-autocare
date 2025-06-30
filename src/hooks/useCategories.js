import { useState, useEffect, useCallback } from 'react'
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry'
import { CategoryService } from '@/lib/service/microdataService'

// Global cache for categories
let categoriesCache = null
let categoriesPromise = null
let lastFetchTime = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useCategories(initialCategories = null, initialError = null) {
  const [categories, setCategories] = useState(initialCategories || categoriesCache || [])
  const [loading, setLoading] = useState(!initialCategories && !categoriesCache)
  const [error, setError] = useState(initialError)

  const fetchCategories = useCallback(async () => {
    // If we have initial data, use it and don't fetch immediately
    if (initialCategories && !categoriesCache) {
      categoriesCache = initialCategories
      lastFetchTime = Date.now()
      setCategories(initialCategories)
      setLoading(false)
      return
    }

    // Return cached data if still valid
    if (categoriesCache && (Date.now() - lastFetchTime) < CACHE_DURATION) {
      setCategories(categoriesCache)
      setLoading(false)
      return
    }

    // If there's already a fetch in progress, wait for it
    if (categoriesPromise) {
      try {
        const result = await categoriesPromise
        setCategories(result)
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
      return
    }

    // Start new fetch
    setLoading(true)
    setError(null)

    try {
      categoriesPromise = fetchWithRetry(() => CategoryService.getCategories())
      const result = await categoriesPromise

      if (result && result.success && result.data && Array.isArray(result.data)) {
        categoriesCache = result.data
        lastFetchTime = Date.now()
        setCategories(result.data)
      } else {
        throw new Error('Invalid categories data')
      }
    } catch (err) {
      console.error('[useCategories] Error fetching categories:', err)
      setError(err.message)

      // Use fallback categories if cache is empty
      if (!categoriesCache) {
        const fallbackCategories = [
          { id: 1, name: "Interior", is_microfiber: false },
          { id: 2, name: "Exterior", is_microfiber: false },
          { id: 3, name: "Fiber Cloth", is_microfiber: true },
          { id: 4, name: "Kits & Combos", is_microfiber: false },
        ]
        setCategories(fallbackCategories)
      }
    } finally {
      categoriesPromise = null
      setLoading(false)
    }
  }, [initialCategories])

  useEffect(() => {
    // Only fetch if we don't have initial data
    if (!initialCategories) {
      fetchCategories()
    }
  }, [fetchCategories, initialCategories])

  const refreshCategories = async () => {
    // Clear cache and refetch
    categoriesCache = null
    categoriesPromise = null
    lastFetchTime = 0
    setLoading(true)
    setError(null)

    try {
      const result = await CategoryService.getCategories()
      if (result && result.success && result.data && Array.isArray(result.data)) {
        categoriesCache = result.data
        lastFetchTime = Date.now()
        setCategories(result.data)
      } else {
        throw new Error('Invalid categories data')
      }
    } catch (err) {
      console.error('[useCategories] Error refreshing categories:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    categories,
    loading,
    error,
    refreshCategories,
    retry: fetchCategories
  }
}