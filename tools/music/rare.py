"""まれびと（レアの紙魚）が出たときの曲。

かわいくて少し不思議な電子音のポップ（ユーザーが挙げた「ふわふわ・キラキラした
電子音の曲」の雰囲気を参考に、旋律・和声は一から書いた）。
F# マイナー／A メジャー、150 BPM（1拍 0.4 秒）、32小節 = 128拍 = 51.200 秒で一周。

Form (bars):  Intro 4 | A 8 | B 8 | A' 8 | Outro 4
  Intro  Dmaj7 E C#m7 F#m7      オルゴールの分散和音と、キラキラ（クリスタル）。
  A      Dmaj7 E C#m7 F#m7 Dmaj7 E F#m7 E
         矩形波のリードが主題。四つ打ちとオクターブで跳ねるベース。
  B      Bm7 E7 Amaj7 F#m7 Bm7 E7 C#7 C#7
         サビ（半分の速さに感じるノリ）。3+3+2 のシンセの和音の刻み、
         短い掛け声のようなフック。最後の C#7（ドミナント）で緊張を作る。
  A'     A と同じ和音。主題にチェレスタが1オクターブ上で重なり、パッドが入る。
  Outro  Dmaj7 E Dmaj7 C#7       ドラムが抜けてオルゴールが戻る。C#7 から
         頭の Dmaj7 へ「偽終止」でつながり、不思議なまま一周する。
Run:  python3 tools/music/rare.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import (Song, add_line, main, nearest,  # noqa: E402
                    parse_line, parse_progression, phrase_arcs, voice_lead)

SECTIONS = [("Intro", 0, 4), ("A", 4, 8), ("B", 12, 8), ("A2", 20, 8), ("Outro", 28, 4)]
A_CH = ["Dmaj7", "E", "C#m7", "F#m7", "Dmaj7", "E", "F#m7", "E"]
CHORDS = (["Dmaj7", "E", "C#m7", "F#m7"] + A_CH
          + ["Bm7", "E7", "Amaj7", "F#m7", "Bm7", "E7", "C#7", "C#7"]
          + A_CH + ["Dmaj7", "E", "Dmaj7", "C#7"])

THEME = [
    "F#5:.5 A5:.5 C#6:1 B5:.5 A5:.5 F#5:1",
    "G#5:.5 B5:.5 E6:1.5 F#6:.5 E6:1",
    "E6:.75 C#6:.75 G#5:.5 B5:1 A5:1",
    "A5:1.5 G#5:.5 F#5:2",
    "F#5:.5 A5:.5 C#6:1 E6:.5 D6:.5 C#6:1",
    "B5:.5 G#5:.5 E5:.5 G#5:.5 B5:1 C#6:1",
    "A5:.75 C#6:.75 F#6:1.5 E6:1",
    "E6:.5 D#6:.5 E6:.5 G#5:.5 B5:2",
]
HOOK = [
    "F#5:.75 F#5:.75 A5:.5 B5:1 r:1",
    "G#5:.75 G#5:.75 B5:.5 D6:1 r:1",
    "C#6:.75 B5:.75 A5:.5 B5:.5 A5:.5 E5:1",
    "F#5:2 r:2",
    "F#5:.75 F#5:.75 A5:.5 B5:1 r:1",
    "G#5:.75 G#5:.75 B5:.5 D6:1 r:1",
    "F5:.5 G#5:.5 B5:.5 C#6:.5 F6:1 C#6:1",
    "G#5:2 r:2",
]
SEC_DYN = {"Intro": 0.8, "A": 0.95, "B": 1.06, "A2": 1.0, "Outro": 0.82}


def build():
    song = Song("rare", bpm=150, bars=32, beats_per_bar=4, seed=31, sections=SECTIONS)
    lead = song.track("SquareLead", 0, 80, pan=64, reverb=58, role="melody", range=(60, 96))
    cel = song.track("Celesta", 1, 8, pan=84, reverb=76, role="melody", range=(72, 108))
    box = song.track("MusicBox", 2, 10, pan=44, reverb=80, range=(60, 100))
    stab = song.track("PolySynth", 3, 90, pan=60, reverb=50, range=(52, 84))
    pad = song.track("WarmPad", 4, 89, pan=70, reverb=84, range=(48, 84))
    bass = song.track("SynthBass", 5, 38, pan=64, reverb=20, role="bass", range=(28, 55))
    fx = song.track("Crystal", 6, 98, pan=96, reverb=96, range=(72, 108))
    drums = song.track("Drums", 9, 25, pan=64, reverb=34, role="drums")   # TR-808 kit

    bs = song.bar_start
    prog = parse_progression(CHORDS, 4)

    def sec_of(bar):
        return next(n for n, b0, nb in SECTIONS if b0 <= bar < b0 + nb)

    def place(track, bars, b0, vel, transpose=0, **kw):
        notes = parse_line(bars, 4, transpose=transpose)
        add_line(track, notes, bs(b0), vel, **kw)

    # ---------------- melody
    place(lead, THEME, 4, 84, legato=0.82, accent=8)
    place(lead, HOOK, 12, 90, legato=0.7, accent=10)
    place(lead, THEME, 20, 86, legato=0.82, accent=8)
    place(cel, THEME, 20, 70, transpose=12, legato=0.9, accent=6)
    place(cel, HOOK, 12, 58, transpose=12, legato=0.6, accent=6)
    lead.cc(0, 11, 100)
    phrase_arcs(lead, bs(4), 32, 96, 116, phrase=16)
    phrase_arcs(lead, bs(20), 32, 98, 118, phrase=16)
    cel.cc(0, 11, 104)

    # ---------------- music box: 8th-note broken chords (Intro, Outro, under B quietly)
    for start, dur, ch in prog:
        bar, _ = song.bar_of(start)
        sec = sec_of(bar)
        if sec not in ("Intro", "Outro", "B"):
            continue
        root = nearest(ch.root, 66, 62, 73)
        tones = sorted({nearest(pc, root + 5, root, root + 14) for pc in ch.pcs})
        up = [root] + [t for t in tones if t > root][:3]
        pattern = (up + [up[-1] + 12] + up[::-1][:3])[:8]
        v = 70 if sec != "B" else 44
        for j, p in enumerate(pattern):
            box.note(start + j * 0.5, 0.45, p + 12 if p + 12 <= 98 else p, v + (8 if j % 4 == 0 else 0), jitter=0.004)
    box.cc(0, 11, 110)

    # ---------------- crystal sparkles: one high chord tone every 2 bars outside B
    for start, dur, ch in prog:
        bar, _ = song.bar_of(start)
        if sec_of(bar) == "B" or bar % 2:
            continue
        p = nearest(ch.pcs[-1], 90, 86, 98)
        fx.note(start + 3.5, 1.5, p, 62)
    fx.cc(0, 11, 96)

    # ---------------- pad: A2 and Outro, plus B underneath the stabs
    prevv = None
    for start, dur, ch in prog:
        bar, _ = song.bar_of(start)
        sec = sec_of(bar)
        if sec not in ("A2", "B", "Outro"):
            prevv = None
            continue
        v = voice_lead(ch, prevv, 4, 55, 79)
        prevv = v
        for p in v:
            pad.note(start, dur + 0.02, p, 54 * SEC_DYN[sec], jitter=0.01)
    pad.cc(0, 11, 96)

    # ---------------- synth stabs: A = off-beats, B = 3+3+2 drive
    prevv = None
    for start, dur, ch in prog:
        bar, _ = song.bar_of(start)
        sec = sec_of(bar)
        if sec in ("Intro", "Outro"):
            continue
        v = voice_lead(ch, prevv, 4, 57, 81)
        prevv = v
        hits = (0, 0.75, 1.5, 2.5, 3.0, 3.5) if sec == "B" else (0.5, 1.5, 2.5, 3.5)
        vel = 82 if sec == "B" else 60
        for j, t in enumerate(hits):
            for p in v:
                stab.note(start + t, 0.28, p, vel + (12 if t in (0, 1.5) else 0), jitter=0.003)
    stab.cc(0, 11, 104)

    # ---------------- bass: A = octave bounce, B = held root + pickups, Intro/Outro = whole notes
    prev = 42
    for start, dur, ch in prog:
        bar, _ = song.bar_of(start)
        sec = sec_of(bar)
        root = nearest(ch.bass, prev, 33, 45)
        prev = root
        k = SEC_DYN[sec]
        if sec in ("Intro", "Outro"):
            bass.note(start, 3.8, root, 78 * k)
        elif sec == "B":
            for t, d in ((0, 0.7), (0.75, 0.7), (1.5, 0.9), (2.5, 0.45), (3, 0.45), (3.5, 0.45)):
                bass.note(start + t, d, root + (12 if t == 3.5 and root + 12 <= 55 else 0), 96 * k, jitter=0.003)
        else:
            for j in range(8):
                bass.note(start + j * 0.5, 0.4, root + (12 if j % 2 and root + 12 <= 55 else 0), (92 if j % 2 == 0 else 78) * k,
                          jitter=0.003)
    bass.cc(0, 11, 108)

    # ---------------- drums (TR-808)
    BD, CL, CH, OH, CR, CB = 36, 39, 42, 46, 49, 56
    d = drums
    for bar in range(32):
        s = bs(bar)
        sec = sec_of(bar)
        k = SEC_DYN[sec]
        if sec == "Intro":
            if bar == 3:       # build: claps in 8ths, then 16ths
                for i in range(4):
                    d.note(s + i * 0.5, 0.2, CL, 50 + 8 * i)
                for i in range(8):
                    d.note(s + 2 + i * 0.25, 0.15, CL, 70 + 6 * i, jitter=0.002)
            continue
        if sec == "Outro":
            if bar == 28:
                d.note(s, 2, CR, 90)
                d.note(s, 0.4, BD, 100)
            continue
        if bar in (4, 12, 20):
            d.note(s, 2, CR, 98)
        if sec == "B":
            for t in (0, 0.75, 1.5, 2.5):
                d.note(s + t, 0.4, BD, 108 * k)
            d.note(s + 1, 0.3, CL, 96 * k)
            d.note(s + 3, 0.3, CL, 100 * k)
            for i in range(8):
                d.note(s + i * 0.5, 0.15, CH, (70 if i % 2 else 52) * k, jitter=0.003)
            if bar == 19:      # fill into A2
                for i in range(8):
                    d.note(s + 2 + i * 0.25, 0.15, CL, 60 + 7 * i, jitter=0.002)
        else:
            for t in range(4):
                d.note(s + t, 0.4, BD, (104 if t == 0 else 94) * k)
            d.note(s + 1, 0.3, CL, 86 * k)
            d.note(s + 3, 0.3, CL, 90 * k)
            for i in range(4):
                d.note(s + i + 0.5, 0.25, OH, 66 * k, jitter=0.003)
            if bar % 4 == 3:
                d.note(s + 3.5, 0.2, CB, 70 * k)
    d.cc(0, 11, 100)
    return song


if __name__ == "__main__":
    main(build(), keep_work="--keep" in sys.argv, loop_key="rare")
