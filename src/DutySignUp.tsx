import { partition, sortBy } from 'lodash-es'
import { useMemo, useState } from 'react'
import { DutyCard } from './DutyCard'
import { Duty, Warning, findWarning, warningText } from './utils/duties'
import { useSet } from './utils/useSet'

export function DutySignUp({ availableDuties }: { availableDuties: Duty[] }) {
  const duties = useDuties(availableDuties)
  const [isSingleColumn, setSingleColumn] = useState(false)

  return (
    <>
      <div>
        <input
          type='checkbox'
          checked={isSingleColumn}
          onChange={(event) => setSingleColumn(event.target.checked)}
          id='single-column-layout-toggle'
        />
        <label htmlFor='single-column-layout-toggle'>
          Single column layout
        </label>
      </div>
      <main className={isSingleColumn ? 'single-column' : ''}>
        <div className='duty-list-container'>
          <h2 id='available-duties-heading'>Available duties</h2>
          <ul aria-labelledby='available-duties-heading'>
            {duties.unassigned.map((duty) => (
              <DutyCard
                key={duty.id}
                duty={duty}
                onClick={() => {
                  const warning = duties.warnings.get(duty.id)
                  if (warning) {
                    alert(
                      `You can't sign up for this duty. ${warningText(
                        warning,
                      )}`,
                    )
                  } else {
                    duties.assign(duty.id)
                  }
                }}
                warning={duties.warnings.get(duty.id) ?? null}
              />
            ))}
          </ul>
        </div>
        <div className='duty-list-container'>
          <h2 id='assigned-duties-heading'>Duties you've signed up for</h2>
          <ul aria-labelledby='assigned-duties-heading'>
            {duties.assigned.map((duty) => (
              <DutyCard
                key={duty.id}
                duty={duty}
                onClick={() => duties.unassign(duty.id)}
                warning={duties.warnings.get(duty.id) ?? null}
              />
            ))}
          </ul>
        </div>
      </main>
    </>
  )
}

function useDuties(duties: Duty[]): {
  unassigned: Duty[]
  assigned: Duty[]
  warnings: Map<number, Warning | null>
  assign: (id: number) => void
  unassign: (id: number) => void
} {
  const sortedDuties = useMemo(
    () => sortBy(duties, (duty) => duty.start),
    [duties],
  )
  const assignedIds = useSet<number>([])

  const [assignedDuties, unassignedDuties] = partition(sortedDuties, (duty) =>
    assignedIds.has(duty.id),
  )

  const warnings = new Map(
    unassignedDuties.map((duty) => [
      duty.id,
      findWarning({ duty, assignedDuties }),
    ]),
  )

  return {
    unassigned: unassignedDuties,
    assigned: assignedDuties,
    warnings,
    assign: (id: number) => assignedIds.add(id),
    unassign: (id: number) => assignedIds.delete(id),
  }
}

function useDutiesButWithMemoization(duties: Duty[]): {
  unassigned: Duty[]
  assigned: Duty[]
  warnings: Map<number, Warning | null>
  assign: (id: number) => void
  unassign: (id: number) => void
} {
  const sortedDuties = useMemo(
    () => sortBy(duties, (duty) => duty.start),
    [duties],
  )

  const assignedIds = useSet<number>([])

  const [assignedDuties, unassignedDuties] = useMemo(
    () => partition(sortedDuties, (duty) => assignedIds.has(duty.id)),
    [duties, assignedIds],
  )

  const warnings = useMemo(
    () =>
      new Map(
        unassignedDuties.map((duty) => [
          duty.id,
          findWarning({ duty, assignedDuties }),
        ]),
      ),
    [unassignedDuties, assignedDuties],
  )

  return {
    unassigned: unassignedDuties,
    assigned: assignedDuties,
    warnings,
    assign: (id: number) => assignedIds.add(id),
    unassign: (id: number) => assignedIds.delete(id),
  }
}
