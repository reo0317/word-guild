"""Base / home BGM (progress screen, departing for the next quest).

F major, 83 1/3 BPM (0.72 s per beat), 4/4, 28 bars = 80.64 s per loop.
(This tempo makes the loop a whole number of microseconds, milliseconds,
samples and 64-sample synth blocks, so every rendered pass is identical.)

Form (bars):  A 8 | A' 8 | B 8 | Codetta 4  -> back to A
  A       F  Am7  Bbmaj7  C  Dm7  Bb  Gm7  C7sus4-C7
          piano sings the motif: a rising 4th (C-F) into a dotted step
          (F-G-A), i.e. 'stepping out of the door'; harp flourishes fill
          the phrase ends.
  A'      F  Am7  Bbmaj7  Gm7-C  Dm7  Bb-C  F  F7
          same tune an octave lower on French horn (the 'proud' colour),
          now closing on an authentic cadence; F7 tips into B (IV).
  B       Bb  C  Am7  Dm7  Gm7  A7  Dm7-G7  Gm7/C-C7
          strings take a broader line that climbs to D6 and C#6 (A7 = V/vi);
          horn moves to a guide-tone counter-line (3rds/7ths, mostly steps).
  Codetta Bbmaj7  F/A  Gm7  C7sus4-C7
          melody rests; piano broken chords and harp; C7 resolves to F at
          the loop start.
Run:  python3 tools/music/base.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import (Song, add_line, audio_report, chord, metric, midi_report, nearest,  # noqa: E402
                    parse_line, parse_progression, phrase_arcs, scale_step, voice_lead)

BPB = 4
SCALE = [5, 7, 9, 10, 0, 2, 4]  # F major
SECTIONS = [("A", 0, 8), ("A'", 8, 8), ("B", 16, 8), ("Codetta", 24, 4)]

CHORDS = (
    ["F", "Am7", "Bbmaj7", "C", "Dm7", "Bb", "Gm7", "C7sus4 C7"]
    + ["F", "Am7", "Bbmaj7", "Gm7 C", "Dm7", "Bb C", "F", "F7"]
    + ["Bb", "C", "Am7", "Dm7", "Gm7", "A7", "Dm7 G7", "Gm7/C C7"]
    + ["Bbmaj7", "F/A", "Gm7", "C7sus4 C7"]
)

A_MEL = [
    "C5:1 F5:1.5 G5:.5 A5:1",        # motif: 4th up, dotted step up
    "G5:1.5 E5:.5 C5:2",             # answer: falling
    "D5:1 F5:1.5 G5:.5 A5:1",        # motif from D (on IV)
    "G5:3 r:1",                      # half cadence, harp fills
    "A5:1 D6:1.5 C6:.5 A5:1",        # motif widened (4th A-D) on ii
    "Bb5:1.5 A5:.5 F5:2",
    "G5:1 Bb5:1 D6:1 C6:.5 Bb5:.5",
    "G5:1.5 F5:.5 E5:1 r:1",         # leading back (C7)
]
A2_MEL = [  # horn, an octave lower, new cadence
    "C4:1 F4:1.5 G4:.5 A4:1",
    "G4:1.5 E4:.5 C4:2",
    "D4:1 F4:1.5 G4:.5 A4:1",
    "G4:3 r:1",
    "A4:1 D5:1.5 C5:.5 A4:1",
    "Bb4:1.5 C5:.5 D5:1 E5:1",       # rising through Bb-C
    "F5:2 C5:1 A4:1",                # arrival on the tonic
    "A4:1 C5:1 Eb5:2",               # F7: b7 pulls to Bb
]
B_MEL = [
    "D5:1 F5:1 Bb5:2",
    "G5:1.5 A5:.5 G5:1 E5:1",
    "C6:1.5 A5:.5 E5:2",
    "F5:1 A5:1 D6:2",
    "D6:1.5 C6:.5 Bb5:1 G5:1",
    "C#6:2 A5:1 E5:1",
    "F5:1 A5:1 B5:1 D6:1",
    "C6:2 Bb5:1 G5:1",
]
B_HORN = ["F4:2 D4:2", "E4~:4", "E4:2 G4:2", "F4:2 A4:2",
          "Bb4:2 F4:2", "G4:2 E4:2", "F4:4", "F4:2 E4:2"]

SEC_DYN = {"A": 0.9, "A'": 1.0, "B": 1.08, "Codetta": 0.88}


def section_of(bar):
    for name, b0, n in SECTIONS:
        if b0 <= bar < b0 + n:
            return name


def build():
    song = Song("base", bpm=250 / 3, bars=28, beats_per_bar=BPB, seed=5, sections=SECTIONS)
    piano = song.track("Piano", 0, 0, pan=60, reverb=58, role="melody", range=(21, 108))
    horn = song.track("Horn", 1, 60, pan=50, reverb=70, role="melody", range=(41, 77))
    vlns = song.track("Strings", 2, 48, pan=74, reverb=72, role="melody", range=(55, 96))
    pad = song.track("SlowStr", 3, 49, pan=60, reverb=78, range=(36, 96))
    guitar = song.track("Guitar", 4, 24, pan=36, reverb=52, range=(40, 83))
    comp = song.track("PianoComp", 5, 0, pan=76, reverb=60, range=(36, 96))
    harp = song.track("Harp", 6, 46, pan=92, reverb=66, range=(24, 103))
    bass = song.track("Bass", 7, 32, pan=64, reverb=30, role="bass", range=(28, 55))
    hcount = song.track("HornCtr", 8, 60, pan=44, reverb=70, range=(41, 77))
    drums = song.track("Drums", 9, 40, pan=64, reverb=40, role="drums")

    prog = parse_progression(CHORDS, BPB)

    def place(track, bars, start_bar, vel, **kw):
        notes = parse_line(bars, BPB)
        add_line(track, notes, start_bar * BPB, vel, **kw)
        return [(s + start_bar * BPB, d, p) for s, d, p in notes]

    mel = []
    mel += place(piano, A_MEL, 0, 100, jitter=0.010, lag=0.004, legato=1.0)
    mel += place(horn, A2_MEL, 8, 80, lag=0.008)
    mel += place(vlns, B_MEL, 16, 96, lag=0.010, legato=0.98)
    place(hcount, B_HORN, 16, 52, legato=0.98, contour=0.3, accent=5)

    piano.cc(0, 11, 120)
    horn.cc(0, 11, 92)
    phrase_arcs(horn, 8 * BPB, 8 * BPB, 90, 112, end=92)
    vlns.cc(0, 11, 90)
    phrase_arcs(vlns, 16 * BPB, 8 * BPB, 88, 116, end=90)
    hcount.cc(0, 11, 80)
    phrase_arcs(hcount, 16 * BPB, 8 * BPB, 78, 98, end=80)

    def mel_at(t0, t1):
        return [p for s, d, p in mel if s < t1 and s + d > t0]

    def strong_pcs(t0, t1):
        return {p % 12 for s, d, p in mel
                if s < t1 and s + d > t0 and metric((s if s >= t0 else t0) % BPB) >= 0.6}

    # ---------------- slow-strings pad
    prev = None
    for start, dur, ch in prog:
        m = mel_at(start, start + dur)
        v = voice_lead(ch, prev, 4, 48, 72, avoid=strong_pcs(start, start + dur),
                       top_max=(min(m) - 3) if m else None)
        prev = v
        sec = section_of(int(start // BPB))
        for p in v:
            pad.note(start, dur + 0.05, p, 56 * SEC_DYN[sec], jitter=0.012)
    pad.cc(0, 11, 64)
    pad.ramp(0, 8 * BPB, 64, 80, step=1)
    pad.ramp(8 * BPB, 16 * BPB, 80, 86, step=1)
    for b in range(16, 24, 2):
        pad.ramp(b * BPB, b * BPB + 4, 80, 92)
        pad.ramp(b * BPB + 4, b * BPB + 8, 92, 82)
    pad.ramp(24 * BPB, 26 * BPB, 86, 94)
    pad.ramp(26 * BPB, 28 * BPB, 94, 64)   # back to the A level for the loop

    # ---------------- nylon guitar fingerpicking (8ths, let ring)
    prev = None
    patt = [0, 2, 3, 2, 1, 2, 3, 2]
    for start, dur, ch in prog:
        bar = int(start // BPB)
        sec = section_of(bar)
        if sec == "Codetta":
            prev = None
            continue
        v = voice_lead(ch, prev, 4, 52, 70, avoid=strong_pcs(start, start + dur))
        prev = v
        for j in range(int(dur * 2)):
            t = start + j * 0.5
            vel = (40 + 16 * metric(t % BPB)) * SEC_DYN[sec]
            guitar.note(t, min(1.0, start + dur - t), v[patt[int((t % BPB) * 2)]], vel, jitter=0.006)
    guitar.cc(0, 11, 96)

    # ---------------- piano comp (A', B: half-note chords; Codetta: broken chords)
    prev = None
    for start, dur, ch in prog:
        bar = int(start // BPB)
        sec = section_of(bar)
        if sec == "A":
            continue
        if sec == "Codetta":
            tones = sorted(p for p in range(53, 86) if p % 12 in ch.pcs)
            r = [p for p in tones if p % 12 == ch.bass][0]
            up = [p for p in tones if p >= r][:5]
            shape = up + up[-2:0:-1]
            for j in range(int(dur * 2)):
                t = start + j * 0.5
                comp.note(t, 0.9, shape[j % len(shape)], 44 + 14 * metric(t % BPB), jitter=0.008)
            continue
        m = mel_at(start, start + dur)
        v = voice_lead(ch, prev, 4, 53, 74, avoid=strong_pcs(start, start + dur),
                       top_max=(min(m) - 3) if m else None)
        prev = v
        k = SEC_DYN[sec]
        for h in range(int(dur // 2)):
            for i, p in enumerate(v):
                # small spread (rolled a touch, low to high)
                comp.note(start + h * 2 + i * 0.015, 1.9, p, (46 + (6 if h == 0 else 0)) * k, jitter=0.006)
    comp.cc(0, 11, 100)

    # ---------------- harp: phrase-end flourishes and Codetta rolls
    for bar, ch_sym in ((3, "C"), (7, "C7"), (11, "C")):
        ch = chord(ch_sym)
        tones = sorted(p for p in range(70, 92) if p % 12 in ch.pcs)[:4]
        for j, p in enumerate(tones):
            t = bar * BPB + 3 + j * 0.25
            harp.note(t, 1.0 - j * 0.25, p, 62 + 4 * j, jitter=0.003)
    for bar in (24, 26):
        start, dur, ch = next(x for x in prog if x[0] == bar * BPB)
        tones = sorted(p for p in range(41, 80) if p % 12 in ch.pcs)
        for j, p in enumerate(tones):
            harp.note(bar * BPB + j * 0.08, 3.6 - j * 0.08, p, 48 + 2 * j, jitter=0.002)
    harp.cc(0, 11, 100)

    # ---------------- bass
    bass_prev = 41
    for i, (start, dur, ch) in enumerate(prog):
        bar = int(start // BPB)
        sec = section_of(bar)
        nxt = prog[(i + 1) % len(prog)][2]
        root = nearest(ch.bass, bass_prev, 33, 50)
        bass_prev = root
        other_pc = ch.fifth if ch.fifth != ch.bass else ch.root
        other = nearest(other_pc, root, 31, 52)
        k = SEC_DYN[sec]
        in_bar = start % BPB
        last_in_bar = in_bar + dur >= BPB - 1e-6
        if sec in ("A", "Codetta"):
            if dur >= 4 and sec == "A":
                bass.note(start, 1.9, root, 82 * k)
                bass.note(start + 2, 1.9, other, 72 * k)
            else:
                bass.note(start, dur - 0.1, root, 80 * k)
            continue
        if dur >= 4:
            bass.note(start, 1.4, root, 86 * k)
            bass.note(start + 1.5, 0.45, other, 60 * k)
            bass.note(start + 2, 0.95, other, 76 * k)
        elif in_bar == 0:
            bass.note(start, 1.9, root, 86 * k)
        else:
            bass.note(start, 0.95, root, 80 * k)
        if last_in_bar:
            nroot = nearest(nxt.bass, root, 33, 50)
            ap = nearest(scale_step(nxt.bass, SCALE, from_below=nroot >= root), nroot, 31, 52)
            if ap % 12 == nxt.bass:
                ap = nroot
            bass.note(start + dur - 1, 0.9, ap, 68 * k)
    bass.cc(0, 11, 100)

    # ---------------- brush kit
    K, SN, HH, PH, RD, CR = 36, 38, 42, 44, 51, 49
    for bar in range(28):
        sec = section_of(bar)
        b = bar * BPB
        if sec == "A'":
            drums.note(b, 0.2, K, 52)
            drums.note(b + 2, 0.2, K, 44)
            for bt in (1, 3):
                drums.note(b + bt, 0.2, SN, 46)
            for j in range(8):
                drums.note(b + j * 0.5, 0.2, HH, 26 + 14 * metric(j * 0.5), jitter=0.005)
        elif sec == "B":
            drums.note(b, 0.2, K, 58)
            drums.note(b + 2, 0.2, K, 50)
            drums.note(b + 2.5, 0.2, K, 36)
            for bt in (1, 3):
                drums.note(b + bt, 0.2, SN, 52)
            for j in range(8):
                drums.note(b + j * 0.5, 0.2, RD, 30 + 16 * metric(j * 0.5), jitter=0.005)
            if bar == 23:
                for j, t in enumerate((3, 3.25, 3.5, 3.75)):
                    drums.note(b + t, 0.2, SN, 40 + 5 * j)
        elif sec == "Codetta" and bar == 24:
            drums.note(b, 2, CR, 50)
            drums.note(b, 0.2, K, 50)
    drums.cc(0, 11, 100)
    return song


if __name__ == "__main__":
    song = build()
    ok, rep = midi_report(song)
    print("MIDI checks (base):\n" + rep)
    info = song.render()
    print("loop samples:", info["loop_samples"], "loudnorm:", info["loudnorm_type"], "seam:", info["seam"])
    for f in info["files"][1:]:
        print(audio_report(f))
