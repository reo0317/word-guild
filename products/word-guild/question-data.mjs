// 2026-10-05: 実在する専門語。手掛かりは独自の日本語要約で、出典本文は転載しない。
const question=(answer,clue,path,sourceTitle,sourceUrl)=>Object.freeze({
 answer,clue,path:Object.freeze(path),sourceTitle,sourceUrl
});
export const BOSS_QUESTIONS=Object.freeze({
 4:Object.freeze([
  question('cat','猫',[8,9,10],'チュートリアル既習語',''),
  question('dog','犬',[5,12,19],'チュートリアル既習語',''),
  question('ant','アリ',[29,30,37],'チュートリアル既習語','')
 ]),
 5:Object.freeze([
  question('cryoconite','氷河表面の微生物を伴う塵の堆積物',[0,1,2,3,4,5,6,13,12,11],
   'NSIDC Cryosphere Glossary: cryoconite','https://nsidc.org/learn/cryosphere-glossary/cryoconite'),
  question('sastrugi','風が雪面に作る畝状の凹凸',[14,15,16,17,18,19,20,27],
   'NSIDC Cryosphere Glossary: sastrugi','https://nsidc.org/learn/cryosphere-glossary/sastrugi'),
  question('tafoni','岩肌に群生する丸い風化穴',[35,36,37,38,39,40],
   'U.S. National Park Service: Tafoni','https://www.nps.gov/articles/tafoni.htm')
 ])
});
export function bossPaths(stage){
 return Object.freeze(Object.fromEntries(BOSS_QUESTIONS[stage].map(q=>[q.answer,q.path])));
}
