import { and, eq, gte } from 'drizzle-orm'

import { createId } from '#/lib/id'
import { db } from '#/server/db/client'
import { rateLimitHits } from '#/server/db/schema'

export function isRateLimitExceeded(
  hitTimestampsMs: number[],
  limit: number,
  windowMs: number,
  nowMs: number,
) {
  const active = hitTimestampsMs.filter((ts) => nowMs - ts < windowMs)
  return active.length >= limit
}

export function resolveClientIp(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }
  return headers.get('x-real-ip') ?? 'unknown'
}

export async function assertPublicBookingRateLimit(
  bucketKey: string,
  limit = 10,
  windowMs = 60_000,
) {
  const now = Date.now()
  const windowStart = new Date(now - windowMs).toISOString()

  const recent = await db.query.rateLimitHits.findMany({
    where: and(
      eq(rateLimitHits.bucketKey, bucketKey),
      gte(rateLimitHits.hitAt, windowStart),
    ),
  })

  const timestamps = recent.map((row) => new Date(row.hitAt).getTime())
  if (isRateLimitExceeded(timestamps, limit, windowMs, now)) {
    throw new Error('RATE_LIMITED')
  }

  await db.insert(rateLimitHits).values({
    id: createId(),
    bucketKey,
    hitAt: new Date(now).toISOString(),
  })
}
