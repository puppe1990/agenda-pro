import { addMinutes, format, parseISO } from 'date-fns'

import { hasAppointmentOverlap } from '#/server/services/appointments'

export type AvailabilityRule = {
  dayOfWeek: number
  startTime: string
  endTime: string
}

export function parseTimeOnDate(date: string, time: string) {
  return parseISO(`${date}T${time}:00`)
}

export function generateSlots(input: {
  date: string
  durationMinutes: number
  rules: AvailabilityRule[]
  bookedRanges: Array<{ startsAt: string; endsAt: string }>
}) {
  const dateObj = parseISO(`${input.date}T12:00:00`)
  const dayOfWeek = dateObj.getDay()
  const dayRules = input.rules.filter((rule) => rule.dayOfWeek === dayOfWeek)
  const slots: string[] = []

  for (const rule of dayRules) {
    let cursor = parseTimeOnDate(input.date, rule.startTime)
    const end = parseTimeOnDate(input.date, rule.endTime)

    while (addMinutes(cursor, input.durationMinutes) <= end) {
      const slotStart = cursor.toISOString()
      const slotEnd = addMinutes(cursor, input.durationMinutes).toISOString()
      const overlaps = input.bookedRanges.some(
        (booked) => booked.startsAt < slotEnd && booked.endsAt > slotStart,
      )

      if (!overlaps) {
        slots.push(format(cursor, 'HH:mm'))
      }

      cursor = addMinutes(cursor, input.durationMinutes)
    }
  }

  return slots
}

export async function isSlotAvailable(input: {
  organizationId: string
  staffProfileId: string
  startsAt: string
  endsAt: string
}) {
  return !(await hasAppointmentOverlap(input))
}
