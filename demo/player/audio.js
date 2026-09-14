/**
 * THE AUDIO GRAPH, shared by both player pages.
 *
 * Extracted rather than copied. demo/player/index.html is the components at
 * the size the package ships and demo/player/classic.html is the same
 * components at Winamp's real 275x116, and the only thing that differs
 * between them is where the boxes sit. Two copies of an oscillator chain
 * would be two things to keep in step, which is the failure this repo keeps
 * paying for elsewhere.
 *
 * Nothing here renders. It owns the AudioContext, the filters, the pan and
 * the analyser, and it hands back numbers. That split is not tidiness: the
 * kit's Visualiser takes `values` and draws them, and the README's claim is
 * that an audio graph belongs to the application. This file is the
 * application.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

/* Each track is a set of partials: a frequency multiplier and the wave to
   build it from. Not music, and not pretending to be. They are chosen to look
   different through an analyser, because the analyser is the thing being
   demonstrated and three tracks that all read as one hump demonstrate
   nothing. */
export const TRACKS = [
  { id: 'saw', primary: 'Sawtooth in A', secondary: '0:30',
    type: 'sawtooth', root: 110, partials: [1, 2, 3, 4, 6, 8] },
  { id: 'bell', primary: 'Bell partials', secondary: '0:30',
    type: 'sine', root: 220, partials: [1, 2.76, 5.4, 8.93, 13.34] },
  { id: 'sub', primary: 'Sub and a fifth', secondary: '0:30',
    type: 'triangle', root: 55, partials: [1, 1.5, 3, 4.5] },
];

export const LENGTH = 30;

/** Ten bands, the Winamp spread, an octave apart from 60Hz. */
export const BANDS = [60, 120, 240, 480, 960, 1920, 3840, 7680, 12000, 16000];

/* ?mute, on this page or the page framing it: the capture scripts press play
   to get a live analyser, and the headless browser they drive plays through
   the machine's speakers. The analyser still reads the signal; only what
   reaches the speakers is silenced. */
const muted = () => {
  try {
    return [location, window.top.location].some((l) => new URLSearchParams(l.search).has('mute'));
  } catch {
    return new URLSearchParams(location.search).has('mute');
  }
};
export const bandLabel = (hz) => (hz >= 1000 ? `${Math.round(hz / 100) / 10}k` : `${hz}`);

export const clock = (s) => {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

export function usePlayer({ bands = 20 } = {}) {
  const ref = useRef(null);
  const started = useRef(0);

  const [track, setTrack] = useState(TRACKS[0].id);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [volume, setVolume] = useState(18);
  const [balance, setBalance] = useState(0);
  const [preamp, setPreamp] = useState(0);
  const [eqOn, setEqOn] = useState(true);
  const [loop, setLoop] = useState(true);
  const [gains, setGains] = useState(() => BANDS.map(() => 0));
  const [levels, setLevels] = useState(() => Array(bands).fill(0));

  /* Built lazily, because a context created before a gesture starts
     suspended in every browser and a context nobody resumed is the single
     most common reason a page like this is silent. */
  const build = useCallback(() => {
    if (ref.current) return ref.current;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    /* Ten peaking filters in series. This IS the equaliser: the component
       reports a gain per band and each one lands on a real filter, so the
       sound changes rather than the picture. */
    const filters = BANDS.map((hz) => {
      const f = ctx.createBiquadFilter();
      f.type = 'peaking';
      f.frequency.value = hz;
      f.Q.value = 1.1;
      f.gain.value = 0;
      return f;
    });
    filters.forEach((f, i) => { if (i) filters[i - 1].connect(f); });

    const gain = ctx.createGain();
    gain.gain.value = 0.18;
    const pan = ctx.createStereoPanner();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.78;

    filters[filters.length - 1].connect(gain);
    gain.connect(pan);
    pan.connect(analyser);
    const out = ctx.createGain();
    out.gain.value = muted() ? 0 : 1;
    analyser.connect(out);
    out.connect(ctx.destination);

    ref.current = { ctx, filters, gain, pan, analyser, head: filters[0], voices: [] };
    return ref.current;
  }, []);

  const voices = useCallback((id) => {
    const a = build();
    a.voices.forEach((o) => { try { o.stop(); } catch { /* already stopped */ } });
    const spec = TRACKS.find((t) => t.id === id);
    a.voices = spec.partials.map((mult, i) => {
      const osc = a.ctx.createOscillator();
      osc.type = spec.type;
      osc.frequency.value = spec.root * mult;
      const vg = a.ctx.createGain();
      vg.gain.value = 0.9 / (i + 1);
      osc.connect(vg);
      vg.connect(a.head);
      osc.start();
      return osc;
    });
  }, [build]);

  /* `playing` follows the AudioContext, not the click. resume() is a promise
     and a browser is allowed to refuse it: inside an iframe, or before any
     gesture, it stays suspended. Setting the flag optimistically made the
     transport show a pause button over a display frozen at zero, which is the
     interface telling the reader something untrue about the world. */
  const play = useCallback(async () => {
    const a = build();
    if (!a.voices.length) voices(track);
    try { await a.ctx.resume(); } catch { /* refused; the state check covers it */ }
    if (a.ctx.state !== 'running') { setPlaying(false); return; }
    started.current = a.ctx.currentTime - elapsed;
    setPlaying(true);
  }, [build, voices, track, elapsed]);

  const pause = useCallback(() => {
    if (ref.current) ref.current.ctx.suspend();
    setPlaying(false);
  }, []);

  const stop = useCallback(() => {
    const a = ref.current;
    if (a) {
      a.voices.forEach((o) => { try { o.stop(); } catch { /* already stopped */ } });
      a.voices = [];
      a.ctx.suspend();
    }
    setPlaying(false);
    setElapsed(0);
    setLevels(Array(bands).fill(0));
  }, [bands]);

  const choose = useCallback((id) => {
    setTrack(id);
    setElapsed(0);
    const a = ref.current;
    if (a && playing) { voices(id); started.current = a.ctx.currentTime; }
  }, [playing, voices]);

  /* Winamp's position bar is draggable, so this is a real seek: move the
     origin the clock is measured from rather than the clock itself, or the
     next animation frame recomputes the old value and the thumb springs
     back. */
  const seek = useCallback((seconds) => {
    const a = ref.current;
    const to = Math.max(0, Math.min(LENGTH, seconds));
    if (a) started.current = a.ctx.currentTime - to;
    setElapsed(to);
  }, []);

  const step = useCallback((by) => {
    const at = TRACKS.findIndex((t) => t.id === track);
    choose(TRACKS[(at + by + TRACKS.length) % TRACKS.length].id);
  }, [track, choose]);

  const setBand = useCallback((id, value) => {
    const at = BANDS.findIndex((hz) => String(hz) === id);
    setGains((was) => was.map((g, i) => (i === at ? value : g)));
    const a = ref.current;
    if (a && eqOn) a.filters[at].gain.value = value;
  }, [eqOn]);

  /* Twenty bands out of the 512 the FFT gives, spaced LOGARITHMICALLY between
     40Hz and 16kHz. Slicing the bins into equal groups is the obvious way and
     it is wrong: an FFT is linear in frequency, so at 48kHz the first group
     covers everything to about 1.2kHz and the last ten divide up the hiss
     above 12k. Measured before this changed: cutting a band by 12dB moved the
     picture two percent, because every note in the track was inside bar one.
     Hearing is logarithmic, which is also why the band centres are an octave
     apart. */
  useEffect(() => {
    if (!playing) return undefined;
    const a = ref.current;
    const bins = new Uint8Array(a.analyser.frequencyBinCount);
    const perBin = (a.ctx.sampleRate / 2) / bins.length;
    const edges = Array.from({ length: bands + 1 }, (_, i) =>
      40 * (16000 / 40) ** (i / bands));
    let raf = 0;
    const tick = () => {
      a.analyser.getByteFrequencyData(bins);
      const out = new Array(bands);
      for (let i = 0; i < bands; i += 1) {
        const lo = Math.max(0, Math.floor(edges[i] / perBin));
        const hi = Math.max(lo + 1, Math.min(bins.length, Math.ceil(edges[i + 1] / perBin)));
        let peak = 0;
        for (let j = lo; j < hi; j += 1) if (bins[j] > peak) peak = bins[j];
        out[i] = peak / 255;
      }
      setLevels(out);

      const t = a.ctx.currentTime - started.current;
      if (t >= LENGTH) {
        if (loop) { started.current = a.ctx.currentTime; setElapsed(0); }
        else { stop(); return; }
      } else setElapsed(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, loop, bands, stop]);

  /* Preamp is a second gain in decibels the way Winamp's was: it rides on top
     of the master pot rather than replacing it. */
  useEffect(() => {
    const a = ref.current;
    if (a) a.gain.gain.value = (volume / 100) * 10 ** (preamp / 20);
  }, [volume, preamp]);

  useEffect(() => {
    const a = ref.current;
    if (a) a.pan.pan.value = balance / 100;
  }, [balance]);

  /* ON flattens the ten filters rather than bypassing them: ten filters at 0dB
     is the same signal as no filters, and rewiring the graph on a toggle would
     drop the analyser for a frame. */
  useEffect(() => {
    const a = ref.current;
    if (!a) return;
    a.filters.forEach((f, i) => { f.gain.value = eqOn ? gains[i] : 0; });
  }, [eqOn, gains]);

  const current = TRACKS.find((t) => t.id === track);
  const rate = ref.current ? Math.round(ref.current.ctx.sampleRate / 1000) : 48;

  return {
    track, current, playing, elapsed, levels, rate,
    volume, setVolume, balance, setBalance,
    preamp, setPreamp, eqOn, setEqOn, loop, setLoop,
    gains, setGains, setBand,
    play, pause, stop, choose, step, seek,
  };
}
