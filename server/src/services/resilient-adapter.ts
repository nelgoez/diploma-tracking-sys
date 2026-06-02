export interface RetryOptions {
  maxRetries?: number
  backoffMs?: number[]
  timeoutMs?: number
  retryOnStatus?: number[]
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalTimeMs: number
}

const DEFAULT_MAX_RETRIES = 3
const DEFAULT_BACKOFF = [1000, 4000, 9000]
const DEFAULT_TIMEOUT = 10000
const DEFAULT_RETRY_STATUS = [429, 500, 502, 503, 504]

function isRetryableError(error: Error & { statusCode?: number }, retryOnStatus: number[]): boolean {
  if (typeof error.statusCode === 'number') {
    return retryOnStatus.includes(error.statusCode)
  }
  return true
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`)
    this.name = 'TimeoutError'
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES
  const backoffMs = options.backoffMs ?? DEFAULT_BACKOFF
  const retryOnStatus = options.retryOnStatus ?? DEFAULT_RETRY_STATUS

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      const typedError = lastError as Error & { statusCode?: number }

      if (attempt === maxRetries) {
        throw lastError
      }

      if (!isRetryableError(typedError, retryOnStatus)) {
        throw lastError
      }

      const waitMs = backoffMs[attempt] ?? backoffMs[backoffMs.length - 1]
      await delay(waitMs)
    }
  }

  throw lastError ?? new Error('Retry exhausted with no error')
}

export async function withRetryBatch<T, R>(
  items: T[],
  fn: (item: T) => Promise<R>,
  options: RetryOptions = {},
): Promise<RetryResult<R>[]> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES
  const backoffMs = options.backoffMs ?? DEFAULT_BACKOFF
  const retryOnStatus = options.retryOnStatus ?? DEFAULT_RETRY_STATUS

  const results: RetryResult<R>[] = await Promise.all(
    items.map(async (item): Promise<RetryResult<R>> => {
      const startTime = Date.now()
      let lastError: Error | undefined
      let attempts = 0

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const data = await fn(item)
          return {
            success: true,
            data,
            attempts: attempt + 1,
            totalTimeMs: Date.now() - startTime,
          }
        } catch (err) {
          attempts = attempt + 1
          lastError = err instanceof Error ? err : new Error(String(err))
          const typedError = lastError as Error & { statusCode?: number }

          if (attempt === maxRetries) {
            return {
              success: false,
              error: lastError,
              attempts,
              totalTimeMs: Date.now() - startTime,
            }
          }

          if (!isRetryableError(typedError, retryOnStatus)) {
            return {
              success: false,
              error: lastError,
              attempts,
              totalTimeMs: Date.now() - startTime,
            }
          }

          const waitMs = backoffMs[attempt] ?? backoffMs[backoffMs.length - 1]
          await delay(waitMs)
        }
      }

      return {
        success: false,
        error: lastError ?? new Error('Retry exhausted with no error'),
        attempts,
        totalTimeMs: Date.now() - startTime,
      }
    }),
  )

  return results
}

export function withTimeout<T>(fn: () => Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError(ms))
    }, ms)

    fn()
      .then((result) => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}
