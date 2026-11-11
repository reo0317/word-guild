"""Shared helpers for the BGM scripts (quest.py, base.py).

Composition is written explicitly in each song script.  This module only
provides: note/chord parsing, voice leading for pads, humanized MIDI writing,
seamless-loop rendering (FluidSynth -> cut middle pass -> loudnorm -> AAC/MP3),
and numeric checks on both the MIDI data and the rendered audio.

Humanization uses a fixed-seed RNG so that every regeneration is identical.
"""
from __future__ import annotations

import itertools
import json
import math
import os
import re
import subprocess
from dataclasses import dataclass, field

import mido
import numpy as np

SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
SR = 44100
PPQ = 480
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")

# ---------------------------------------------------------------- pitch utils
_PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"]


def pc_of(name: str) -> int:
    pc = _PC[name[0]]
    for ch in name[1:]:
        pc += 1 if ch == "#" else -1 if ch == "b" else 0
    return pc % 12


def midi_of(note: str) -> int:
    m = re.fullmatch(r"([A-G][#b]?)(-?\d)", note)
    if not m:
        raise ValueError(note)
    return pc_of(m.group(1)) + 12 * (int(m.group(2)) + 1)


def name_of(p: int) -> str:
    return f"{NAMES[p % 12]}{p // 12 - 1}"


# chord quality -> intervals above root (first = root)
QUALITIES = {
    "": (0, 4, 7), "m": (0, 3, 7), "7": (0, 4, 7, 10), "m7": (0, 3, 7, 10),
    "maj7": (0, 4, 7, 11), "sus4": (0, 5, 7), "7sus4": (0, 5, 7, 10),
    "add9": (0, 4, 7, 2), "6": (0, 4, 7, 9), "m6": (0, 3, 7, 9),
}


@dataclass
class Chord:
    symbol: str
    root: int          # pitch class
    pcs: tuple         # chord pitch classes, root first
    bass: int          # pitch class of bass note
    third: int | None
    seventh: int | None

    @property
    def fifth(self) -> int:
        return (self.root + 7) % 12


def chord(symbol: str) -> Chord:
    m = re.fullmatch(r"([A-G][#b]?)(maj7|m7|m6|7sus4|sus4|add9|m|7|6)?(?:/([A-G][#b]?))?", symbol)
    if not m:
        raise ValueError(symbol)
    root = pc_of(m.group(1))
    q = m.group(2) or ""
    ivs = QUALITIES[q]
    pcs = tuple((root + i) % 12 for i in ivs)
    bass = pc_of(m.group(3)) if m.group(3) else root
    third = next(((root + i) % 12 for i in ivs if i in (3, 4)), None)
    seventh = next(((root + i) % 12 for i in ivs if i in (10, 11)), None)
    return Chord(symbol, root, pcs, bass, third, seventh)


def parse_progression(bars: list[str], beats_per_bar: int):
    """'A7sus4 A7' -> two chords splitting the bar evenly. Returns
    list of (start_beat, dur_beats, Chord)."""
    out = []
    for i, bar in enumerate(bars):
        syms = bar.split()
        d = beats_per_bar / len(syms)
        for k, s in enumerate(syms):
            out.append((i * beats_per_bar + k * d, d, chord(s)))
    return out


def parse_line(bars: list[str], beats_per_bar: int, transpose: int = 0):
    """Melody notation: 'F#5:.5 A5:.5 D6:1 r:2' per bar.  A trailing '~' on a
    note ties it into the first note of the next bar (same pitch).
    Returns list of (start_beat, dur, pitch)."""
    notes = []
    t = 0.0
    tie = False
    for bi, bar in enumerate(bars):
        bar_t = 0.0
        for tok in bar.split():
            n, d = tok.split(":")
            tied_next = n.endswith("~")
            n = n.rstrip("~")
            d = float(d)
            if n != "r":
                p = midi_of(n) + transpose
                if tie and notes and notes[-1][2] == p:
                    s, od, _ = notes[-1]
                    notes[-1] = (s, od + d, p)
                else:
                    notes.append((t + bar_t, d, p))
            tie = tied_next
            bar_t += d
        if abs(bar_t - beats_per_bar) > 1e-6:
            raise ValueError(f"bar {bi + 1} has {bar_t} beats: {bar}")
        t += beats_per_bar
    return notes


def voice_lead(ch: Chord, prev: list[int] | None, n: int, lo: int, hi: int,
               avoid: set[int] = frozenset(), top_max: int | None = None) -> list[int]:
    """Choose an n-note voicing of `ch` within [lo, hi] minimizing movement
    from `prev`.  Requires the 3rd (and 7th if any); avoids semitone/minor-9th
    rubs against pitch classes in `avoid` (melody notes on strong beats);
    avoids adjacent voices closer than a whole tone except the 7th-root rub."""
    must = {x for x in (ch.third, ch.seventh) if x is not None}
    usable_pcs = [pc for pc in ch.pcs if not any((pc - a) % 12 in (1, 11) for a in avoid)]
    if len(set(usable_pcs) | must) < 3 or not must.issubset(usable_pcs):
        usable_pcs = list(ch.pcs)
    cands = [p for p in range(lo, hi + 1) if p % 12 in usable_pcs]
    if top_max is not None:
        cands = [p for p in cands if p <= top_max] or cands
    best, best_cost = None, 1e9
    for combo in itertools.combinations(cands, n):
        pcs = [p % 12 for p in combo]
        if not must.issubset(pcs):
            continue
        if ch.third is not None and pcs.count(ch.third) > 1:
            continue
        gaps = [b - a for a, b in zip(combo, combo[1:])]
        if any(g < 2 for g in gaps) or any(g > 9 for g in gaps):
            continue
        if len(set(pcs)) < min(n, len(set(ch.pcs))):
            continue
        if prev:
            cost = sum(abs(a - b) for a, b in zip(combo, prev))
        else:
            cost = abs(sum(combo) / n - (lo + hi) / 2) * n * 0.5
        cost += 0.5 * (combo[-1] - combo[0]) / 12  # prefer compact
        if cost < best_cost:
            best, best_cost = list(combo), cost
    if best is None:
        raise RuntimeError(f"no voicing for {ch.symbol}")
    return best


def nearest(pc: int, ref: int, lo: int, hi: int) -> int:
    """Pitch with class pc nearest to ref, kept inside [lo, hi]."""
    opts = [p for p in range(lo, hi + 1) if p % 12 == pc]
    return min(opts, key=lambda p: (abs(p - ref), p))


# ---------------------------------------------------------------- song model
@dataclass
class Note:
    start: float
    dur: float
    pitch: int
    vel: int
    jitter: float = 0.006   # seconds (std of timing deviation)
    lag: float = 0.0        # seconds, systematic push (+late)


@dataclass
class Track:
    name: str
    channel: int
    program: int
    pan: int = 64
    reverb: int = 50
    bank: int = 0
    role: str = "inst"            # 'melody', 'bass', 'drums', 'inst'
    range: tuple = (0, 127)
    notes: list = field(default_factory=list)
    ccs: list = field(default_factory=list)   # (beat, cc, value)

    def note(self, start, dur, pitch, vel, jitter=0.006, lag=0.0):
        self.notes.append(Note(start, dur, int(pitch), int(max(1, min(127, vel))), jitter, lag))

    def cc(self, beat, num, value):
        self.ccs.append((beat, num, int(max(0, min(127, round(value))))))

    def ramp(self, b0, b1, v0, v1, num=11, step=0.25):
        n = max(1, int(round((b1 - b0) / step)))
        for i in range(n + 1):
            # smooth (cosine) ramp
            x = i / n
            y = v0 + (v1 - v0) * (0.5 - 0.5 * math.cos(math.pi * x))
            self.cc(b0 + (b1 - b0) * x, num, y)


@dataclass
class Song:
    name: str
    bpm: float
    bars: int
    beats_per_bar: int = 4
    tracks: list = field(default_factory=list)
    seed: int = 7
    sections: list = field(default_factory=list)  # (name, start_bar, n_bars)

    @property
    def loop_beats(self):
        return self.bars * self.beats_per_bar

    @property
    def sec_per_beat(self):
        return 60.0 / self.bpm

    def track(self, *a, **k) -> Track:
        t = Track(*a, **k)
        self.tracks.append(t)
        return t

    # ------------------------------------------------------------ MIDI out
    def _humanized(self):
        """Fixed per-event deviations, so every loop pass is identical."""
        rng = np.random.default_rng(self.seed)
        spb = self.sec_per_beat
        res = []
        for tr in self.tracks:
            ev = []
            for n in sorted(tr.notes, key=lambda n: (n.start, n.pitch)):
                dt = float(np.clip(rng.normal(0, n.jitter), -2.5 * n.jitter, 2.5 * n.jitter)) + n.lag
                dv = int(round(rng.normal(0, 2.5)))
                on = n.start + dt / spb
                off = n.start + n.dur + dt / spb
                ev.append([on, off, n.pitch, max(1, min(127, n.vel + dv))])
            res.append((tr, ev))
        return res

    def write_midi(self, path, passes=1, pre_beats=0.0, tail_beats=0.0):
        mid = mido.MidiFile(type=1, ticks_per_beat=PPQ)
        meta = mido.MidiTrack()
        mid.tracks.append(meta)
        meta.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(self.bpm), time=0))
        meta.append(mido.MetaMessage("time_signature", numerator=self.beats_per_bar, denominator=4, time=0))
        for name, b0, nb in self.sections:
            for p in range(passes):
                t = int(round((pre_beats + p * self.loop_beats + b0 * self.beats_per_bar) * PPQ))
                meta.append(mido.MetaMessage("marker", text=name, time=t))
        meta.sort(key=lambda m: m.time)
        end_tick = int(round((pre_beats + passes * self.loop_beats + tail_beats) * PPQ))
        meta.append(mido.MetaMessage("end_of_track", time=end_tick))
        _to_delta(meta)

        L = self.loop_beats
        for tr, ev in self._humanized():
            mt = mido.MidiTrack()
            mt.append(mido.MetaMessage("track_name", name=tr.name, time=0))
            msgs = []
            ch = tr.channel
            if tr.bank:
                msgs.append((0, 0, mido.Message("control_change", channel=ch, control=0, value=tr.bank)))
            msgs += [
                (0, 1, mido.Message("program_change", channel=ch, program=tr.program)),
                (0, 2, mido.Message("control_change", channel=ch, control=7, value=100)),
                (0, 2, mido.Message("control_change", channel=ch, control=10, value=tr.pan)),
                (0, 2, mido.Message("control_change", channel=ch, control=91, value=tr.reverb)),
                (0, 2, mido.Message("control_change", channel=ch, control=93, value=0)),
            ]
            # notes for all passes, then fix same-pitch overlaps
            allnotes = []
            for p in range(passes):
                off0 = pre_beats + p * L
                for on, off, pitch, vel in ev:
                    allnotes.append([on + off0, off + off0, pitch, vel])
            allnotes.sort()
            last = {}
            for n in allnotes:
                prev = last.get(n[2])
                if prev is not None and prev[1] > n[0] - 0.01:
                    prev[1] = max(prev[0] + 0.05, n[0] - 0.01)
                last[n[2]] = n
            for on, off, pitch, vel in allnotes:
                msgs.append((int(round(on * PPQ)), 5, mido.Message("note_on", channel=ch, note=pitch, velocity=vel)))
                msgs.append((int(round(off * PPQ)), 3, mido.Message("note_off", channel=ch, note=pitch, velocity=0)))
            for p in range(passes):
                off0 = pre_beats + p * L
                for beat, num, val in tr.ccs:
                    msgs.append((int(round((beat + off0) * PPQ)), 4,
                                 mido.Message("control_change", channel=ch, control=num, value=val)))
            msgs.sort(key=lambda x: (x[0], x[1]))
            for t, _, m in msgs:
                m.time = max(0, t)
                mt.append(m)
            _to_delta(mt)
            mid.tracks.append(mt)
        mid.save(path)
        return path

    # ------------------------------------------------------------ render
    def render(self, out_dir=OUT_DIR, work_dir=None, lufs=-14.0, tp=-1.5):
        os.makedirs(out_dir, exist_ok=True)
        work = work_dir or os.path.join(out_dir, "_work")
        os.makedirs(work, exist_ok=True)
        base = os.path.join(out_dir, self.name)
        # 1) editable single-loop MIDI
        self.write_midi(base + ".mid", passes=1)
        # 2) three passes; we keep the middle one so that both its start
        #    (reverb tails from pass 1) and its end (pass 3 follows) are
        #    exactly what the looped file will play.
        pre = self.beats_per_bar
        render_mid = os.path.join(work, self.name + "_x3.mid")
        self.write_midi(render_mid, passes=3, pre_beats=pre, tail_beats=2 * self.beats_per_bar)
        raw_wav = os.path.join(work, self.name + "_x3.wav")
        _run(["fluidsynth", "-ni", "-q", "-g", "0.35", "-r", str(SR), "-C", "0", "-R", "1",
              "-o", "synth.reverb.room-size=0.62", "-o", "synth.reverb.damp=0.35",
              "-o", "synth.reverb.width=0.9", "-o", "synth.reverb.level=0.8",
              "-o", "synth.polyphony=512",
              "-T", "wav", "-O", "float", "-F", raw_wav, SF2, render_mid])
        x = _read_audio(raw_wav)
        spb = SR * self.sec_per_beat
        L = int(round(self.loop_beats * spb))
        s0 = int(round(pre * spb)) + L
        # gentle peak control on the WHOLE three-pass render (so the
        # limiter's state is continuous across the cut points): bring the
        # middle pass near the target loudness, then limit 2-3 dB of
        # transient peaks.  loudnorm afterwards only applies a fixed gain.
        mid_path = os.path.join(work, self.name + "_mid.f32")
        x[s0:s0 + L].astype("<f4").tofile(mid_path)
        m0 = _loudnorm_json(_run(["ffmpeg", "-hide_banner", "-nostats", "-f", "f32le", "-ar", str(SR), "-ac", "2",
                                  "-i", mid_path, "-af", "loudnorm=print_format=json", "-f", "null", "-"]))
        gain = 10 ** ((lufs + 0.3 - float(m0["input_i"])) / 20)
        full_path = os.path.join(work, self.name + "_x3.f32")
        (x * gain).astype("<f4").tofile(full_path)
        lim = 10 ** ((tp - 1.0) / 20)
        rawlim = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-f", "f32le", "-ar", str(SR),
                                 "-ac", "2", "-i", full_path, "-af",
                                 f"alimiter=limit={lim:.4f}:attack=4:release=80:level=false:latency=true",
                                 "-f", "f32le", "-"], capture_output=True, check=True).stdout
        x = np.frombuffer(rawlim, dtype="<f4").reshape(-1, 2)
        seg = x[s0:s0 + L]
        # seam continuity: the sample that would follow seg[-1] in the
        # through-composed render vs. seg[0] that the loop actually plays
        seam = {
            "period_err_max": float(np.max(np.abs(x[s0:s0 + SR] - x[s0 + L:s0 + L + SR]))),
            "limiter_gain_db": round(20 * math.log10(gain), 2),
            "peak_after_limiter": round(float(np.max(np.abs(seg))), 4),
        }
        seg_path = os.path.join(work, self.name + "_loop.f32")
        seg.astype("<f4").tofile(seg_path)
        # 3) loudnorm (two-pass, linear so the loop seam stays intact)
        inp = ["-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", seg_path]
        flt = f"loudnorm=I={lufs}:TP={tp}:LRA=20"
        meas = _loudnorm_json(_run(["ffmpeg", "-hide_banner", "-nostats", *inp, "-af", flt + ":print_format=json",
                                     "-f", "null", "-"]))
        flt2 = (f"{flt}:measured_I={meas['input_i']}:measured_TP={meas['input_tp']}:"
                f"measured_LRA={meas['input_lra']}:measured_thresh={meas['input_thresh']}:"
                f"offset={meas['target_offset']}:linear=true:print_format=json")
        master = base + "_master.wav"
        res2 = _loudnorm_json(_run(["ffmpeg", "-hide_banner", "-nostats", "-y", *inp, "-af", flt2,
                                    "-ar", str(SR), "-c:a", "pcm_s16le", master]))
        _run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", master,
              "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", base + ".m4a"])
        _run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", master,
              "-c:a", "libmp3lame", "-b:a", "192k", base + ".mp3"])
        return {"loop_samples": L, "seam": seam, "loudnorm_type": res2.get("normalization_type"),
                "files": [base + ".mid", master, base + ".m4a", base + ".mp3"]}


def _to_delta(track):
    t = 0
    for m in track:
        a = m.time
        m.time = a - t
        t = a


def _run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(" ".join(cmd) + "\n" + p.stderr[-3000:])
    return p.stderr + p.stdout


def _loudnorm_json(text):
    i = text.rfind("{")
    return json.loads(text[i:text.rfind("}") + 1])


def _read_audio(path):
    raw = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", path,
                          "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype="<f4").reshape(-1, 2)


# ---------------------------------------------------------------- checks
def audio_report(path):
    x = _read_audio(path)
    out = _run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"])
    I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", out)[-1])
    TPk = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", out)[-1])
    d = np.abs(np.diff(x, axis=0))
    seam_jump = float(np.max(np.abs(x[0] - x[-1])))
    return {
        "file": os.path.basename(path), "seconds": round(len(x) / SR, 3),
        "sample_peak_dbfs": round(20 * math.log10(float(np.max(np.abs(x))) + 1e-12), 2),
        "true_peak_dbfs": TPk, "lufs_i": I,
        "seam_jump": round(seam_jump, 5),
        "median_step": round(float(np.median(d)), 5),
        "p99_step": round(float(np.percentile(d, 99)), 5),
        "max_step": round(float(np.max(d)), 5),
        "clipped_samples": int(np.sum(np.abs(x) >= 0.9999)),
    }


def midi_report(song: Song):
    """Range check per track; strong-beat melody/bass m2/M7 check; and
    a count of semitone rubs between the melody and any other pitched part
    at note onsets on strong beats."""
    bpb = song.beats_per_bar
    strong = [0, 2] if bpb == 4 else [0]
    lines = []
    ok = True
    for tr in song.tracks:
        if tr.role == "drums" or not tr.notes:
            continue
        lo = min(n.pitch for n in tr.notes)
        hi = max(n.pitch for n in tr.notes)
        flag = "" if tr.range[0] <= lo and hi <= tr.range[1] else "  <-- OUT OF RANGE"
        ok &= not flag
        lines.append(f"  {tr.name:<10} {name_of(lo):>4}-{name_of(hi):<4} (allowed {name_of(tr.range[0])}-{name_of(tr.range[1])}){flag}")

    def sounding(tr, beat):
        # ignore a note that merely overlaps (legato/ring) for <0.1 beat
        return [n.pitch for n in tr.notes if n.start <= beat + 1e-6 < n.start + n.dur - 0.1]

    melodies = [t for t in song.tracks if t.role == "melody"]
    bass = [t for t in song.tracks if t.role == "bass"]
    others = [t for t in song.tracks if t.role not in ("drums",)]
    bad_mb, rubs, checked = [], [], 0
    for bar in range(song.bars):
        for sb in strong:
            beat = bar * bpb + sb
            mel = [p for t in melodies for p in sounding(t, beat)]
            bs = [p for t in bass for p in sounding(t, beat)]
            for m in mel:
                for b in bs:
                    checked += 1
                    if (m - b) % 12 in (1, 11):
                        bad_mb.append(f"bar {bar + 1} beat {sb + 1}: {name_of(m)} vs bass {name_of(b)}")
                for t in others:
                    if t in melodies:
                        continue
                    for p in sounding(t, beat):
                        if (m - p) % 12 in (1, 11) and abs(m - p) < 24:
                            rubs.append(f"bar {bar + 1} b{sb + 1}: {name_of(m)} vs {t.name} {name_of(p)}")
    ok &= not bad_mb
    lines.append(f"  melody/bass strong-beat pairs checked: {checked}, m2/M7 violations: {len(bad_mb)}")
    lines += ["    " + s for s in bad_mb]
    lines.append(f"  melody vs other parts, semitone rubs on strong beats: {len(rubs)}")
    lines += ["    " + s for s in rubs[:12]]
    mel_beats = sum(n.dur for t in melodies for n in t.notes)
    bars_with = len({int(n.start // bpb) for t in melodies for n in t.notes})
    lines.append(f"  melody present in {bars_with}/{song.bars} bars ({mel_beats / song.loop_beats:.0%} of time sounding)")
    return ok, "\n".join(lines)


# ---------------------------------------------------------------- performance helpers
def metric(beat_in_bar: float, bpb: int = 4) -> float:
    """Metric weight: downbeat 1.0, mid-bar 0.6, other beats 0.4, 8ths 0.2, else 0.1."""
    b = round(beat_in_bar * 4) / 4
    if b == 0:
        return 1.0
    if bpb == 4 and b == 2:
        return 0.6
    if b == int(b):
        return 0.4
    if b * 2 == int(b * 2):
        return 0.2
    return 0.1


def add_line(track: Track, notes, offset_beats, base_vel, bpb=4, legato=0.94,
             jitter=0.008, lag=0.0, contour=0.7, accent=10):
    """Add a parsed line (start, dur, pitch) with metric accents and a pitch
    contour (higher notes a little louder, as players naturally do)."""
    if not notes:
        return
    mean = sum(p for _, _, p in notes) / len(notes)
    for s, d, p in notes:
        v = base_vel + accent * metric(s % bpb, bpb) + contour * (p - mean)
        dur = d * legato if d < 1.5 else d - 0.12
        track.note(offset_beats + s, dur, p, v, jitter=jitter, lag=lag)


def phrase_arcs(track: Track, start, beats, lo, hi, phrase=8.0, end=None):
    """CC11 arcs: swell into the middle of each phrase, ease off at its end."""
    t = start
    while t < start + beats - 1e-6:
        L = min(phrase, start + beats - t)
        track.ramp(t, t + L * 0.6, lo, hi)
        track.ramp(t + L * 0.6, t + L, hi, end if (end is not None and t + L >= start + beats - 1e-6) else lo + 4)
        t += L


def scale_step(pc_target: int, scale: list[int], from_below: bool) -> int:
    """Diatonic neighbour of pc_target (one scale step below/above)."""
    s = sorted(scale)
    if pc_target in s:
        i = s.index(pc_target)
        return s[(i - 1) % len(s)] if from_below else s[(i + 1) % len(s)]
    return (pc_target - 1) % 12 if from_below else (pc_target + 1) % 12
