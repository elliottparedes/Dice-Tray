<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useDiceStorage } from '@/composables/useDiceStorage'
import { useDiceBox } from '@/composables/useDiceBox'
import { useDiceSounds } from '@/composables/useDiceSounds'
import { useCelebration, type Spark } from '@/composables/useCelebration'
import { DIE_COLORS, dieTextColor } from '@/dieColors'
import type { DieSides } from '@/types'

const DIE_OPTIONS: DieSides[] = [4, 6, 8, 10, 12, 20, 100]
const { diceTray } = useDiceStorage()
const { ready, rolling, lastResults, lastTotal, init, roll, clear, buildNotation } =
  useDiceBox('#dice-canvas')
const { playPick, playRoll } = useDiceSounds()
const { playTrumpet, playSadTrombone, makeSparks, makeTears } = useCelebration()
const physicsVisible = ref(false)
const celebrating = ref(false)
const sparks = ref<Spark[]>([])
let celebrationTimer: ReturnType<typeof setTimeout> | null = null

const notationPreview = computed(() => {
  if (!diceTray.value?.length) return 'Tap a die to set it on the tray'
  return buildNotation(diceTray.value).join(' + ')
})

function chipStyle(sides: DieSides) {
  return {
    background: DIE_COLORS[sides],
    color: dieTextColor(sides),
  }
}

const resultStyle = computed(() => {
  const tray = diceTray.value ?? []
  const sides = tray[0]
  if (!sides || tray.some((die) => die !== sides)) {
    return { background: '#f8f9fa', color: '#121418' }
  }
  return {
    background: DIE_COLORS[sides],
    color: dieTextColor(sides),
  }
})

function parkStyle(sides: DieSides, index: number) {
  const tilt = ((index * 17) % 21) - 10
  return {
    background: DIE_COLORS[sides],
    color: dieTextColor(sides),
    transform: `rotate(${tilt}deg)`,
  }
}

onMounted(async () => {
  if (!Array.isArray(diceTray.value)) {
    diceTray.value = []
  }
  await init()
})

watch(rolling, (isRolling, wasRolling) => {
  if (!wasRolling || isRolling) return
  const tray = diceTray.value ?? []
  if (tray.length !== 1 || tray[0] !== 20) return
  const face = lastResults.value[0]?.value ?? lastTotal.value
  if (face !== 20 && face !== 1) return
  const crit = face === 20
  sparks.value = crit ? makeSparks() : makeTears()
  celebrating.value = true
  if (crit) playTrumpet()
  else playSadTrombone()
  if (celebrationTimer) clearTimeout(celebrationTimer)
  celebrationTimer = setTimeout(() => {
    celebrating.value = false
    sparks.value = []
  }, crit ? 1600 : 1400)
})

function resetTable() {
  celebrating.value = false
  sparks.value = []
  if (!physicsVisible.value) return
  physicsVisible.value = false
  clear()
}

function addDie(sides: DieSides) {
  playPick(sides)
  resetTable()
  diceTray.value = [...(diceTray.value ?? []), sides]
}

function removeLast() {
  resetTable()
  diceTray.value = (diceTray.value ?? []).slice(0, -1)
}

function clearTray() {
  physicsVisible.value = false
  diceTray.value = []
  clear()
}

async function rollTray() {
  const tray = diceTray.value ?? []
  if (tray.length === 0 || rolling.value) return
  physicsVisible.value = true
  playRoll(tray)
  await roll(tray)
}
</script>

<template>
  <section class="dice-tray" aria-label="Dice roller">
    <p class="notation">{{ notationPreview }}</p>

    <div class="die-picker">
      <button
        v-for="sides in DIE_OPTIONS"
        :key="sides"
        type="button"
        class="die-chip"
        :style="chipStyle(sides)"
        :disabled="!ready || rolling"
        @click="addDie(sides)"
      >
        d{{ sides }}
      </button>
    </div>

    <div class="tray-actions">
      <div class="quiet-actions">
        <button type="button" class="text-action" :disabled="rolling || !(diceTray?.length)" @click="removeLast">
          Undo
        </button>
        <button type="button" class="text-action" :disabled="rolling || !(diceTray?.length)" @click="clearTray">
          Clear
        </button>
      </div>
      <button
        type="button"
        class="roll-bar"
        :disabled="!ready || rolling || !(diceTray?.length)"
        @click="rollTray"
      >
        {{ rolling ? 'Rolling…' : 'Roll' }}
      </button>
    </div>

    <div id="dice-canvas" class="dice-canvas">
      <div v-if="!physicsVisible && diceTray?.length" class="parked" aria-hidden="true">
        <span
          v-for="(sides, index) in diceTray"
          :key="`${sides}-${index}`"
          class="parked-die"
          :class="`shape-${sides}`"
          :style="parkStyle(sides, index)"
        >
          d{{ sides }}
        </span>
      </div>
      <div v-if="celebrating" class="fireworks" aria-hidden="true">
        <span v-for="spark in sparks" :key="spark.id" class="spark" :style="spark.style" />
      </div>
      <div v-if="physicsVisible && lastTotal" class="roll-result" aria-live="polite">
        <strong class="result-total" :style="resultStyle">{{ lastTotal }}</strong>
      </div>
    </div>
  </section>
</template>
