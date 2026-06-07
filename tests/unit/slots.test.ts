import { describe, expect, it } from 'vitest'

import { generateSlots, parseTimeOnDate } from '#/server/services/slots'

describe('generateSlots', () => {
  it('returns free slots excluding booked ranges', () => {
    const date = '2026-06-09'
    const bookedStart = parseTimeOnDate(date, '09:00').toISOString()
    const bookedEnd = parseTimeOnDate(date, '09:30').toISOString()

    const slots = generateSlots({
      date,
      durationMinutes: 30,
      rules: [{ dayOfWeek: 2, startTime: '09:00', endTime: '11:00' }],
      bookedRanges: [{ startsAt: bookedStart, endsAt: bookedEnd }],
    })

    expect(slots).not.toContain('09:00')
    expect(slots.length).toBeGreaterThan(0)
  })
})
