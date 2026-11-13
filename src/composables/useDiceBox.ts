import DiceBox from '@3d-dice/dice-box'
import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { DIE_COLORS } from '@/dieColors'
import type { DieSides } from '@/types'

type DieFaceResult = {
  sides: number | string
  value: number
  qty?: number
}

type RollGroupResult = {
  qty: number
  sides: number | string
  value: number
  rolls?: DieFaceResult[]
}

function flattenResults(results: unknown): DieFaceResult[] {
  if (!Array.isArray(results) || results.length === 0) return []
  const first = results[0] as RollGroupResult
  if (first && Array.isArray(first.rolls)) {
    return results.flatMap((group) => {
      const g = group as RollGroupResult
      return (g.rolls ?? []).map((die) => ({
        sides: die.sides ?? g.sides,
        value: die.value,
        qty: 1,
      }))
    })
  }
  return (results as DieFaceResult[]).map((die) => ({
    sides: die.sides,
    value: die.value,
    qty: die.qty ?? 1,
  }))
}

function sumResults(faces: DieFaceResult[]) {
  return faces.reduce((sum, die) => sum + (Number(die.value) || 0), 0)
}

export function useDiceBox(containerSelector: string) {
  const ready = ref(false)
  const rolling = ref(false)
  const lastResults = ref<DieFaceResult[]>([])
  const lastTotal = ref(0)
  const box = shallowRef<DiceBox | null>(null)
  let rollTimeout: ReturnType<typeof setTimeout> | null = null

  function finishRoll(results: unknown) {
    const faces = flattenResults(results)
    lastResults.value = faces
    lastTotal.value = sumResults(faces)
    rolling.value = false
    if (rollTimeout) {
      clearTimeout(rollTimeout)
      rollTimeout = null
    }
  }

  async function init() {
    if (box.value) return
    const origin = `${window.location.origin}/`
    const instance = new DiceBox({
      container: containerSelector,
      origin,
      assetPath: 'dice-box/',
      theme: 'default',
      themeColor: '#448aff',
      scale: 6,
      gravity: 1,
      throwForce: 6,
      spinForce: 6,
      startingHeight: 8,
      settleTimeout: 4000,
      offscreen: false,
      enableShadows: true,
      onRollComplete: (results) => {
        finishRoll(results)
      },
    })
    await instance.init()
    box.value = instance
    ready.value = true
  }

  function countDice(tray: DieSides[]) {
    const counts = new Map<DieSides, number>()
    for (const sides of tray) {
      counts.set(sides, (counts.get(sides) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => a[0] - b[0])
  }

  function buildNotation(tray: DieSides[]) {
    return countDice(tray).map(([sides, qty]) => `${qty}d${sides}`)
  }

  function buildRoll(tray: DieSides[]) {
    return countDice(tray).map(([sides, qty]) => ({
      qty,
      sides,
      themeColor: DIE_COLORS[sides],
    }))
  }

  async function roll(tray: DieSides[]) {
    if (!box.value || rolling.value || tray.length === 0) return
    rolling.value = true
    if (rollTimeout) clearTimeout(rollTimeout)
    rollTimeout = setTimeout(() => {
      rolling.value = false
      rollTimeout = null
    }, 8000)
    try {
      const results = await box.value.roll(buildRoll(tray))
      finishRoll(results)
    } catch {
      rolling.value = false
      if (rollTimeout) {
        clearTimeout(rollTimeout)
        rollTimeout = null
      }
    }
  }

  function clear() {
    box.value?.clear()
    lastResults.value = []
    lastTotal.value = 0
    rolling.value = false
    if (rollTimeout) {
      clearTimeout(rollTimeout)
      rollTimeout = null
    }
  }

  onBeforeUnmount(() => {
    box.value?.clear()
    box.value = null
  })

  return {
    ready,
    rolling,
    lastResults,
    lastTotal,
    init,
    roll,
    clear,
    buildNotation,
  }
}
