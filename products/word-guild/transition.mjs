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
 launch:1400,
 fall:1200,
 land:900
});
