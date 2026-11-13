export type Spark = {
  id: number
  style: Record<string, string>
}

const SPARK_COLORS = ['#ffd600', '#ff5252', '#18ffff', '#ffffff', '#69f0ae', '#e040fb', '#ff6e40']

const FANFARE = [523.25, 659.25, 783.99, 1046.5]

export function useCelebration() {
  let ctx: AudioContext | null = null

  function ensureContext() {
    if (!ctx) ctx = new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  }

  function playTrumpet() {
    const audio = ensureContext()
    const now = audio.currentTime + 0.02
    const notes = [...FANFARE, 1318.51]
    const master = audio.createGain()
    master.gain.value = 0.22
    master.connect(audio.destination)

    notes.forEach((freq, index) => {
      const start = now + index * 0.13
      const osc = audio.createOscillator()
      const body = audio.createOscillator()
      const filter = audio.createBiquadFilter()
      const gain = audio.createGain()
      osc.type = 'sawtooth'
      body.type = 'triangle'
      osc.frequency.setValueAtTime(freq * 0.94, start)
      osc.frequency.exponentialRampToValueAtTime(freq, start + 0.07)
      body.frequency.setValueAtTime(freq / 2, start)
      filter.type = 'lowpass'
      filter.Q.value = 0.8
      filter.frequency.setValueAtTime(320, start)
      filter.frequency.exponentialRampToValueAtTime(2200, start + 0.09)
      filter.frequency.exponentialRampToValueAtTime(640, start + 0.42)
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(1, start + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.46)
      osc.connect(filter)
      body.connect(filter)
      filter.connect(gain)
      gain.connect(master)
      osc.start(start)
      body.start(start)
      osc.stop(start + 0.48)
      body.stop(start + 0.48)
    })
  }

  function playSadTrombone() {
    const audio = ensureContext()
    const now = audio.currentTime + 0.05
    const notes = [466.16, 440, 415.3, 196]
    const master = audio.createGain()
    master.gain.value = 0.2
    master.connect(audio.destination)

    notes.forEach((freq, index) => {
      const start = now + index * 0.22
      const slide = index === notes.length - 1
      const osc = audio.createOscillator()
      const filter = audio.createBiquadFilter()
      const gain = audio.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, start)
      if (slide) osc.frequency.exponentialRampToValueAtTime(110, start + 0.7)
      filter.type = 'lowpass'
      filter.Q.value = 4
      filter.frequency.setValueAtTime(slide ? 900 : 1400, start)
      filter.frequency.exponentialRampToValueAtTime(180, start + (slide ? 0.7 : 0.2))
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(1, start + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + (slide ? 0.85 : 0.28))
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(master)
      osc.start(start)
      osc.stop(start + (slide ? 0.9 : 0.32))
    })
  }

  function makeSparks(): Spark[] {
    const count = 64
    return Array.from({ length: count }, (_, id) => {
      const angle = (Math.PI * 2 * id) / count + Math.random() * 0.4
      const distance = 90 + Math.random() * 150
      const dx = Math.cos(angle) * distance
      const dy = Math.sin(angle) * distance * 0.72 - 20
      return {
        id,
        style: {
          background: SPARK_COLORS[id % SPARK_COLORS.length],
          color: SPARK_COLORS[id % SPARK_COLORS.length],
          '--dx': `${dx}px`,
          '--dy': `${dy}px`,
          animationDelay: `${Math.random() * 0.12}s`,
          width: id % 5 === 0 ? '11px' : '7px',
          height: id % 5 === 0 ? '11px' : '7px',
        },
      }
    })
  }

  function makeTears(): Spark[] {
    const count = 28
    return Array.from({ length: count }, (_, id) => {
      const dx = (Math.random() - 0.5) * 180
      const dy = 80 + Math.random() * 160
      return {
        id,
        style: {
          background: id % 2 === 0 ? '#8ab4ff' : '#5f6368',
          color: '#8ab4ff',
          '--dx': `${dx}px`,
          '--dy': `${dy}px`,
          animationName: 'sink',
          animationDelay: `${Math.random() * 0.25}s`,
          width: '6px',
          height: '10px',
          borderRadius: '40%',
        },
      }
    })
  }

  return {
    playTrumpet,
    playSadTrombone,
    makeSparks,
    makeTears,
  }
}
