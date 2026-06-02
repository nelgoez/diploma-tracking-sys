import { describe, test, expect } from 'bun:test'
import { withRetry, withRetryBatch, withTimeout, TimeoutError } from '../src/services/resilient-adapter'

function createHttpError(statusCode: number, message?: string): Error & { statusCode: number } {
  const err = new Error(message ?? `HTTP ${statusCode}`) as Error & { statusCode: number }
  err.statusCode = statusCode
  return err
}

describe('withRetry', () => {
  test('success on first attempt (attempts=1)', async () => {
    let callCount = 0
    const fn = async () => {
      callCount++
      return 'ok'
    }

    const result = await withRetry(fn)
    expect(result).toBe('ok')
    expect(callCount).toBe(1)
  })

  test('success on 2nd attempt (1 failure before success)', async () => {
    let callCount = 0
    const fn = async () => {
      callCount++
      if (callCount === 1) throw new Error('temporary failure')
      return 'ok'
    }

    const result = await withRetry(fn, { backoffMs: [1] })
    expect(result).toBe('ok')
    expect(callCount).toBe(2)
  })

  test('success on 3rd attempt (2 failures before success)', async () => {
    let callCount = 0
    const fn = async () => {
      callCount++
      if (callCount <= 2) throw new Error('temporary failure')
      return 'ok'
    }

    const result = await withRetry(fn, { backoffMs: [1, 1] })
    expect(result).toBe('ok')
    expect(callCount).toBe(3)
  })

  test('all retries exhausted → throws', async () => {
    let callCount = 0
    const fn = async () => {
      callCount++
      throw new Error('persistent failure')
    }

    try {
      await withRetry(fn, { maxRetries: 2, backoffMs: [1, 1] })
      expect.unreachable('should have thrown')
    } catch (err) {
      expect((err as Error).message).toBe('persistent failure')
      expect(callCount).toBe(3) // initial + 2 retries
    }
  })

  test('500 error → retried', async () => {
    let callCount = 0
    const fn = async () => {
      callCount++
      if (callCount === 1) throw createHttpError(500)
      return 'ok'
    }

    const result = await withRetry(fn, { backoffMs: [1] })
    expect(result).toBe('ok')
    expect(callCount).toBe(2)
  })

  test('502 error → retried', async () => {
    let callCount = 0
    const fn = async () => {
      callCount++
      if (callCount === 1) throw createHttpError(502)
      return 'ok'
    }

    const result = await withRetry(fn, { backoffMs: [1] })
    expect(result).toBe('ok')
    expect(callCount).toBe(2)
  })

  test('503 error → retried', async () => {
    let callCount = 0
    const fn = async () => {
      callCount++
      if (callCount === 1) throw createHttpError(503)
      return 'ok'
    }

    const result = await withRetry(fn, { backoffMs: [1] })
    expect(result).toBe('ok')
    expect(callCount).toBe(2)
  })

  test('504 error → retried', async () => {
    let callCount = 0
    const fn = async () => {
      callCount++
      if (callCount === 1) throw createHttpError(504)
      return 'ok'
    }

    const result = await withRetry(fn, { backoffMs: [1] })
    expect(result).toBe('ok')
    expect(callCount).toBe(2)
  })

  test('429 rate limit → retried', async () => {
    let callCount = 0
    const fn = async () => {
      callCount++
      if (callCount === 1) throw createHttpError(429)
      return 'ok'
    }

    const result = await withRetry(fn, { backoffMs: [1] })
    expect(result).toBe('ok')
    expect(callCount).toBe(2)
  })

  test('400 bad request → NOT retried (throws immediately)', async () => {
    let callCount = 0
    const fn = async () => {
      callCount++
      throw createHttpError(400)
    }

    try {
      await withRetry(fn, { maxRetries: 2, backoffMs: [1, 1] })
      expect.unreachable('should have thrown immediately')
    } catch (err) {
      expect((err as Error & { statusCode: number }).statusCode).toBe(400)
      expect(callCount).toBe(1)
    }
  })

  test('401 unauthorized → NOT retried', async () => {
    let callCount = 0
    const fn = async () => {
      callCount++
      throw createHttpError(401)
    }

    try {
      await withRetry(fn, { maxRetries: 2, backoffMs: [1, 1] })
      expect.unreachable('should have thrown immediately')
    } catch (err) {
      expect((err as Error & { statusCode: number }).statusCode).toBe(401)
      expect(callCount).toBe(1)
    }
  })

  test('Network error (TypeError/ECONNREFUSED) → retried', async () => {
    let callCount = 0
    const fn = async () => {
      callCount++
      if (callCount === 1) throw new TypeError('fetch failed')
      return 'ok'
    }

    const result = await withRetry(fn, { backoffMs: [1] })
    expect(result).toBe('ok')
    expect(callCount).toBe(2)
  })

  test('Timeout exceeded → retried', async () => {
    let callCount = 0
    const fn = async () => {
      callCount++
      if (callCount === 1) {
        // Simulate a timeout-like error without a statusCode
        throw new Error('Operation timed out')
      }
      return 'ok'
    }

    const result = await withRetry(fn, { backoffMs: [1] })
    expect(result).toBe('ok')
    expect(callCount).toBe(2)
  })
})

describe('withRetryBatch', () => {
  test('Per-student isolation in batch (1 fails but others succeed in batch of 3)', async () => {
    const items = ['a', 'b', 'c']

    const fn = async (item: string) => {
      if (item === 'b') throw createHttpError(500, 'server error') // b always fails, retryable
      return `result-${item}`
    }

    const results = await withRetryBatch(items, fn, { maxRetries: 1, backoffMs: [1] })

    expect(results).toHaveLength(3)

    const a = results.find((r) => r.data === 'result-a')
    expect(a?.success).toBe(true)
    expect(a?.attempts).toBe(1)

    const b = results.find((r) => r.error?.message === 'server error')
    expect(b?.success).toBe(false)
    expect(b?.attempts).toBe(2) // initial + 1 retry

    const c = results.find((r) => r.data === 'result-c')
    expect(c?.success).toBe(true)
    expect(c?.attempts).toBe(1)
  })
})

describe('withTimeout', () => {
  test('resolves before timeout', async () => {
    const result = await withTimeout(async () => 'done', 5000)
    expect(result).toBe('done')
  })

  test('rejects with TimeoutError when exceeded', async () => {
    try {
      await withTimeout(
        async () => {
          await new Promise((r) => setTimeout(r, 100))
        },
        1,
      )
      expect.unreachable('should have thrown TimeoutError')
    } catch (err) {
      expect(err).toBeInstanceOf(TimeoutError)
      expect((err as TimeoutError).message).toContain('1ms')
    }
  })
})
