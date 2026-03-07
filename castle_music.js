/**
 * castle_music.js
 * Dark medieval chiptune soundtrack for Castle Climber
 * Uses Web Audio API — no external dependencies
 */
(function () {
  'use strict';

  let audioCtx = null;
  let masterGain = null;
  let isPlaying = false;
  let loopTimer = null;
  let activeNodes = [];

  // ── Tuning ──────────────────────────────────────────────────────────
  const BPM = 86;
  const N16 = (60 / BPM) / 4; // 16th-note duration in seconds

  // Frequency map (A minor / C major world)
  const F = {
    C2:65.41,  D2:73.42,  E2:82.41,  F2:87.31,  G2:98.00,
    A2:110.00, B2:123.47,
    C3:130.81, D3:146.83, E3:164.81, F3:174.61, G3:196.00,
    A3:220.00, B3:246.94,
    C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392.00,
    A4:440.00, B4:493.88,
    C5:523.25, D5:587.33, E5:659.25, F5:698.46, G5:783.99,
    R: 0,
  };

  // Helper: n16 steps → seconds
  const d = (steps) => steps * N16;

  // ── COMPOSITION ─────────────────────────────────────────────────────
  // 8 bars × 16 steps = 128 steps total per loop
  // All three tracks MUST sum to d(128) for seamless looping.
  //
  // Theme: A natural minor, haunting & martial.
  // Key colors: dark drone, climbing arpeggio, tolling melody.

  // ── MELODY (square wave, mid-range) ─────────────────────────────────
  // Bar 1
  const melody = [
    {f:F.E4,d:d(2)}, {f:F.R,d:d(1)}, {f:F.D4,d:d(1)},
    {f:F.C4,d:d(4)}, {f:F.R,d:d(4)}, {f:F.A3,d:d(4)},
  // Bar 2
    {f:F.B3,d:d(2)}, {f:F.R,d:d(1)}, {f:F.C4,d:d(1)},
    {f:F.D4,d:d(4)}, {f:F.R,d:d(4)}, {f:F.E4,d:d(4)},
  // Bar 3
    {f:F.R,d:d(4)},
    {f:F.G4,d:d(2)}, {f:F.R,d:d(1)}, {f:F.F4,d:d(1)},
    {f:F.E4,d:d(4)}, {f:F.C4,d:d(4)},
  // Bar 4
    {f:F.D4,d:d(2)}, {f:F.C4,d:d(2)},
    {f:F.B3,d:d(4)}, {f:F.R,d:d(4)}, {f:F.A3,d:d(4)},
  // Bar 5
    {f:F.A3,d:d(2)}, {f:F.R,d:d(1)}, {f:F.B3,d:d(1)},
    {f:F.C4,d:d(4)}, {f:F.R,d:d(4)}, {f:F.E4,d:d(4)},
  // Bar 6
    {f:F.F4,d:d(2)}, {f:F.E4,d:d(2)},
    {f:F.D4,d:d(4)}, {f:F.R,d:d(4)}, {f:F.A3,d:d(4)},
  // Bar 7
    {f:F.C4,d:d(2)}, {f:F.R,d:d(1)}, {f:F.D4,d:d(1)},
    {f:F.E4,d:d(4)},
    {f:F.G4,d:d(2)}, {f:F.F4,d:d(2)}, {f:F.E4,d:d(4)},
  // Bar 8
    {f:F.D4,d:d(4)}, {f:F.C4,d:d(2)}, {f:F.B3,d:d(2)},
    {f:F.A3,d:d(8)},
  ];

  // ── BASS (sawtooth, low rumble) ──────────────────────────────────────
  const bass = [
  // Bar 1: Am
    {f:F.A2,d:d(4)}, {f:F.A2,d:d(4)}, {f:F.E2,d:d(4)}, {f:F.A2,d:d(4)},
  // Bar 2: Am → G
    {f:F.A2,d:d(4)}, {f:F.A2,d:d(4)}, {f:F.G2,d:d(4)}, {f:F.E2,d:d(4)},
  // Bar 3: F → C
    {f:F.F2,d:d(8)}, {f:F.C2,d:d(8)},
  // Bar 4: Dm → E
    {f:F.D2,d:d(8)}, {f:F.E2,d:d(8)},
  // Bar 5: Am
    {f:F.A2,d:d(4)}, {f:F.A2,d:d(4)}, {f:F.E2,d:d(4)}, {f:F.A2,d:d(4)},
  // Bar 6: F → Am/E
    {f:F.F2,d:d(4)}, {f:F.A2,d:d(4)}, {f:F.G2,d:d(4)}, {f:F.E2,d:d(4)},
  // Bar 7: C → G
    {f:F.C2,d:d(8)}, {f:F.G2,d:d(8)},
  // Bar 8: Am
    {f:F.A2,d:d(8)}, {f:F.E2,d:d(4)}, {f:F.A2,d:d(4)},
  ];

  // ── ARPEGGIO (triangle, sparkling high notes) ────────────────────────
  const arp = [
  // Bar 1: Am arp
    {f:F.R, d:d(4)},
    {f:F.A4,d:d(2)}, {f:F.E4,d:d(2)},
    {f:F.R, d:d(4)},
    {f:F.C4,d:d(2)}, {f:F.E4,d:d(2)},
  // Bar 2: G arp
    {f:F.R, d:d(4)},
    {f:F.G4,d:d(2)}, {f:F.B3,d:d(2)},
    {f:F.R, d:d(8)},
  // Bar 3: F arp
    {f:F.R, d:d(4)},
    {f:F.F4,d:d(2)}, {f:F.A4,d:d(2)},
    {f:F.C5,d:d(4)},
    {f:F.R, d:d(4)},
  // Bar 4: Dm → E
    {f:F.R, d:d(4)},
    {f:F.D4,d:d(2)}, {f:F.F4,d:d(2)},
    {f:F.E4,d:d(4)},
    {f:F.R, d:d(4)},
  // Bar 5: sparse echoes
    {f:F.R, d:d(8)},
    {f:F.A4,d:d(2)}, {f:F.R,d:d(2)},
    {f:F.E4,d:d(4)},
  // Bar 6
    {f:F.R, d:d(4)},
    {f:F.C4,d:d(2)}, {f:F.R,d:d(2)},
    {f:F.R, d:d(8)},
  // Bar 7
    {f:F.R, d:d(8)},
    {f:F.G4,d:d(2)}, {f:F.F4,d:d(2)},
    {f:F.E4,d:d(4)},
  // Bar 8
    {f:F.R, d:d(4)},
    {f:F.A4,d:d(2)}, {f:F.C5,d:d(2)},
    {f:F.R, d:d(4)},
    {f:F.A4,d:d(4)},
  ];

  // ── PERCUSSION (simple castle drum — filtered noise bursts) ──────────
  // Pattern: kick on 1 & 3, snare-rattle on 2 & 4 (each bar = 16 steps)
  // We represent it as a simple array of [step, type] events per 128-step loop.
  const drumPattern = [];
  for (let bar = 0; bar < 8; bar++) {
    const base = bar * 16;
    drumPattern.push({ step: base,      type: 'kick'  });
    drumPattern.push({ step: base + 4,  type: 'snare' });
    drumPattern.push({ step: base + 6,  type: 'hat'   });
    drumPattern.push({ step: base + 8,  type: 'kick'  });
    drumPattern.push({ step: base + 10, type: 'hat'   });
    drumPattern.push({ step: base + 12, type: 'snare' });
    drumPattern.push({ step: base + 14, type: 'hat'   });
  }

  // ── REVERB ──────────────────────────────────────────────────────────
  function makeReverb(ctx) {
    const convolver = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 1.8);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
      }
    }
    convolver.buffer = buf;
    return convolver;
  }

  // ── TRACK SCHEDULER ─────────────────────────────────────────────────
  function scheduleTrack(notes, type, vol, when, reverbSend) {
    notes.forEach(note => {
      if (note.f <= 0 || note.d <= 0) return;
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.value = note.f;

      const atk = 0.008;
      const rel = Math.min(0.06, note.d * 0.55);

      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(vol, when + atk);
      gain.gain.setValueAtTime(vol, when + note.d - rel);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + note.d);

      osc.connect(gain);
      gain.connect(masterGain);
      if (reverbSend) gain.connect(reverbSend);

      osc.start(when);
      osc.stop(when + note.d + 0.015);
      activeNodes.push(osc);
      when += note.d;
    });
  }

  // ── DRUM SCHEDULER ──────────────────────────────────────────────────
  function scheduleDrums(when) {
    drumPattern.forEach(evt => {
      const t = when + evt.step * N16;
      const bufLen = audioCtx.sampleRate * 0.12;
      const buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
      const ch = buf.getChannelData(0);
      const data = ch;

      if (evt.type === 'kick') {
        // Low thud: sine sweep + noise burst
        for (let i = 0; i < bufLen; i++) {
          const p = i / bufLen;
          data[i] = Math.sin(2 * Math.PI * (80 - 70 * p) * i / audioCtx.sampleRate)
                  * Math.pow(1 - p, 2.5) * 0.9;
        }
      } else if (evt.type === 'snare') {
        // Mid noise + subtle tone
        for (let i = 0; i < bufLen; i++) {
          const p = i / bufLen;
          data[i] = ((Math.random() * 2 - 1) * 0.6
                  + Math.sin(2 * Math.PI * 180 * i / audioCtx.sampleRate) * 0.3)
                  * Math.pow(1 - p, 3.5) * 0.6;
        }
      } else {
        // Hi-hat: short filtered noise
        const hatLen = Math.floor(bufLen * 0.35);
        for (let i = 0; i < hatLen; i++) {
          const p = i / hatLen;
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - p, 4) * 0.25;
        }
      }

      const src  = audioCtx.createBufferSource();
      const gain = audioCtx.createGain();
      const filt = audioCtx.createBiquadFilter();

      src.buffer = buf;
      filt.type = evt.type === 'hat' ? 'highpass' : 'lowpass';
      filt.frequency.value = evt.type === 'kick' ? 200 : evt.type === 'snare' ? 3000 : 6000;

      gain.gain.value = evt.type === 'kick' ? 0.55 : evt.type === 'snare' ? 0.40 : 0.22;

      src.connect(filt);
      filt.connect(gain);
      gain.connect(masterGain);

      src.start(t);
      activeNodes.push(src);
    });
  }

  // ── DRONE ────────────────────────────────────────────────────────────
  function scheduleDrone(when, dur) {
    [F.A2 / 2, F.E2 / 2].forEach((freq, i) => {
      const osc  = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = i * 4; // micro-detune for subtle shimmer
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(0.055, when + 1.5);
      gain.gain.setValueAtTime(0.055, when + dur - 1.5);
      gain.gain.linearRampToValueAtTime(0, when + dur);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(when);
      osc.stop(when + dur + 0.1);
      activeNodes.push(osc);
    });
  }

  // ── LOOP ENGINE ──────────────────────────────────────────────────────
  function totalDur() {
    return d(128); // 8 bars × 16 steps
  }

  let reverbNode = null;

  function scheduleLoop(startTime) {
    if (!isPlaying) return;

    const dur = totalDur();

    // Reverb send bus
    if (!reverbNode) {
      reverbNode = makeReverb(audioCtx);
      const reverbGain = audioCtx.createGain();
      reverbGain.gain.value = 0.18;
      reverbNode.connect(reverbGain);
      reverbGain.connect(masterGain);
    }

    // Schedule all parts
    scheduleTrack(melody, 'square',   0.10, startTime, reverbNode);
    scheduleTrack(bass,   'sawtooth', 0.14, startTime, null);
    scheduleTrack(arp,    'triangle', 0.065, startTime, reverbNode);
    scheduleDrums(startTime);
    scheduleDrone(startTime, dur);

    // Clean up old stopped nodes
    activeNodes = activeNodes.filter(n => {
      try { return n.playbackState !== 3; } catch(e) { return false; }
    });

    // Schedule next iteration slightly before this one ends
    const msUntilNext = (startTime + dur - 0.15 - audioCtx.currentTime) * 1000;
    loopTimer = setTimeout(() => scheduleLoop(startTime + dur), Math.max(0, msUntilNext));
  }

  // ── PUBLIC API ───────────────────────────────────────────────────────
  function initCtx() {
    if (audioCtx) return;
    audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.38;
    masterGain.connect(audioCtx.destination);
  }

  function start() {
    if (isPlaying) return;
    initCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    isPlaying = true;
    scheduleLoop(audioCtx.currentTime + 0.08);
  }

  function stop() {
    isPlaying = false;
    clearTimeout(loopTimer);
    activeNodes.forEach(n => { try { n.stop(0); } catch (_) {} });
    activeNodes = [];
  }

  function setVolume(v) {
    if (masterGain) masterGain.gain.linearRampToValueAtTime(
      Math.max(0, Math.min(1, v)),
      audioCtx.currentTime + 0.08
    );
  }

  // ── MUSIC TOGGLE BUTTON ──────────────────────────────────────────────
  let started = false;
  let muted = false;

  function injectMusicButton() {
    const btn = document.createElement('button');
    btn.id = 'musicbtn';
    btn.title = 'Toggle Music';
    btn.textContent = '♪';
    btn.style.cssText = [
      'position:absolute','top:10px','right:98px',
      'background:rgba(0,0,0,0.6)','border:2px solid #888',
      'color:#ffdd00','font-family:monospace','font-size:16px',
      'width:36px','height:36px','cursor:pointer',
      'display:flex','align-items:center','justify-content:center',
      'z-index:10',
    ].join(';');

    btn.addEventListener('click', () => {
      if (!started) {
        started = true;
        start();
        return; // first click = start (already un-muted)
      }
      muted = !muted;
      setVolume(muted ? 0 : 0.38);
      btn.style.color       = muted ? '#555555' : '#ffdd00';
      btn.style.borderColor = muted ? '#444444' : '#888888';
    });

    btn.addEventListener('mouseover', () => {
      btn.style.borderColor = '#ffdd00';
    });
    btn.addEventListener('mouseout', () => {
      btn.style.borderColor = muted ? '#444444' : '#888888';
    });

    const wrap = document.getElementById('game-wrap');
    if (wrap) wrap.appendChild(btn);
  }

  // Auto-start on first user interaction (browser autoplay policy)
  function onFirstInteract() {
    if (started) return;
    started = true;
    start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectMusicButton);
  } else {
    injectMusicButton();
  }

  document.addEventListener('pointerdown', onFirstInteract, { once: true });
  document.addEventListener('keydown',     onFirstInteract, { once: true });

  // Expose for external control (pause menu etc.)
  window.CastleMusic = { start, stop, setVolume };
})();
