// 石の最後の落下は、最大遅延485ms + 落下550ms = 1035ms。
// 入力再開には65msの余裕を設ける。
export const durations=Object.freeze({
 defeated:750,
 travel:1700,
 // 新録音の現在発話の残り(最大4.342秒)、番人の承認3.553秒、
 // 女性しるべの帰還案内3.924秒を収める。音声終了には依存しない。
 returning:12000,
 freezing:6000,
 bewildered:6500,
 arriving:1100,
 intrusion:1400,
 counter:1100,
 // HP0を独立表示。escapeの指定台詞の後にだけ救出回復する。
 // 同梱録音の実尺: 逃します1.486秒、着地の注意1.927秒、
 // 通常ボス到着2.496秒、加入4.679秒。各区間に500ms以上の余裕。
 // tests/word-guild-transition.test.mjsでmanifestの再生区間を検査する。
 // 音声終了通知に依存せず進み、非表示中はappの時計を停止する。
 loss:1100,
 escape:3000,
 rescue:900,
 sendoff:3800,
 launch:1400,
 fall:1200,
 land:900,
 bossArrival:1700,
 bossLand:2300,
 recruited:5200
});
