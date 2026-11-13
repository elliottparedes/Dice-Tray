import { useLocalStorage } from '@vueuse/core'
import type { DieSides } from '@/types'

export function useDiceStorage() {
  const diceTray = useLocalStorage<DieSides[]>('dnd.dice.tray', [])

  return {
    diceTray,
  }
}
