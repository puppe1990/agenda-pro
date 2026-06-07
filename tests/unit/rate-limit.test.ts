import { describe, expect, it } from 'vitest'

import { isRateLimitExceeded, resolveClientIp } from '#/lib/rate-limit'

describe('rate-limit', () => {
  it('allows requests under the limit', () => {
    const now = 1_000_000
    const hits = [now - 5_000, now - 3_000]
    expect(isRateLimitExceeded(hits, 3, 60_000, now)).toBe(false)
  })

  it('blocks when limit is reached in the window', () => {
    const now = 1_000_000
    const hits = [now - 5_000, now - 3_000, now - 1_000]
    expect(isRateLimitExceeded(hits, 3, 60_000, now)).toBe(true)
  })

  it('ignores hits outside the window', () => {
    const now = 1_000_000
    const hits = [now - 120_000, now - 90_000, now - 1_000]
    expect(isRateLimitExceeded(hits, 2, 60_000, now)).toBe(false)
  })

  it('resolves client ip from forwarded headers', () => {
    const headers = new Headers({
      'x-forwarded-for': '203.0.113.1, 70.41.3.18',
    })
    expect(resolveClientIp(headers)).toBe('203.0.113.1')
  })
})
