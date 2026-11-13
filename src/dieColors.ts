import type { DieSides } from '@/types'

export const DIE_COLORS: Record<DieSides, string> = {
  4: '#ff5252',
  6: '#448aff',
  8: '#ffd600',
  10: '#69f0ae',
  12: '#e040fb',
  20: '#18ffff',
  100: '#ff6e40',
}

export function dieTextColor(sides: DieSides) {
  return sides === 8 || sides === 10 || sides === 20 ? '#121418' : '#ffffff'
}