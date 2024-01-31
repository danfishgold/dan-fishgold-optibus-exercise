import { addHours, areIntervalsOverlapping, subHours } from 'date-fns'
import rawDuties from '../data.json'

export const availableDuties = (rawDuties as ApiDuty[]).map(parseDuty)

type ApiDuty = {
  id: number
  depot: string
  name: string
  start: string
  end: string
}

export type Duty = {
  id: number
  depot: string
  name: string
  start: Date
  end: Date
}

export type Warning =
  | {
      type: 'conflict'
      name: string
    }
  | { type: 'noRestAfter'; name: string }
  | { type: 'noRestBefore'; name: string }

function parseDuty(duty: ApiDuty): Duty {
  return { ...duty, start: new Date(duty.start), end: new Date(duty.end) }
}

export function findWarning({
  duty,
  assignedDuties,
}: {
  duty: Duty
  assignedDuties: Duty[]
}): Warning | null {
  const expandedDutyInterval = {
    start: subHours(duty.start, 8),
    end: addHours(duty.end, 8),
  }

  for (const assignedDuty of assignedDuties) {
    if (!areIntervalsOverlapping(assignedDuty, expandedDutyInterval)) {
      // No intersection with this assigned duty
      continue
    }
    if (areIntervalsOverlapping(assignedDuty, duty)) {
      return { type: 'conflict', name: assignedDuty.name }
    } else if (duty.end < assignedDuty.start) {
      return { type: 'noRestAfter', name: assignedDuty.name }
    } else {
      return { type: 'noRestBefore', name: assignedDuty.name }
    }
  }
  return null
}

export function warningText(warning: Warning) {
  switch (warning.type) {
    case 'conflict':
      return `You have another duty at this time (${warning.name})`
    case 'noRestAfter':
      return `Less than 8 hours until ${warning.name}`
    case 'noRestBefore':
      return `Less than 8 hours since ${warning.name}`
  }
}
