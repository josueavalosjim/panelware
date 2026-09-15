/**
 * The demo player's music: three short loops, synthesised, no audio files.
 *
 * The first version was three drones: stacks of oscillators started once
 * and left running. A stack of six sawtooths sounds like static, and with
 * the equaliser boosting it the sum clipped. These are notes instead, each
 * with an attack and a release, on a chord loop in A minor at 96 bpm, and
 * they are scheduled a quarter second ahead against the audio clock, so a
 * suspended context (pause) stops them where they are and resumes them in
 * time.
 *
 * Every loop keeps something in the low, middle, and high bands, so any
 * equaliser band you drag changes something you can hear.
 */

export const TRACKS = [
  { id: 'pad', primary: 'Glass pad', secondary: '0:30' },
  { id: 'arp', primary: 'Arpeggio in A', secondary: '0:30' },
  { id: 'bells', primary: 'Bass and bells', secondary: '0:30' },
];

const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

/* Am, F, C, G. Triads near middle C, and a root two octaves down. */
const CHORDS = [
  { notes: [57, 60, 64], root: 45 },
  { notes: [53, 57, 60], root: 41 },
  { notes: [55, 60, 64], root: 48 },
  { notes: [55, 59, 62], root: 43 },
];

/* An eighth note at 96 bpm. Eight to a bar, thirty-two to the loop. */
const STEP = 60 / 96 / 2;

/* A soft pluck: a fundamental and a few quiet overtones, so it has some
   edge for the top bands without the buzz of a sawtooth. */
let pluckWave;
const pluck = (ctx) => {
  pluckWave ??= ctx.createPeriodicWave(
    new Float32Array([0, 0, 0, 0, 0]),
    new Float32Array([0, 1, 0.35, 0.12, 0.05]),
  );
  return pluckWave;
};

function note(ctx, dest, live, { freq, t, dur, peak, attack = 0.005, release = 0.3, type, wave }) {
  const osc = ctx.createOscillator();
  if (wave) osc.setPeriodicWave(wave);
  else osc.type = type;
  osc.frequency.value = freq;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(peak, t + attack);
  env.gain.setValueAtTime(peak, t + Math.max(attack, dur));
  env.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(attack, dur) + release);
  osc.connect(env);
  env.connect(dest);
  osc.start(t);
  osc.stop(t + Math.max(attack, dur) + release + 0.05);
  live.add(osc);
  osc.onended = () => live.delete(osc);
}

/* What each loop plays on step `i`, starting at time `t`. */
const SONGS = {
  pad(ctx, dest, live, i, t) {
    if (i % 8 !== 0) return;
    const c = CHORDS[(i / 8) % 4];
    const bar = STEP * 8;
    for (const m of c.notes) {
      note(ctx, dest, live, { freq: hz(m), t, dur: bar, peak: 0.07, attack: 0.5, release: 1.2, type: 'triangle' });
    }
    note(ctx, dest, live, { freq: hz(c.root), t, dur: bar, peak: 0.16, attack: 0.08, release: 0.6, type: 'sine' });
    note(ctx, dest, live, { freq: hz(c.notes[2] + 24), t: t + STEP * 4, dur: STEP * 2, peak: 0.025, attack: 0.02, release: 1.4, type: 'sine' });
  },

  arp(ctx, dest, live, i, t) {
    const c = CHORDS[Math.floor(i / 8) % 4];
    const up = [...c.notes, c.notes[0] + 12];
    const pattern = [0, 1, 2, 3, 2, 1, 2, 3];
    note(ctx, dest, live, { freq: hz(up[pattern[i % 8]] + 12), t, dur: 0.02, peak: 0.09, release: 0.35, wave: pluck(ctx) });
    if (i % 4 === 0) {
      note(ctx, dest, live, { freq: hz(c.root), t, dur: STEP * 3, peak: 0.16, attack: 0.01, release: 0.25, type: 'sine' });
    }
  },

  bells(ctx, dest, live, i, t) {
    const c = CHORDS[Math.floor(i / 8) % 4];
    if (i % 2 === 0) {
      const walk = [0, 0, 7, 12][(i / 2) % 4];
      note(ctx, dest, live, { freq: hz(c.root + walk), t, dur: STEP * 1.5, peak: 0.18, attack: 0.01, release: 0.2, type: 'sine' });
    }
    if (i % 4 === 2) {
      const f = hz(c.notes[(i / 4) % 3 | 0] + 12);
      note(ctx, dest, live, { freq: f, t, dur: 0.01, peak: 0.06, release: 1.1, type: 'sine' });
      note(ctx, dest, live, { freq: f * 2.76, t, dur: 0.01, peak: 0.015, release: 0.5, type: 'sine' });
    }
  },
};

/**
 * Starts a loop into `dest` and returns a handle whose stop() silences it.
 * The handle stands in for the oscillators the players used to keep, so a
 * player that stops everything in its voices list still works.
 */
export function playTrack(ctx, dest, id) {
  const song = SONGS[id] ?? SONGS.pad;
  const live = new Set();
  let step = 0;
  let next = ctx.currentTime + 0.05;
  const schedule = () => {
    while (next < ctx.currentTime + 0.25) {
      song(ctx, dest, live, step % 32, next);
      next += STEP;
      step += 1;
    }
  };
  schedule();
  const timer = setInterval(schedule, 50);
  return {
    stop() {
      clearInterval(timer);
      for (const osc of live) { try { osc.stop(); } catch { /* already stopped */ } }
      live.clear();
    },
  };
}

/* Sits between the equaliser and the volume, so a band boosted 12dB into a
   loud passage is levelled rather than clipped. */
export function limiter(ctx) {
  const c = ctx.createDynamicsCompressor();
  c.threshold.value = -14;
  c.knee.value = 8;
  c.ratio.value = 6;
  c.attack.value = 0.005;
  c.release.value = 0.2;
  return c;
}
