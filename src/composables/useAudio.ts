import { useSettings } from '../stores/settings'

let audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioCtx
}

export function useAudio() {
  const { settings } = useSettings()

  const playTone = (freq: number, duration: number, type: OscillatorType = 'sine') => {
    if (!settings.value.soundEnabled) return
    try {
      const ctx = getAudioCtx()
      if (ctx.state === 'suspended') ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.stop(ctx.currentTime + duration)
    } catch (e) {
      console.error('Audio play failed', e)
    }
  }

  const playCorrect = () => playTone(880, 0.08)
  const playWrong = () => playTone(220, 0.15, 'sawtooth')
  const playCombo = () => playTone(1100, 0.05)
  const playLevelUp = () => {
    playTone(523, 0.1)
    setTimeout(() => playTone(659, 0.1), 100)
    setTimeout(() => playTone(784, 0.2), 200)
  }

  return { playCorrect, playWrong, playCombo, playLevelUp }
}
