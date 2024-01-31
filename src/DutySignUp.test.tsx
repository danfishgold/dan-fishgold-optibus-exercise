import { act, render, screen, within } from '@testing-library/react'
import { Chance } from 'chance'
import { addHours, subHours } from 'date-fns'
import { sortBy } from 'lodash-es'
import { DutySignUp } from './DutySignUp'
import { Duty } from './utils/duties'

const chance = Chance(new Date().getTime())

function renderDutySignUp(partialDuties: Partial<Duty>[]) {
  const duties = partialDuties.map(mockDuty)

  const result = render(<DutySignUp availableDuties={duties} />)
  const unassignedList = screen.getByRole('list', { name: 'Available duties' })
  const assignedList = screen.getByRole('list', {
    name: "Duties you've signed up for",
  })

  const getUnassignedDuty = (duty: Duty) =>
    within(unassignedList).getByRole('button', { name: duty.name })
  const getAssignedDuty = (duty: Duty) =>
    within(assignedList).getByRole('button', { name: duty.name })

  const getCounts = () => ({
    unassigned: within(unassignedList).queryAllByRole('listitem').length,
    assigned: within(assignedList).queryAllByRole('listitem').length,
  })

  return {
    ...result,
    sortedDuties: sortBy(duties, (duty) => duty.start),
    unassignedList,
    assignedList,
    getUnassignedDuty,
    getAssignedDuty,
    getCounts,
  }
}

function mockDuty(duty: Partial<Duty>): Duty {
  let { start, end } = duty
  if (end && !start) {
    start = subHours(end, chance.floating({ min: 3, max: 8 }))
  } else {
    start = start ?? chance.date()
    end = end ?? addHours(start, chance.floating({ min: 3, max: 8 }))
  }
  return {
    id: chance.integer({ min: 0, max: 10000 }),
    name: `Duty ${chance.integer({ min: 1, max: 10000 })}`,
    depot: chance.city(),
    start,
    end,
    ...duty,
  }
}

describe('DutySignUp', () => {
  test('Start off with all duties unassigned', () => {
    const { getCounts, sortedDuties } = renderDutySignUp([{}, {}, {}])

    expect(getCounts()).toEqual({
      unassigned: sortedDuties.length,
      assigned: 0,
    })
  })

  test('Clicking on a duty moves it to the assigned duties list', async () => {
    const { getUnassignedDuty, getAssignedDuty, getCounts, sortedDuties } =
      renderDutySignUp([{}, {}, {}])

    const duty = sortedDuties[0]
    // Assign the duty
    act(() => getUnassignedDuty(duty).click())

    expect(getAssignedDuty(duty)).toBeInTheDocument()
    expect(getCounts()).toEqual({
      unassigned: sortedDuties.length - 1,
      assigned: 1,
    })
  })

  test('Clicking on an assigned duty moves it back', () => {
    const { getUnassignedDuty, getAssignedDuty, getCounts, sortedDuties } =
      renderDutySignUp([{}, {}, {}])

    const duty = sortedDuties[0]
    // Assignt the duty
    act(() => getUnassignedDuty(duty).click())

    // Unassign it
    act(() => getAssignedDuty(duty).click())

    expect(getCounts()).toEqual({
      unassigned: sortedDuties.length,
      assigned: 0,
    })
  })

  describe('Conflicting duties', () => {
    test("The appropriate warning shows up when there's a conflicting assigned duty", () => {
      const duty = mockDuty({})
      const sameTime = mockDuty({ start: addHours(duty.start, 0.5) })
      const justBefore = mockDuty({ end: subHours(duty.start, 0.5) })
      const justAfter = mockDuty({ start: addHours(duty.end, 0.5) })
      const longAfter = mockDuty({ start: addHours(duty.end, 50) })

      const { getUnassignedDuty } = renderDutySignUp([
        duty,
        sameTime,
        justBefore,
        justAfter,
        longAfter,
      ])

      act(() => getUnassignedDuty(duty).click())
      expect(getUnassignedDuty(sameTime)).toHaveAccessibleDescription(
        new RegExp(
          `Warning: You have another duty at this time \\(${duty.name}\\)`,
          'i',
        ),
      )
      expect(getUnassignedDuty(justBefore)).toHaveAccessibleDescription(
        new RegExp(`Warning: less than 8 hours until ${duty.name}`, 'i'),
      )
      expect(getUnassignedDuty(justAfter)).toHaveAccessibleDescription(
        new RegExp(`Warning: less than 8 hours since ${duty.name}`, 'i'),
      )
      expect(getUnassignedDuty(longAfter)).not.toHaveAccessibleDescription(
        /warning/i,
      )
    })

    test('When trying to assign a conflicting duty an alert pops up', () => {
      const duty = mockDuty({})
      const sameTime = mockDuty({ start: addHours(duty.start, 0.5) })

      const { getUnassignedDuty, getCounts } = renderDutySignUp([
        duty,
        sameTime,
      ])
      const alertMock = vitest
        .spyOn(window, 'alert')
        .mockImplementation(() => {})

      act(() => getUnassignedDuty(duty).click())
      act(() => getUnassignedDuty(sameTime).click())
      expect(alertMock).toHaveBeenCalledOnce()
      expect(getCounts()).toEqual({ unassigned: 1, assigned: 1 })
    })

    test("When there's no conflict you can assign the duty", () => {
      const duty1 = mockDuty({})
      const duty2 = mockDuty({ start: addHours(duty1.end, 8.1) })

      const { getUnassignedDuty, getCounts } = renderDutySignUp([duty1, duty2])
      const alertMock = vitest
        .spyOn(window, 'alert')
        .mockImplementation(() => {})

      act(() => getUnassignedDuty(duty1).click())
      act(() => getUnassignedDuty(duty2).click())
      expect(alertMock).not.toHaveBeenCalledOnce()
      expect(getCounts()).toEqual({ unassigned: 0, assigned: 2 })
    })
  })
})
