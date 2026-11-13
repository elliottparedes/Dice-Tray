import type { DieSides } from '@/types'

type DieVoice = {
  tableHz: number
  woodHz: number
  knockHz: number
  decay: number
  weight: number
}

const DIE_VOICES: Record<DieSides, DieVoice> = {
  4: { tableHz: 78, woodHz: 210, knockHz: 340, decay: 0.22, weight: 0.75 },
  6: { tableHz: 70, woodHz: 190, knockHz: 310, decay: 0.24, weight: 0.85 },
  8: { tableHz: 64, woodHz: 175, knockHz: 280, decay: 0.26, weight: 0.9 },
  10: { tableHz: 58, woodHz: 160, knockHz: 260, decay: 0.28, weight: 0.95 },
  12: { tableHz: 52, woodHz: 145, knockHz: 240, decay: 0.3, weight: 1 },
  20: { tableHz: 46, woodHz: 128, knockHz: 210, decay: 0.34, weight: 1.08 },
  100: { tableHz: 40, woodHz: 112, knockHz: 180, decay: 0.38, weight: 1.15 },
}

function createNoiseBuffer(ctx: AudioContext, duration: number) {
  const length = Math.floor(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) {
    const envelope = 1 - i / length
    data[i] = (Math.random() * 2 - 1) * envelope
  }
  return buffer
}

export function useDiceSounds() {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null

  function ensureContext() {
    if (!ctx) {
      ctx = new AudioContext()
      master = ctx.createGain()
      master.gain.value = 0.85
      const warmth = ctx.createBiquadFilter()
      warmth.type = 'lowpass'
      warmth.frequency.value = 520
      warmth.Q.value = 0.6
      master.connect(warmth)
      warmth.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }
    return { ctx, master: master! }
  }

  function playClack(sides: DieSides, when = 0, gainScale = 1) {
    const { ctx: audio, master: bus } = ensureContext()
    const voice = DIE_VOICES[sides]
    const start = audio.currentTime + when
    const amp = gainScale * voice.weight

    const table = audio.createOscillator()
    table.type = 'sine'
    table.frequency.setValueAtTime(voice.tableHz * 1.35, start)
    table.frequency.exponentialRampToValueAtTime(voice.tableHz, start + voice.decay)
    const tableGain = audio.createGain()
    tableGain.gain.setValueAtTime(0.0001, start)
    tableGain.gain.exponentialRampToValueAtTime(0.7 * amp, start + 0.012)
    tableGain.gain.exponentialRampToValueAtTime(0.0001, start + voice.decay * 1.35)
    table.connect(tableGain)
    tableGain.connect(bus)
    table.start(start)
    table.stop(start + voice.decay * 1.4)

    const body = audio.createOscillator()
    body.type = 'triangle'
    body.frequency.setValueAtTime(voice.woodHz, start)
    body.frequency.exponentialRampToValueAtTime(voice.woodHz * 0.62, start + voice.decay)
    const bodyFilter = audio.createBiquadFilter()
    bodyFilter.type = 'lowpass'
    bodyFilter.frequency.value = 280
    const bodyGain = audio.createGain()
    bodyGain.gain.setValueAtTime(0.0001, start)
    bodyGain.gain.exponentialRampToValueAtTime(0.22 * amp, start + 0.008)
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, start + voice.decay)
    body.connect(bodyFilter)
    bodyFilter.connect(bodyGain)
    bodyGain.connect(bus)
    body.start(start)
    body.stop(start + voice.decay + 0.02)

    const knock = audio.createBufferSource()
    knock.buffer = createNoiseBuffer(audio, 0.12)
    const knockFilter = audio.createBiquadFilter()
    knockFilter.type = 'bandpass'
    knockFilter.frequency.value = voice.knockHz
    knockFilter.Q.value = 0.7
    const knockGain = audio.createGain()
    knockGain.gain.setValueAtTime(0.0001, start)
    knockGain.gain.exponentialRampToValueAtTime(0.45 * amp, start + 0.004)
    knockGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.09)
    knock.connect(knockFilter)
    knockFilter.connect(knockGain)
    knockGain.connect(bus)
    knock.start(start)
    knock.stop(start + 0.12)
  }

  function playPick(sides: DieSides) {
    playClack(sides, 0, 0.55)
  }

  function playRoll(tray: DieSides[]) {
    ensureContext()
    tray.forEach((sides, index) => {
      const bounceCount = sides >= 20 ? 4 : 3
      for (let bounce = 0; bounce < bounceCount; bounce += 1) {
        const delay = 0.04 + index * 0.06 + bounce * (0.09 + sides * 0.001) + Math.random() * 0.03
        const fade = bounce === 0 ? 1 : 0.72 - bounce * 0.14
        playClack(sides, delay, Math.max(0.28, fade))
      }
    })
  }

  return {
    playPick,
    playRoll,
  }
}
