import { useCallback, useState } from 'react'

export function useSet<T>(initialMembers: Iterable<T>): {
  has: (member: T) => boolean
  add: (member: T) => void
  delete: (member: T) => void
  asArray: () => T[]
} {
  const [set, setSet] = useState(new Set(initialMembers))

  const has = useCallback((member: T) => set.has(member), [set])
  const add = useCallback(
    (member: T) =>
      setSet((set) => {
        if (set.has(member)) {
          return set
        }
        const newSet = new Set(set)
        newSet.add(member)
        return newSet
      }),
    [],
  )

  const deleteMember = useCallback(
    (member: T) =>
      setSet((set) => {
        if (!set.has(member)) {
          return set
        }
        const newSet = new Set(set)
        newSet.delete(member)
        return newSet
      }),
    [],
  )

  return { has, add, delete: deleteMember, asArray: () => Array.from(set) }
}
