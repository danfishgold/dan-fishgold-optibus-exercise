import { act, renderHook } from '@testing-library/react'
import { useSet } from './useSet'

describe('useSet', () => {
  describe('Initialization', () => {
    test('Initializing with an empty array results in an empty set', () => {
      const { result } = renderHook(() => useSet([]))
      expect(result.current.asArray()).toHaveLength(0)
    })

    test('Initializing with duplicate items dedupes them', () => {
      const { result } = renderHook(() => useSet([1, 2, 3, 3, 3, 3, 3, 3]))
      expect(result.current.asArray().sort()).toEqual([1, 2, 3])
    })
  })

  describe('Checking for membership', () => {
    test('set.has indicates whether an item is in the set', () => {
      const { result } = renderHook(() => useSet([1, 2, 3]))

      expect(result.current.has(2)).toBe(true)
      expect(result.current.has(5)).toBe(false)
    })
  })

  describe('Adding items', () => {
    test('Adding an existing item does nothing', () => {
      const { result } = renderHook(() => useSet([1, 2, 3]))
      act(() => result.current.add(3))
      expect(result.current.asArray()).toHaveLength(3)
    })

    test('Adding a new item adds it to the set', () => {
      const { result } = renderHook(() => useSet([1, 2, 3]))
      act(() => result.current.add(4))
      expect(result.current.asArray()).toHaveLength(4)
    })
  })

  describe('Removing items', () => {
    test('Removing a nonesisting item does nothing', () => {
      const { result } = renderHook(() => useSet([1, 2, 3]))
      expect(result.current.asArray()).toHaveLength(3)
      act(() => result.current.delete(5))
      expect(result.current.asArray()).toHaveLength(3)
    })
  })
})
