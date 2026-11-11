"""Big-word battle BGM ("Ōshimi", the giant ink blot).

D minor, 125 BPM (0.48 s per beat), 28 bars of mixed meter = 112 beats
= 53.760 s per loop.  (125 BPM keeps the loop a whole number of
microseconds, milliseconds, samples and 64-sample synth blocks.)

Form (bars):  Intro 2 | A 8 | B 8 (last bar 7/8) | C 8 | Tail 2 (last bar 9/8)
  Intro  Dm  Dm               tutti hit, then a timpani roll and the riff
  A      Dm  Dm  Bb  A  Dm  Gm/Bb  Eb/G  A7
         horns + trombones (octave below) state the theme in a 3+3+2
         rhythm over a low-string riff accented 3+3+2; accordion stabs
         fill the off-accents.  Bar 7 is the Neapolitan sixth (Eb/G).
  B      Gm  Dm/F  C  A7  Gm  Dm/F  Bb  | Bb7 (7/8)
         the theme rests: pizzicato (left) and glockenspiel (right) trade
         three-note "ink drops"; in bar 4 both play off the beat together;
         in bars 5-6 the glock speaks first.  Woodblock ticks underneath.
         The 7/8 bar (3+2+2 tutti hits on Bb7) lurches into ...
  C      Ebm  Ebm  Cb  Bb  Ebm  Abm/Cb  Fb/Ab  Bb7
         ... the theme a semitone higher (E-flat minor), now doubled an
         octave up by the accordion, with tremolo strings.
  Tail   Eb  | A7 (9/8)
         Eb major (the major tonic of E-flat minor, re-heard as the
         Neapolitan of D minor) falls to A7: one tutti hit, then ~1.7 s
         of silence (only reverb) before the loop's Intro hit lands on Dm.

Surprises: Neapolitan chord (A bar 7, Tail), half-step-up modulation (C),
odd meters 7/8 and 9/8 plus 3+3+2 accents, the accordion+timpani+horn
colour and the pizzicato/glock dialogue, and the silence before the return.
Run:  python3 tools/music/big.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import (Song, add_line, main, midi_report, nearest,  # noqa: E402,F401
                    parse_line, parse_progression, phrase_arcs, voice_lead)

BAR_LENGTHS = [4] * 2 + [4] * 8 + [4] * 7 + [3.5] + [4] * 8 + [4, 4.5]
SECTIONS = [("Intro", 0, 2), ("A", 2, 8), ("B", 10, 8), ("C", 18, 8), ("Tail", 26, 2)]

CHORDS = (
    ["Dm", "Dm"]
    + ["Dm", "Dm", "Bb", "A", "Dm", "Gm/Bb", "Eb/G", "A7"]
    + ["Gm", "Dm/F", "C", "A7", "Gm", "Dm/F", "Bb", "Bb7"]
    + ["Ebm", "Ebm", "Cb", "Bb", "Ebm", "Abm/Cb", "Fb/Ab", "Bb7"]
    + ["Eb", "A7"]
)

THEME = [  # D minor; C section plays it +1 semitone
    "D4:1.5 A4:1.5 F4:1",                 # 3+3+2: the motif
    "F4:.5 E4:.5 F4:.5 A4:.5 D5:2",       # turn, then leap to the octave
    "D5:1.5 C5:1.5 Bb4:1",
    "C#5:1.5 A4:1.5 E4:1",
    "D5:1.5 F5:1.5 E5:1",
    "D5:.5 C5:.5 Bb4:.5 A4:.5 G4:2",
    "Eb5:1.5 D5:.5 Eb5:1 Bb4:1",          # Neapolitan colour (Eb)
    "C#5:1.5 D5:.5 E5:1 C#5:1",
]
TAIL_MEL = ["G4:1.5 Bb4:1.5 Eb5:1", "C#5:1 r:3.5"]

# B: call (pizzicato) and response (glockenspiel)
B_PIZZ = [
    "G4:.5 Bb4:.5 D5:.5 r:2.5",
    "F4:.5 A4:.5 D5:.5 r:2.5",
    "E4:.5 G4:.5 C5:.5 r:2.5",
    "r:.5 E4:.5 r:.5 A4:.5 r:.5 C#5:.5 r:.5 E5:.5",   # off-beat, together
    "r:2 G4:.5 Bb4:.5 D5:.5 r:.5",                    # now answers
    "r:2 F4:.5 A4:.5 D5:.5 r:.5",
    "Bb4:.5 D5:.5 F5:.5 r:2.5",
    "r:3.5",
]
B_GLOCK = [
    "r:2 D7:.5 Bb6:.5 G6:.5 r:.5",
    "r:2 D7:.5 A6:.5 F6:.5 r:.5",
    "r:2 C7:.5 G6:.5 E6:.5 r:.5",
    "r:.5 E6:.5 r:.5 A6:.5 r:.5 C#7:.5 r:.5 E7:.5",
    "D7:.5 Bb6:.5 G6:.5 r:2.5",                       # speaks first
    "D7:.5 A6:.5 F6:.5 r:2.5",
    "r:2 F6:.5 D6:.5 Bb5:.5 r:.5",
    "r:3.5",
]

SEC_DYN = {"Intro": 0.92, "A": 1.0, "B": 0.8, "C": 1.08, "Tail": 1.12}


def build():
    song = Song("big", bpm=125, bars=28, beats_per_bar=4, seed=23, sections=SECTIONS,
                bar_lengths=BAR_LENGTHS)
    horn = song.track("Horns", 0, 60, pan=52, reverb=66, role="melody", range=(41, 79))
    tbn = song.track("Trombones", 1, 57, pan=40, reverb=60, range=(40, 72))
    acc = song.track("Accordion", 2, 21, pan=86, reverb=52, range=(53, 93))
    riff = song.track("LowStrings", 3, 48, pan=56, reverb=48, range=(36, 72))
    trem = song.track("TremStr", 4, 44, pan=70, reverb=72, range=(52, 88))
    tuba = song.track("Tuba", 5, 58, pan=66, reverb=45, role="bass", range=(28, 58))
    timp = song.track("Timpani", 6, 47, pan=60, reverb=62, range=(38, 57))
    pizz = song.track("Pizzicato", 7, 45, pan=26, reverb=50, role="melody", range=(36, 84))
    glock = song.track("Glock", 8, 9, pan=102, reverb=64, role="melody", range=(72, 108))
    drums = song.track("Drums", 9, 48, pan=64, reverb=50, role="drums")   # Orchestra kit

    bs = song.bar_start
    prog = parse_progression(CHORDS, 4, BAR_LENGTHS)

    def sec_of(bar):
        return next(n for n, b0, nb in SECTIONS if b0 <= bar < b0 + nb)

    def lens(b0, n):
        return BAR_LENGTHS[b0:b0 + n]

    # ---------------- theme
    mel = []

    def place(track, bars, b0, vel, transpose=0, **kw):
        notes = parse_line(bars, 4, transpose=transpose, bar_lengths=lens(b0, len(bars)))
        add_line(track, notes, bs(b0), vel, **kw)
        return [(s + bs(b0), d, p) for s, d, p in notes]

    mel += place(horn, THEME, 2, 88, accent=12, lag=0.004)
    place(tbn, THEME, 2, 78, transpose=-12, accent=12)
    mel += place(horn, THEME, 18, 96, transpose=1, accent=12, lag=0.004)
    place(tbn, THEME, 18, 84, transpose=-11, accent=12)
    place(acc, THEME, 18, 70, transpose=13, accent=10, legato=0.9)
    mel += place(horn, TAIL_MEL, 26, 102, accent=10)
    place(tbn, TAIL_MEL, 26, 92, transpose=-12, accent=10)
    mel += place(pizz, B_PIZZ, 10, 74, legato=0.6, accent=6)
    mel += place(glock, B_GLOCK, 10, 70, legato=0.8, accent=6)

    horn.cc(0, 11, 96)
    phrase_arcs(horn, bs(2), 32, 92, 116)
    phrase_arcs(horn, bs(18), 32, 98, 120)
    horn.cc(bs(26), 11, 120)
    tbn.cc(0, 11, 100)
    pizz.cc(0, 11, 110)
    glock.cc(0, 11, 100)

    def strong_pcs(t0, t1):
        out = set()
        for s, d, p in mel:
            if s < t1 and s + d > t0:
                b, pos = song.bar_of(max(s, t0))
                if pos in (0, 2):
                    out.add(p % 12)
        return out

    # ---------------- tuba (bass line)
    prev = 38
    for start, dur, ch in prog:
        bar, _ = song.bar_of(start)
        sec = sec_of(bar)
        root = nearest(ch.bass, prev, 31, 50)
        prev = root
        k = SEC_DYN[sec]
        if bar == 27:
            tuba.note(start, 1.0, root, 112)
        elif bar == 17:   # 7/8: 3+2+2 hits
            for t, d in ((0, 1.2), (1.5, 0.8), (2.5, 0.8)):
                tuba.note(start + t, d, root, 100)
        elif sec == "B":
            tuba.note(start, 1.9, root, 80 * k)
            tuba.note(start + 2, 1.9, root, 70 * k)
        else:
            tuba.note(start, 1.4, root, 96 * k)
            tuba.note(start + 1.5, 1.4, root, 84 * k)
            tuba.note(start + 3, 0.9, root, 88 * k)
    tuba.cc(0, 11, 104)

    # ---------------- low-string riff, accents 3+3+2 (Intro bar 2, A, C, Tail bar 1)
    for start, dur, ch in prog:
        bar, _ = song.bar_of(start)
        sec = sec_of(bar)
        if not (sec in ("A", "C") or bar in (1, 26)):
            continue
        b = nearest(ch.bass, 45, 38, 50)
        x = nearest(ch.root, b + 6, b + 3, b + 9) if ch.bass != ch.root else b + 7
        shape = [b, b, b + 12, b, b, b + 12, x, b + 12]
        acc_pos = (0, 3, 6)
        k = SEC_DYN[sec] * (0.75 if bar == 1 else 1.0)
        for j in range(8):
            v = (100 if j in acc_pos else 62) * k
            riff.note(start + j * 0.5, 0.3, shape[j], v, jitter=0.004)
    riff.cc(0, 11, 100)

    # ---------------- accordion: off-accent stabs in A (eighths 2, 5, 7)
    prevv = None
    for start, dur, ch in prog:
        bar, _ = song.bar_of(start)
        if sec_of(bar) != "A":
            continue
        v = voice_lead(ch, prevv, 3, 55, 72, avoid=strong_pcs(start, start + dur))
        prevv = v
        for j in (2, 5, 7):
            for p in v:
                acc.note(start + j * 0.5, 0.32, p, 64 + (8 if j == 5 else 0), jitter=0.004)
    acc.cc(0, 11, 92)
    # B: accordion holds the harmony with a bellows swell every bar
    prevv = None
    for start, dur, ch in prog:
        bar, _ = song.bar_of(start)
        if sec_of(bar) != "B" or bar == 17:
            continue
        v = voice_lead(ch, prevv, 3, 55, 70, avoid=strong_pcs(start, start + dur))
        prevv = v
        for p in v:
            acc.note(start, dur - 0.05, p, 58)
        acc.ramp(start, start + 2.5, 58, 96)
        acc.ramp(start + 2.5, start + dur, 96, 62)
    acc.cc(bs(17), 11, 100)
    acc.cc(bs(18), 11, 100)

    # ---------------- tremolo strings: Intro swell, B and C pads, Tail
    prevv = None
    for start, dur, ch in prog:
        bar, _ = song.bar_of(start)
        sec = sec_of(bar)
        if sec == "A" or bar == 17 or bar == 27:
            prevv = None
            continue
        v = voice_lead(ch, prevv, 4, 55, 84, avoid=strong_pcs(start, start + dur))
        prevv = v
        for p in v:
            trem.note(start, dur + 0.02, p, 70 * SEC_DYN[sec], jitter=0.01)
    trem.cc(0, 11, 112)              # forte-piano: the opening hit, then
    trem.ramp(1.0, bs(2) - 0.25, 45, 112)   # a crescendo into A
    trem.cc(bs(2), 11, 40)          # A: strings silent; value only matters at B
    trem.ramp(bs(10), bs(17), 78, 100, step=1)
    trem.ramp(bs(18), bs(26), 92, 112, step=1)
    trem.ramp(bs(26), bs(27), 104, 124)
    trem.cc(bs(27), 11, 112)

    # ---------------- tutti hits: Intro downbeat, the 7/8 bar, Tail bar 2
    def hit(t, ch, vel, n=4, lo=50, hi=74, d=0.7):
        v = voice_lead(ch, None, n, lo, hi)
        for p in v:
            riff.note(t, d, p - 12 if p - 12 >= 36 else p, vel)
            acc.note(t, d * 0.6, p if p >= 55 else p + 12, vel - 10)
            trem.note(t, d, p + 12, vel - 10)
    dm, bb7, a7 = prog[0][2], prog[17][2], prog[-1][2]
    hit(0, dm, 112, d=1.2)
    for t in (0, 1.5, 2.5):
        hit(bs(17) + t, bb7, 104 if t == 0 else 96, d=0.6)
        tbn.note(bs(17) + t, 0.6, 58, 96)   # Bb3
        tbn.note(bs(17) + t, 0.6, 62, 90)   # D4
        horn.note(bs(17) + t, 0.6, 68, 92)  # Ab4 (the 7th)
    hit(bs(27), a7, 116, d=1.0)

    # ---------------- timpani
    D2, A2, Eb2, Bb2 = 38, 45, 39, 46
    timp.note(0, 1.0, D2, 118)
    roll_start, roll_end = 1.0, bs(2)
    n = int((roll_end - roll_start) * 4)
    for i in range(n):   # 16th-note roll, crescendo into A
        timp.note(roll_start + i * 0.25, 0.25, D2 if i < n - 4 else A2, 40 + 76 * i / n, jitter=0.003)
    for bar in list(range(2, 10)) + list(range(18, 26)):
        root, fifth = (D2, A2) if bar < 18 else (Eb2, Bb2)
        start = bs(bar)
        timp.note(start, 0.5, root, 108 if bar in (2, 18) else 92)
        timp.note(start + 1.5, 0.5, fifth, 76)
        if bar in (9, 25):
            for i, t in enumerate((3, 3.25, 3.5, 3.75)):
                timp.note(start + t, 0.25, fifth if i < 2 else root, 80 + 8 * i)
    for bar in range(10, 17):
        timp.note(bs(bar), 0.8, D2 if bar % 2 == 0 else A2, 62)
    for t in (0, 1.5, 2.5):
        timp.note(bs(17) + t, 0.5, Bb2, 108)
    for i in range(16):    # Tail bar 1: roll on Eb
        timp.note(bs(26) + i * 0.25, 0.25, Eb2, 70 + 3 * i, jitter=0.003)
    timp.note(bs(27), 1.2, A2, 120)
    timp.cc(0, 11, 110)

    # ---------------- percussion (Orchestra kit)
    BD, SN, CR, WB = 36, 38, 49, 77
    d = drums
    d.note(0, 2, CR, 100)
    d.note(0, 0.5, BD, 112)
    for i in range(8):   # snare roll in Intro bar 2
        d.note(bs(1) + 2 + i * 0.25, 0.2, SN, 44 + 7 * i, jitter=0.003)
    for bar in list(range(2, 10)) + list(range(18, 26)):
        s = bs(bar)
        k = SEC_DYN[sec_of(bar)]
        if bar in (2, 18):
            d.note(s, 2, CR, 96)
        for j in (0, 3, 6):
            d.note(s + j * 0.5, 0.3, BD, (100 if j == 0 else 86) * k)
        d.note(s + 2, 0.3, SN, 84 * k)
        d.note(s + 3.5, 0.3, SN, 60 * k)
        if bar in (5, 21):      # displaced accent: snare on the "and" of 2
            d.note(s + 1.5, 0.3, SN, 88 * k)
    for bar in range(10, 17):
        s = bs(bar)
        d.note(s, 0.3, BD, 76)
        for j in range(8):
            d.note(s + j * 0.5, 0.2, WB, 46 + (18 if j in (0, 3, 6) else 0), jitter=0.004)
    for t in (0, 1.5, 2.5):
        d.note(bs(17) + t, 0.3, BD, 108)
    d.note(bs(17), 1.5, CR, 90)
    for i in range(16):
        d.note(bs(26) + i * 0.25, 0.2, SN, 50 + 4 * i, jitter=0.003)
    # no cymbal on the last hit: its ring would fill the silence
    d.note(bs(27), 0.5, BD, 120)
    d.cc(0, 11, 100)
    return song


if __name__ == "__main__":
    main(build(), keep_work="--keep" in sys.argv, loop_key="big")
