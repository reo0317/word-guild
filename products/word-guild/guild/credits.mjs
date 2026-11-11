// クレジットの文面。data/LICENSE-DATA.md と同じ内容（tests/guild-data.test.mjs が突き合わせる）。
export const CREDITS = {
  lists: [
    {name: 'TOEIC Service List 1.2', url: 'https://www.newgeneralservicelist.com/toeic-service-list'},
    {name: 'New General Service List 1.2', url: 'https://www.newgeneralservicelist.com/new-general-service-list'},
  ],
  author: '© Dr. Charles Browne',
  license: {name: 'Creative Commons Attribution-ShareAlike 4.0 International（CC BY-SA 4.0）', url: 'https://creativecommons.org/licenses/by-sa/4.0/'},
  changes: [
    'NGSL から基本語150語を選び出した。',
    '語を章と棚に割り当てた。',
    '日本語訳、品詞、英語の例句とその日本語訳を独自に追加した。',
  ],
  note: '上の変更を含む語彙データも、CC BY-SA 4.0 で公開します。ゲームのコード、絵、音楽、音声は、このライセンスの対象外です。',
};
