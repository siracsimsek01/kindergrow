// Debounce function to limit how often a function can be called
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null
  
    return (...args: Parameters<T>) => {
      if (timeout) clearTimeout(timeout)
  
      timeout = setTimeout(() => {
        func(...args)
      }, wait)
    }
  }
  
  // Throttle function to limit the rate at which a function can fire
  export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
    let inThrottle = false
  
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => {
          inThrottle = false
        }, limit)
      }
    }
  }
  
  // Memoize function to cache expensive function calls
  export function memoize<T extends (...args: any[]) => any>(func: T): (...args: Parameters<T>) => ReturnType<T> {
    const cache = new Map<string, ReturnType<T>>()
  
    return (...args: Parameters<T>): ReturnType<T> => {
      const key = JSON.stringify(args)
  
      if (cache.has(key)) {
        return cache.get(key) as ReturnType<T>
      }
  
      const result = func(...args)
      cache.set(key, result)
      return result
    }
  }
  
  