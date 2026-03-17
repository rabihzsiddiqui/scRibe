'use client';

import { useEffect, useRef, useState } from 'react';

export type AmbientSound = 'rain' | 'white-noise' | 'lofi';

const VOLUME = 0.25;

function makeNoiseBuffer(ctx: AudioContext, durationSecs = 3): AudioBuffer {
  const length = ctx.sampleRate * durationSecs;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

interface AudioNodes {
  source?: AudioBufferSourceNode;
  gain?: GainNode;
  ctx?: AudioContext;
  lofi?: HTMLAudioElement;
}

export function useAmbientSound() {
  const [active, setActive] = useState<AmbientSound | null>(null);
  const nodes = useRef<AudioNodes>({});

  function stopNodes() {
    const n = nodes.current;
    try { n.source?.stop(); } catch { /* already stopped */ }
    try { n.gain?.disconnect(); } catch { /* already disconnected */ }
    try { n.ctx?.close(); } catch { /* already closed */ }
    if (n.lofi) {
      n.lofi.pause();
      n.lofi.currentTime = 0;
    }
    nodes.current = {};
  }

  function startWhiteNoise(ctx: AudioContext) {
    const source = ctx.createBufferSource();
    source.buffer = makeNoiseBuffer(ctx);
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = VOLUME;

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    nodes.current = { source, gain, ctx };
  }

  function startRain(ctx: AudioContext) {
    const source = ctx.createBufferSource();
    source.buffer = makeNoiseBuffer(ctx);
    source.loop = true;

    // Shape noise into rain: remove high rumble, emphasize mid-low frequencies
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 450;
    lowpass.Q.value = 0.4;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 80;

    const gain = ctx.createGain();
    gain.gain.value = VOLUME * 1.5;

    source.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    nodes.current = { source, gain, ctx };
  }

  function startLofi() {
    // NOTE: Place a royalty-free lo-fi loop at /public/audio/lofi.mp3
    // Recommended sources:
    //   - Pixabay Music (pixabay.com/music) — search "lo-fi"
    //   - Freesound.org — search "lofi loop" with CC0 license
    const audio = new Audio('/audio/lofi.mp3');
    audio.loop = true;
    audio.volume = VOLUME;
    audio.play().catch(() => {
      // File not found or autoplay blocked — clean up silently
      nodes.current.lofi = undefined;
      setActive(null);
    });
    nodes.current = { lofi: audio };
  }

  function toggle(sound: AmbientSound) {
    if (active === sound) {
      stopNodes();
      setActive(null);
      return;
    }
    stopNodes();
    try {
      if (sound === 'lofi') {
        startLofi();
        setActive('lofi');
        return;
      }
      const ctx = new AudioContext();
      if (sound === 'white-noise') {
        startWhiteNoise(ctx);
      } else {
        startRain(ctx);
      }
      setActive(sound);
    } catch {
      // AudioContext unavailable — fail silently
    }
  }

  // Cleanup on unmount and page unload
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
