"""音楽担当の新規編曲。現行工房の合成器を読み取り専用で呼び出す。"""

import argparse
import json
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "atelier-assets/musician"


def note(pitch, start, beats, velocity):
    return dict(pitch=pitch, start=start, beats=beats, velocity=velocity)


def arrangement():
    # 80 BPM: 32拍 = 8小節 = 24秒。後半も同テンポで細分を増やす。
    tracks = [
        dict(instrument="piano", gain=0.48, pan=0.06, notes=[]),
        dict(instrument="piano", gain=0.22, pan=-0.42, notes=[]),
        dict(instrument="strings", gain=0.16, pan=0.42, notes=[]),
        dict(instrument="pad", gain=0.09, pan=-0.30, notes=[]),
        dict(instrument="bass", gain=0.29, pan=0.0, notes=[]),
        dict(instrument="drums", gain=0.14, pan=0.10, notes=[]),
    ]
    # 主旋律は既存素材とは異なるオリジナル。小節末の空白で呼吸を作る。
    home = [
        [(69, 0, 0.75), (72, 1, 0.75), (67, 2, 1.5)],
        [(64, 0, 1), (67, 1.25, 0.5), (76, 2, 0.75), (74, 3, 0.5)],
        [(77, 0, 1.25), (76, 1.5, 0.5), (74, 2.25, 1.25)],
        [(74, 0, 1), (69, 1.25, 0.75), (65, 2.5, 1)],
        [(67, 0, 1), (70, 1.25, 0.5), (69, 2, 0.75), (74, 3, 0.5)],
        [(72, 0, 1), (67, 1.25, 0.5), (64, 2, 0.75), (67, 3, 0.5)],
        [(65, 0, 1), (69, 1.25, 0.75), (74, 2.5, 1)],
        [(76, 0, 0.75), (74, 1.25, 0.5), (72, 2.25, 0.75)],
    ]
    battle = [
        [(69, 0, 0.45), (74, 0.5, 0.45), (77, 1, 0.85), (76, 2, 0.45), (74, 2.5, 1)],
        [(77, 0, 0.7), (74, 1, 0.45), (72, 1.5, 0.45), (70, 2.25, 0.7), (69, 3.25, 0.45)],
        [(69, 0, 0.45), (72, 0.5, 0.45), (77, 1, 0.85), (79, 2.25, 0.45), (77, 3, 0.65)],
        [(76, 0, 0.7), (74, 1, 0.45), (72, 1.5, 0.45), (69, 2.25, 0.7), (67, 3.25, 0.45)],
        [(74, 0, 0.45), (77, 0.5, 0.45), (81, 1, 0.85), (79, 2, 0.45), (77, 2.5, 1)],
        [(79, 0, 0.7), (77, 1, 0.45), (74, 1.5, 0.45), (70, 2.25, 0.7), (69, 3.25, 0.45)],
        [(77, 0, 0.45), (74, 0.5, 0.45), (70, 1, 0.85), (72, 2.25, 0.45), (74, 3, 0.65)],
        [(76, 0, 0.7), (74, 1, 0.45), (72, 1.5, 0.45), (67, 2.25, 0.75)],
    ]
    for section, phrases in enumerate([home, battle]):
        for bar, phrase in enumerate(phrases):
            contour = [0.91, 0.93, 1.0, 0.88, 0.96, 0.90, 0.95, 0.82][bar]
            for index, (pitch, offset, gate) in enumerate(phrase):
                strength = (0.78 if section else 0.69) * contour
                strength *= [1.0, 0.88, 0.96, 0.83, 0.90][index]
                tracks[0]["notes"].append(
                    note(pitch, section * 32 + bar * 4 + offset, gate, round(strength, 3))
                )

    roots = [[41, 40, 38, 34, 43, 36, 34, 36], [38, 34, 41, 36, 38, 43, 34, 36]]
    # 3声の弦と別のpadの色彩音で、同時発音と滑らかな声部進行を設計。
    harmony = [
        [
            [57, 60, 64],
            [55, 60, 64],
            [57, 60, 65],
            [57, 62, 65],
            [58, 62, 65],
            [55, 62, 64],
            [57, 62, 65],
            [57, 62, 64],
        ],
        [
            [57, 60, 65],
            [57, 62, 65],
            [57, 60, 65],
            [57, 60, 64],
            [57, 60, 65],
            [58, 62, 65],
            [57, 62, 65],
            [55, 62, 64],
        ],
    ]
    for section in range(2):
        for bar in range(8):
            base = section * 32 + bar * 4
            chord = harmony[section][bar]
            for index, pitch in enumerate(chord):
                tracks[2]["notes"].append(
                    note(
                        pitch,
                        base,
                        3.1 if bar == 7 else 3.4,
                        round((0.57 if section else 0.49) - index * 0.035, 3),
                    )
                )
            arp = [chord[0] + 12, chord[2] + 12]
            for index, offset in enumerate([0.5, 2.5] if not section else [0.25, 1.5, 2.25, 3.25]):
                tracks[1]["notes"].append(
                    note(
                        arp[index % 2],
                        base + offset,
                        0.25 if section and bar == 7 and index == 3 else 0.375,
                        [0.39, 0.32, 0.36, 0.30][index],
                    )
                )
            root = roots[section][bar]
            tracks[4]["notes"].append(note(root, base, 2.6 if not section else 1.4, 0.55))
            if section:
                tracks[4]["notes"].append(note(root + 7, base + 2, 1.25, 0.43))
            if bar % 2 == 0:
                for pitch in [chord[0], chord[1] + 12]:
                    tracks[3]["notes"].append(note(pitch, base + 0.125, 6.75, 0.34))
            if section:
                for pitch, offset, velocity in [
                    (36, 0, 0.46),
                    (42, 1, 0.25),
                    (38, 2, 0.27),
                    (42, 3, 0.21),
                ]:
                    tracks[5]["notes"].append(note(pitch, base + offset, 0.125, velocity))
            else:
                tracks[5]["notes"].append(note(42, base + 1.5, 0.125, 0.16))
                if bar % 2 == 0:
                    tracks[5]["notes"].append(note(36, base, 0.125, 0.24))
    for track in tracks:
        track["notes"].sort(key=lambda n: (n["start"], n["pitch"]))
    return {
        "summary": (
            "最新の音楽変更依頼を旧単旋律・音楽維持条件より優先した新規オリジナル編曲。"
            "共通80 BPM、4/4、各8小節32拍24秒、全64拍48秒。ホーム『木漏れ日の書架』はF長調、"
            "Fmaj9–C/E–Dm7–Bbmaj7–Gm9–Cadd9–Bbmaj7–C6/9。戦闘『ことばの小径』はD短調／F長調、"
            "Dm7–Bbmaj7–Fadd9–C6–Dm7–Gm7–Bbmaj7–Cadd9。"
            "6トラック：ピアノ主旋律gain0.48/pan+0.06、ピアノ分散伴奏0.22/-0.42、"
            "弦3声和音0.16/+0.42、パッド2声0.09/-0.30、低音0.29/0、打楽器0.14/+0.10。"
            "音符velocityとフレーズ末の休符で抑揚を設計し、戦闘では細分と低音の5度を増やす。"
            "現行core.mjsの秒区間を確認済み。現行工房のローカル合成器で実生成・検査："
            "44100Hz、16bit、2ch、2116800フレーム。ホーム・選択・帰還後[0,1058400)、"
            "戦闘・移動・乱入・帰還演出[1058400,2116800)。終了サンプルは排他的。"
            "各曲末は全楽器のリリースを区間内に収め、独立24秒ループでも曲間の混入と境界クリックを防ぐ。"
            "実数値とブラウザー再生検査はquality/music-validation.json・music-browser-results.json、"
            "担当説明はatelier-assets/musician/README.md。聴き心地とiPhone実機はhuman_checksとして未確認。"
            "爪痕・ゲーム実装は他担当の範囲。歌声・生録音・外部素材は使用していない。"
        ),
        "title": "木漏れ日の書架／ことばの小径",
        "bpm": 80,
        "duration_beats": 64,
        "tracks": tracks,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--engine-root", type=Path)
    args = parser.parse_args()
    engine = args.engine_root
    if engine is None:
        engine = next(
            (p for p in ROOT.parents if (p / "src/agent_lab/studio/music.py").is_file()), None
        )
    if engine is None:
        raise SystemExit(
            "現行工房のパスを --engine-root で指定してください。工房本体は変更しません。"
        )
    sys.path.insert(0, str(engine / "src"))
    from agent_lab.studio.music import save_arrangement

    score = arrangement()
    OUT.mkdir(parents=True, exist_ok=True)
    # 最終返却用は楽譜schemaの5キーだけ。工房保存版にはrender情報も付く。
    (OUT / "submission-score.json").write_text(
        json.dumps(score, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    save_arrangement(ROOT, score)
    release = {"piano": 0.3, "strings": 0.45, "pad": 0.6, "bass": 0.15}
    for track in score["tracks"]:
        for item in track["notes"]:
            boundary = 24 if item["start"] < 32 else 48
            gate = item["beats"] * 0.75
            tail = release.get(track["instrument"], 0.15)
            if track["instrument"] == "drums":
                gate = {36: 0.25, 38: 0.18, 42: 0.055}[item["pitch"]]
                tail = 0.015
            assert item["start"] * 0.75 + gate + tail <= boundary
    with wave.open(str(OUT / "music.wav"), "rb") as wav:
        rate, channels, frames = wav.getframerate(), wav.getnchannels(), wav.getnframes()
        signal = np.frombuffer(wav.readframes(frames), dtype="<i2").reshape(-1, channels) / 32768
    assert (rate, channels, frames) == (44100, 2, 2116800)
    sections = []
    for name, start, end in [("home", 0, 1058400), ("battle", 1058400, 2116800)]:
        clip = signal[start:end]
        # 独立ループの継ぎ目も、連結した二曲の継ぎ目も同じ値で検査。
        jump = float(np.max(np.abs(clip[-1] - clip[0])))
        tail_peak = float(np.max(np.abs(clip[-441:])))
        stereo_difference = float(np.sqrt(np.mean((clip[:, 0] - clip[:, 1]) ** 2)))
        assert jump == 0 and tail_peak == 0
        assert stereo_difference > 0.005
        sections.append(
            dict(
                name=name,
                start_sample=start,
                end_sample_exclusive=end,
                duration_seconds=24,
                loop_jump=jump,
                last_10ms_peak=tail_peak,
                peak=float(np.max(np.abs(clip))),
                rms=float(np.sqrt(np.mean(clip**2))),
                stereo_difference_rms=stereo_difference,
            )
        )
    peak = float(np.max(np.abs(signal)))
    assert 0.1 < peak <= 0.89
    assert np.count_nonzero(np.abs(signal) >= 1) == 0
    validation = dict(
        passed=True,
        engine=str(engine / "src/agent_lab/studio/music.py"),
        source="local_synthesis",
        sample_rate=rate,
        channels=channels,
        sample_width_bits=16,
        frames=frames,
        duration_seconds=48,
        track_count=len(score["tracks"]),
        notes_per_track=[len(t["notes"]) for t in score["tracks"]],
        clipped_samples=0,
        all_release_tails_within_scene=True,
        peak=peak,
        sections=sections,
        human_checks=[
            "音楽の聴き心地、音色、音量、長時間ループの印象",
            "iPhone 17 / iOS 26.1 Safariとホーム画面起動の再生",
        ],
    )
    (ROOT / "quality/music-validation.json").write_text(
        json.dumps(validation, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(validation, ensure_ascii=False))


if __name__ == "__main__":
    main()
