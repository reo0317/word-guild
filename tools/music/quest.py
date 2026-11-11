"""Quest BGM (looping during a 3-4 minute puzzle).

D major, 120 BPM, 4/4, 40 bars = 80 s per loop.

Form (bars):  Intro 4 | A 8 | B 8 | Break 8 | A' 8 | Tag 4  -> back to Intro
  Intro  D  G/D  D  Asus4-A            groove only (pizz, bass, shaker)
  A      D  A/C#  Bm7  G  Em7  D/F#  G  A7sus4-A7
         flute states the motif: two 8ths rising into a quarter (an
         'upward step' gesture), answered by a falling dotted figure.
  B      Gmaj7  A  F#m7  Bm7  Em7  F#7  Bm  A7
         oboe takes a longer-breathed line (motif rhythm augmented);
         flute only answers in the gaps; harp arpeggios replace the pizz.
  Break  Bm  G  D  A  Bm  G  Em7  A7sus4-A7
         melody rests: horn counter-line, marimba arpeggios, strings swell,
         shaker only, toms lead back in.
  A'     as A, with glockenspiel sparkle and a higher cadence (A6) in bar 7.
  Tag    Bm7  Gmaj7  Em7  A7sus4-A7    deceptive landing on Bm7, oboe echoes
         the motif softly; the final A7 resolves to D at the loop start.

Melody is present in 28 of 40 bars, and only fragments in 4 of those.
Run:  python3 tools/music/quest.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import (Song, add_line, audio_report, metric, midi_report, nearest,  # noqa: E402
                    parse_line, parse_progression, phrase_arcs, scale_step, voice_lead, OUT_DIR)

BPB = 4
SCALE = [2, 4, 6, 7, 9, 11, 1]  # D major

SECTIONS = [("Intro", 0, 4), ("A", 4, 8), ("B", 12, 8), ("Break", 20, 8), ("A'", 28, 8), ("Tag", 36, 4)]

CHORDS = (
    ["D", "G/D", "D", "Asus4 A"]
    + ["D", "A/C#", "Bm7", "G", "Em7", "D/F#", "G", "A7sus4 A7"]
    + ["Gmaj7", "A", "F#m7", "Bm7", "Em7", "F#7", "Bm", "A7"]
    + ["Bm", "G", "D", "A", "Bm", "G", "Em7", "A7sus4 A7"]
    + ["D", "A/C#", "Bm7", "G", "Em7", "D/F#", "Gmaj7", "A7sus4 A7"]
    + ["Bm7", "Gmaj7", "Em7", "A7sus4 A7"]
)

# ---- melody (flute) --------------------------------------------------------
A_MEL = [
    "F#5:.5 A5:.5 D6:1 A5:.5 B5:.5 A5:1",     # motif x: rise, neighbour
    "E6:1.5 D6:.5 C#6:1 A5:1",                # answer y: dotted fall
    "B5:.5 D6:.5 F#6:1 E6:.5 D6:.5 B5:1",     # x on vi, higher
    "D6:1.5 B5:.5 G5:1 r:1",                  # y, breath
    "G5:.5 B5:.5 E6:1 D6:.5 E6:.5 G6:1",      # x sequenced up on ii
    "F#6:1.5 E6:.5 D6:1 A5:1",                # y
    "B5:.5 D6:.5 G6:1.5 F#6:.5 E6:.5 D6:.5",  # x peak (G6)
    "E6:2 C#6:1 r:1",                         # half cadence
]
A2_MEL = A_MEL[:3] + [
    "D6:1.5 B5:.5 G5:1 A5:.5 B5:.5",          # pickup instead of breath
    A_MEL[4], A_MEL[5],
    "B5:.5 D6:.5 G6:1 A6:1 F#6:1",            # new peak A6 over Gmaj7 (9th)
    "E6:1.5 F#6:.5 E6:1 C#6:1",
]
# flute answers inside B (fills the oboe's rests)
B_FLUTE = ["r:4", "r:2 E6:.5 F#6:.5 A6:1", "r:4", "r:2 D6:.5 E6:.5 F#6:1",
           "r:4", "r:4", "r:4", "r:4"]
# ---- oboe ---------------------------------------------------------------
B_OBOE = [
    "D5:1 F#5:1 B5:1.5 A5:.5",
    "A5:2 E5:1 r:1",
    "C#5:1 E5:1 A5:1.5 F#5:.5",
    "F#5:2 D5:1 r:1",
    "E5:1 G5:1 B5:1.5 A5:.5",
    "A#5:1 C#6:1 E6:1 C#6:1",                 # F#7: V/vi lift
    "D6:2 B5:1 F#5:1",
    "G5:1 E5:1 C#5:1 E5:1",
]
TAG_OBOE = ["r:2 F#5:.5 A5:.5 B5:1", "A5:2 r:2", "r:2 E5:.5 G5:.5 B5:1", "A5:2 r:2"]
# ---- horn counter-line in the Break ------------------------------------------
BREAK_HORN = ["F#4:3 E4:1", "D4:2 B3:2", "A3:2 D4:1 F#4:1", "E4:4",
              "F#4:2 B4:2", "D5:2 B4:1 A4:1", "G4:2 E4:2", "D4:2 C#4:2"]

SEC_DYN = {"Intro": 0.82, "A": 1.0, "B": 1.04, "Break": 0.86, "A'": 1.1, "Tag": 0.8}


def section_of(bar):
    for name, b0, n in SECTIONS:
        if b0 <= bar < b0 + n:
            return name


def build():
    song = Song("quest", bpm=120, bars=40, beats_per_bar=BPB, seed=11, sections=SECTIONS)
    flute = song.track("Flute", 0, 73, pan=72, reverb=62, role="melody", range=(60, 96))
    oboe = song.track("Oboe", 1, 68, pan=44, reverb=58, role="melody", range=(58, 91))
    strings = song.track("Strings", 2, 48, pan=58, reverb=75, range=(40, 96))
    pizz = song.track("Pizzicato", 3, 45, pan=90, reverb=48, range=(36, 84))
    bass = song.track("Bass", 4, 32, pan=64, reverb=28, role="bass", range=(28, 55))
    marimba = song.track("Marimba", 5, 12, pan=38, reverb=50, range=(45, 96))
    harp = song.track("Harp", 6, 46, pan=86, reverb=60, range=(24, 103))
    glock = song.track("Glock", 7, 9, pan=80, reverb=65, range=(72, 108))
    horn = song.track("Horn", 8, 60, pan=50, reverb=70, range=(41, 77))
    drums = song.track("Drums", 9, 8, pan=64, reverb=35, role="drums")
    guitar = song.track("Guitar", 10, 24, pan=34, reverb=45, range=(40, 83))

    prog = parse_progression(CHORDS, BPB)

    # ---------------- melody lines
    def place(track, bars, start_bar, vel, **kw):
        notes = parse_line(bars, BPB)
        add_line(track, notes, start_bar * BPB, vel, **kw)
        return [(s + start_bar * BPB, d, p) for s, d, p in notes]

    mel_notes = []
    mel_notes += place(flute, A_MEL, 4, 76, lag=0.006)
    mel_notes += place(flute, B_FLUTE, 12, 64, lag=0.006)
    mel_notes += place(oboe, B_OBOE, 12, 80, lag=0.004)
    mel_notes += place(flute, A2_MEL, 28, 82, lag=0.006)
    mel_notes += place(oboe, TAG_OBOE, 36, 58, lag=0.004)
    place(horn, BREAK_HORN, 20, 72, legato=0.98, contour=0.4, accent=6)

    # glockenspiel sparkle in A': doubles the first gesture of bars 1,3,5,7
    for bar in (28, 30, 32, 34):
        for s, d, p in mel_notes:
            if bar * BPB <= s < bar * BPB + 2 and p + 12 <= 108:
                glock.note(s, 0.4, p + 12, 44 + 8 * metric(s % BPB), jitter=0.004)

    # expression arcs for melodic instruments
    flute.cc(0, 11, 92)
    phrase_arcs(flute, 4 * BPB, 8 * BPB, 90, 110)
    flute.cc(12 * BPB, 11, 96)
    phrase_arcs(flute, 28 * BPB, 8 * BPB, 92, 114, end=92)
    oboe.cc(0, 11, 92)
    phrase_arcs(oboe, 12 * BPB, 8 * BPB, 88, 110)
    phrase_arcs(oboe, 36 * BPB, 4 * BPB, 80, 96, phrase=4 * BPB, end=92)
    horn.cc(0, 11, 70)
    phrase_arcs(horn, 20 * BPB, 8 * BPB, 72, 104, end=70)

    def mel_at(t0, t1):
        return [p for s, d, p in mel_notes if s < t1 and s + d > t0]

    def strong_pcs(t0, t1):
        return {p % 12 for s, d, p in mel_notes
                if s < t1 and s + d > t0 and metric((s if s >= t0 else t0) % BPB) >= 0.6}

    # ---------------- strings pad (voice-led, kept below the melody)
    prev = None
    for start, dur, ch in prog:
        m = mel_at(start, start + dur)
        top = min(m) - 3 if m else 76
        v = voice_lead(ch, prev, 4, 50, 76, avoid=strong_pcs(start, start + dur), top_max=top)
        prev = v
        sec = section_of(int(start // BPB))
        vel = int(58 * SEC_DYN[sec] + (6 if sec == "Break" else 0))
        for p in v:
            strings.note(start, dur + 0.05, p, vel, jitter=0.01)
    # pad expression: section level + one swell per bar in the Break
    lv = {"Intro": 72, "A": 80, "B": 88, "Break": 92, "A'": 90, "Tag": 82}
    strings.cc(0, 11, 70)
    strings.ramp(0, 4 * BPB, 70, lv["A"])
    strings.ramp(4 * BPB, 12 * BPB, lv["A"], lv["B"], step=1)
    strings.ramp(12 * BPB, 20 * BPB, lv["B"], lv["Break"] - 8, step=1)
    for b in range(20, 28):
        strings.ramp(b * BPB, b * BPB + 2.5, lv["Break"] - 8, lv["Break"] + 12)
        strings.ramp(b * BPB + 2.5, (b + 1) * BPB, lv["Break"] + 12, lv["Break"] - 8)
    strings.ramp(28 * BPB, 36 * BPB, lv["A'"], lv["A'"] + 6, step=1)
    strings.ramp(36 * BPB, 40 * BPB, lv["Tag"] + 6, 70)   # back to the Intro level

    # ---------------- bass (acoustic): root / octave bounce / fifth / approach
    bass_prev = 38
    segs = prog
    for i, (start, dur, ch) in enumerate(segs):
        bar = int(start // BPB)
        sec = section_of(bar)
        nxt = segs[(i + 1) % len(segs)][2]
        root = nearest(ch.bass, bass_prev, 33, 50)
        bass_prev = root
        other_pc = ch.fifth if ch.fifth != ch.bass else ch.root
        other = nearest(other_pc, root, 33, 52)
        k = SEC_DYN[sec]
        in_bar = start % BPB
        if sec in ("Intro", "Break", "Tag") and not (sec == "Intro" and bar == 3):
            # long tones (half notes)
            if dur >= 4:
                bass.note(start, 1.9, root, 84 * k)
                bass.note(start + 2, 1.9, other, 74 * k)
            else:
                bass.note(start, dur - 0.1, root, 84 * k)
            continue
        if dur >= 4:
            bass.note(start, 0.9, root, 92 * k)
            bass.note(start + 1.5, 0.4, root, 68 * k)
            bass.note(start + 2, 0.9, other, 84 * k)
        else:
            bass.note(start, 0.9, root, (92 if in_bar == 0 else 86) * k)
            bass.note(start + 1.5 if in_bar == 0 else start + 1.0, 0.4, root, 66 * k)
        if in_bar + dur >= BPB - 1e-6:   # last segment of the bar: approach tone
            nroot = nearest(nxt.bass, root, 33, 50)
            ap = nearest(scale_step(nxt.bass, SCALE, from_below=nroot >= root), nroot, 31, 52)
            if ap % 12 == nxt.bass:
                ap = nroot
            bass.note(start + dur - 0.5, 0.4, ap, 70 * k)
    bass.cc(0, 11, 100)

    # ---------------- pizzicato ostinato (8ths broken chord), Intro/A/A'/Tag
    prev = None
    patt = [0, 2, 3, 2, 1, 2, 3, 2]
    for start, dur, ch in prog:
        bar = int(start // BPB)
        sec = section_of(bar)
        if sec == "Break":
            prev = None
            continue
        v = voice_lead(ch, prev, 4, 55, 74, avoid=strong_pcs(start, start + dur))
        prev = v
        k = SEC_DYN[sec]
        n8 = int(dur * 2)
        for j in range(n8):
            t = start + j * 0.5
            if sec == "B" and j % 2 == 1:
                continue   # quarters only under the oboe
            idx = patt[int((t % BPB) * 2) % 8]
            vel = (52 + 22 * metric(t % BPB)) * k
            pizz.note(t, 0.35, v[idx], vel, jitter=0.005)
    pizz.cc(0, 11, 100)

    # ---------------- nylon guitar strums in A and A' (and soft in B)
    prev = None
    strum = [(0, "D", 1.0), (1, "D", 0.7), (1.5, "U", 0.55), (2.5, "U", 0.6), (3, "D", 0.8), (3.5, "U", 0.5)]
    for start, dur, ch in prog:
        bar = int(start // BPB)
        sec = section_of(bar)
        if sec not in ("A", "B", "A'"):
            prev = None
            continue
        v = voice_lead(ch, prev, 4, 50, 69)
        prev = v
        k = SEC_DYN[sec] * (0.8 if sec == "B" else 1.0)
        for pos, direction, w in strum:
            t0 = bar * BPB + pos
            if not (start <= t0 < start + dur):
                continue
            order = v if direction == "D" else v[::-1]
            for si, p in enumerate(order):
                guitar.note(t0 + si * 0.022, 0.45, p, (34 + 24 * w) * k - si * 2, jitter=0.003)
    guitar.cc(0, 11, 96)

    # ---------------- harp arpeggios in B (8ths, ascending per half bar)
    for start, dur, ch in prog:
        bar = int(start // BPB)
        if section_of(bar) != "B":
            continue
        tones = sorted(p for p in range(50, 80) if p % 12 in ch.pcs)
        base_i = min(range(len(tones)), key=lambda i: abs(tones[i] - 52 - (ch.root % 12) / 2))
        for half in range(int(dur // 2)):
            for j in range(4):
                t = start + half * 2 + j * 0.5
                p = tones[min(base_i + j + half * 2, len(tones) - 1)]
                harp.note(t, min(1.2, start + dur - t), p, 50 + 12 * metric(t % BPB), jitter=0.005)
    harp.cc(0, 11, 100)

    # ---------------- marimba arpeggios in the Break (up-down, 8ths)
    for start, dur, ch in prog:
        bar = int(start // BPB)
        if section_of(bar) != "Break":
            continue
        tones = sorted(p for p in range(57, 84) if p % 12 in ch.pcs)
        r = [p for p in tones if p % 12 == ch.root][0]
        up = [p for p in tones if p >= r][:5]
        shape = up + up[-2:0:-1]
        for j in range(int(dur * 2)):
            t = start + j * 0.5
            build = 1.0 + 0.04 * (bar - 20)
            marimba.note(t, 0.45, shape[j % len(shape)], (46 + 12 * metric(t % BPB)) * build, jitter=0.005)
    marimba.cc(0, 11, 100)

    # ---------------- drums
    K, RIM, SN, HH, PH, OH, CR, RD, TAMB, SHK, LT, MT, HT = 36, 37, 38, 42, 44, 46, 49, 51, 54, 82, 45, 47, 50
    d = drums
    for bar in range(40):
        sec = section_of(bar)
        b = bar * BPB
        k = SEC_DYN[sec]
        first = bar == next(b0 for n, b0, nb in SECTIONS if n == sec)
        # shaker: 16ths everywhere except A/A' where hats take over
        if sec in ("Intro", "Break", "Tag", "B"):
            for j in range(16):
                acc = [1.0, 0.45, 0.7, 0.45][j % 4]
                d.note(b + j * 0.25, 0.1, SHK, (30 + 32 * acc) * k * (0.8 if sec == "B" else 1), jitter=0.004)
        if sec == "Intro":
            d.note(b, 0.2, K, 70)
            d.note(b + 2, 0.2, K, 58)
            if bar == 3:
                d.note(b + 1, 0.2, RIM, 58)
                d.note(b + 3, 0.2, RIM, 62)
                d.note(b + 3.5, 0.2, RIM, 50)
        elif sec in ("A", "A'"):
            if first:
                d.note(b, 1, CR, 64 if sec == "A" else 72)
            d.note(b, 0.2, K, 80 * k)
            d.note(b + 1.5, 0.2, K, 58 * k)
            d.note(b + 2, 0.2, K, 72 * k)
            for bt in (1, 3):
                d.note(b + bt, 0.2, RIM if sec == "A" else SN, (72 if sec == "A" else 66) * k)
            hat = RD if sec == "A'" else HH
            for j in range(8):
                if first and j == 0:
                    continue
                d.note(b + j * 0.5, 0.2, hat, (44 + 22 * metric(j * 0.5)) * k, jitter=0.004)
            if sec == "A" and bar % 2 == 1:
                d.note(b + 3.5, 0.3, OH, 52)
            if bar == 35:       # small fill into the Tag (soft so the Tag can settle)
                d.note(b + 3, 0.2, SN, 60)
                d.note(b + 3.25, 0.2, SN, 52)
                d.note(b + 3.5, 0.2, SN, 66)
                d.note(b + 3.75, 0.2, SN, 58)
        elif sec == "B":
            d.note(b, 0.2, K, 76)
            d.note(b + 2, 0.2, K, 68)
            d.note(b + 2.5, 0.2, K, 56)
            for bt in (1, 3):
                d.note(b + bt, 0.2, SN, 64)
                d.note(b + bt, 0.2, TAMB, 50)
            for j in range(8):
                d.note(b + j * 0.5, 0.2, PH, 40 + 16 * metric(j * 0.5), jitter=0.004)
            if bar == 19:
                d.note(b + 3.5, 0.4, OH, 60)
        elif sec == "Break":
            d.note(b, 0.2, K, 62)
            if bar >= 26:
                for j in range(8):
                    d.note(b + j * 0.5, 0.2, HH, 36 + 14 * metric(j * 0.5) + 4 * (bar - 26))
            if bar == 27:   # tom build into A'
                for j, (t, nn) in enumerate([(2, HT), (2.5, HT), (3, MT), (3.25, MT), (3.5, LT), (3.75, LT)]):
                    d.note(b + t, 0.3, nn, 58 + 4 * j)
        elif sec == "Tag":
            d.note(b, 0.2, K, 64)
            if bar < 38:
                d.note(b + 2, 0.2, K, 50)
    d.cc(0, 11, 100)
    return song


if __name__ == "__main__":
    song = build()
    ok, rep = midi_report(song)
    print("MIDI checks (quest):\n" + rep)
    info = song.render()
    print("loop samples:", info["loop_samples"], "loudnorm:", info["loudnorm_type"], "seam:", info["seam"])
    for f in info["files"][1:]:
        print(audio_report(f))
