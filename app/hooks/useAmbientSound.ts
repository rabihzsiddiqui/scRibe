'use client';

import { useEffect, useRef, useState } from 'react';

export type AmbientSound = 'rain' | 'white-noise' | 'lofi';

const VOLUME = 0.22;
const BUFFER_SECS = 10;

function makeWhiteNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const length = ctx.sampleRate * BUFFER_SECS;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// Brown noise: leaky integrator over white noise — heavy bass, almost no highs
function makeBrownNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const length = ctx.sampleRate * BUFFER_SECS;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  let peak = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    const sample = last * 3.5;
    data[i] = sample;
    peak = Math.max(peak, Math.abs(sample));
  }
  if (peak > 0) {
    const scale = 1 / peak;
    for (let i = 0; i < length; i++) data[i] *= scale;
  }
  return buffer;
}

interface SoundNodes {
  source?: AudioBufferSourceNode;
  lfo?: OscillatorNode;
  ctx?: AudioContext;
}

export function useAmbientSound() {
  const [active, setActive] = useState<AmbientSound | null>(null);
  const nodes = useRef<SoundNodes>({});
  const activeRef = useRef<AmbientSound | null>(null);

  function stopNodes() {
    const n = nodes.current;
    try { n.source?.stop(); } catch { /* already stopped */ }
    try { n.lfo?.stop(); } catch { /* already stopped */ }
    try { n.source?.disconnect(); } catch { /* already disconnected */ }
    try { n.lfo?.disconnect(); } catch { /* already disconnected */ }
    try { n.ctx?.close(); } catch { /* already closed */ }
    nodes.current = {};
  }

  // Rain: bandpass-filtered white noise with slow LFO for uneven patter
  function startRain() {
    const ctx = new AudioContext();

    const source = ctx.createBufferSource();
    source.buffer = makeWhiteNoiseBuffer(ctx);
    source.loop = true;

    // Bandpass centered ~1400Hz — removes rumble and harsh hiss
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1400;
    bandpass.Q.value = 0.9;

    // Additional lowpass to soften the top end
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1800;
    lowpass.Q.value = 0.5;

    const masterGain = ctx.createGain();
    masterGain.gain.value = VOLUME * 1.8;

    // Slow LFO simulates the uneven patter of rain (~0.7Hz = irregular gusts)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.7;

    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = VOLUME * 0.45;

    lfo.connect(lfoDepth);
    lfoDepth.connect(masterGain.gain);

    source.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(masterGain);
    masterGain.connect(ctx.destination);

    source.start();
    lfo.start();

    nodes.current = { source, lfo, ctx };
  }

  // White noise: lowpass-filtered at ~3500Hz — warm and soft, not harsh static
  function startWhiteNoise() {
    const ctx = new AudioContext();

    const source = ctx.createBufferSource();
    source.buffer = makeWhiteNoiseBuffer(ctx);
    source.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 3500;
    lowpass.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.value = VOLUME;

    source.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    nodes.current = { source, ctx };
  }

  // Lo-fi: brown noise through dual lowpass (~600Hz) + very slow LFO for breathing texture
  function startLofi() {
    const ctx = new AudioContext();

    const source = ctx.createBufferSource();
    source.buffer = makeBrownNoiseBuffer(ctx);
    source.loop = true;

    // Two cascaded lowpass filters for a steep rolloff — warm, muffled hum
    const lp1 = ctx.createBiquadFilter();
    lp1.type = 'lowpass';
    lp1.frequency.value = 650;
    lp1.Q.value = 0.5;

    const lp2 = ctx.createBiquadFilter();
    lp2.type = 'lowpass';
    lp2.frequency.value = 650;
    lp2.Q.value = 0.5;

    const masterGain = ctx.createGain();
    masterGain.gain.value = VOLUME * 2.2;

    // Very slow LFO (~12-second cycle) for a subtle breathing quality
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;

    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = VOLUME * 0.18;

    lfo.connect(lfoDepth);
    lfoDepth.connect(masterGain.gain);

    source.connect(lp1);
    lp1.connect(lp2);
    lp2.connect(masterGain);
    masterGain.connect(ctx.destination);

    source.start();
    lfo.start();

    nodes.current = { source, lfo, ctx };
  }

  const starters: Record<AmbientSound, () => void> = {
    rain: startRain,
    'white-noise': startWhiteNoise,
    lofi: startLofi,
  };

  function toggle(sound: AmbientSound) {
    if (activeRef.current === sound) {
      stopNodes();
      activeRef.current = null;
      setActive(null);
      return;
    }
    stopNodes();
    try {
      starters[sound]();
      activeRef.current = sound;
      setActive(sound);
    } catch (err) {
      console.warn(`[ambient] failed to start ${sound}:`, err);
      activeRef.current = null;
    }
  }

  useEffect(() => {
    function onUnload() { stopNodes(); }
    window.addEventListener('beforeunload', onUnload);
    return () => {
      window.removeEventListener('beforeunload', onUnload);
      stopNodes();
    };
  }, []);

  return { active, toggle };
}
