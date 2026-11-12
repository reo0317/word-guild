import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parseLine, inflects, letterView, clipFor, clipParts, wordToLine} from '../products/word-guild/guild/story.mjs';
import {checkStory} from '../tools/story-check.mjs';
const words = JSON.parse(await readFile(new URL('../products/word-guild/data/words.json', import.meta.url)));
const allow = JSON.parse(await readFile(new URL('../products/word-guild/data/story-allow.json', import.meta.url)));
const sample = [
 'They {say} the fog ate our words. I {think} you {know} it is {time} to {see} for yourself.',
 '{Good} {people} {come} to {work} here every {year}, but few stay.',
 '{Use} this {new} bag, {look} at each name, and {give} people what they {want}: their words.',
 'You will {find} your {way} in a {day}. All you {need} is on the {back} of the map.',
 'One {last} thing: if a {child} asks what the fog {means}, {tell} the truth, then {call} me.'
];
const ids = [[1,3,2,4,5],[6,7,9,10,8],[11,15,12,14,13],[17,16,18,19,20],[22,23,21,24,25]].map(row => row.map(n => `b${String(n).padStart(4,'0')}`));
const story = {v:1, letters:[{shelf:1,ch:1,kind:'memo',from:'Chief Hatori',to:'Tsumugi',lines:sample.map((en,i) => ({en,ja:'訳',ids:ids[i]}))}]};

test('物語：parseLine は原文を保ち、複合語・アクセント・括弧の不正を扱う', () => {
 const s = "A {ice cream}, {résumé}, {o'clock} and {e-book}.";
 assert.equal(parseLine(s).map(p=>p.text).join(''), s.replace(/[{}]/gu,''));
 assert.equal(parseLine('{time}')[0].type,'word');
 for (const s of ['{}','{bad','bad}','{{bad}}']) assert.throws(()=>parseLine(s));
});
test('物語：規則変化、e/y/子音、大小文字。不規則形と派生語を拒否', () => {
 for (const [w,f] of [['say','says'],['try','tries'],['watch','watches'],['hope','hoped'],['make','making'],['die','dying'],['run','running'],['big','bigger'],['happy','happiest'],['look','Look'],['résumé','résumé'],['ice cream','ice cream']]) assert.ok(inflects(w,f),`${w}/${f}`);
 for (const [w,f] of [['say','said'],['know','knew'],['child','children'],['happy','happily'],['work','workerly'],['move','movement'],['look','looksing']]) assert.equal(inflects(w,f),false);
});
test('物語：gone/thin/ink/worn と可読性。box0 も一度出会えば消さない', () => {
 const progress={words:{}};
 assert.equal(letterView(story,words,progress,1,100).readable,false);
 const states = [undefined,{box:1,due:101},{box:3,due:101},{box:3,due:100},{box:0,due:99}];
 ids[0].forEach((id,i)=>{if(states[i])progress.words[id]=states[i];});
 const view=letterView(story,words,progress,1,100);
 assert.deepEqual(view.lines[0].parts.filter(p=>p.type==='word').map(p=>p.state),['gone','thin','ink','worn','worn']);
 for(const id of ids.flat())progress.words[id]={box:0,due:100};
 assert.equal(letterView(story,words,progress,1,100).readable,true);
 assert.equal(letterView(story,words,progress,99,100),null);
 assert.equal(story.letters[0].lines[0].parts,undefined);
});
test('物語：id 索引と表示形を保持した半角34字までの切り抜き', () => {
 assert.equal(wordToLine(story).get('b0023').lineIndex,4);
 assert.ok(clipFor(story,'b0021',17).includes('means'));
 assert.ok(clipFor(story,'b0021',17).length<=34);
 assert.equal(clipFor(story,'unknown',17),'');
 assert.equal(clipFor(story,'b0001',0),'');
});
function fixture(){
 const ws=Array.from({length:1400},(_,i)=>({id:`x${i}`,w:`token${i}`,shelf:Math.floor(i/25)+1,ch:i<150?1:Math.floor((i-150)/250)+2}));
 const letters=Array.from({length:56},(_,i)=>({shelf:i+1,ch:ws[i*25].ch,kind:'memo',from:'A',to:'B',lines:Array.from({length:5},(_,j)=>{const group=ws.slice(i*25+j*5,i*25+j*5+5);return {en:group.map(w=>`{${w.w}}`).join(' ')+' a a a a a a a.',ja:'訳',ids:group.map(w=>w.id)};})}));
 return {ws,s:{v:1,letters,blank:Array.from({length:6},(_,i)=>({ch:i+1,en:'Words are heavy.',ja:'訳'}))},a:{words:['a'],names:[]}};
}
test('物語検査：56通280行1400語を全件検査、欠落・重複・割当・活用・語数・許可語・記号・訳',()=>{
 const {ws,s,a}=fixture();
 assert.deepEqual(checkStory(s,ws,a).issues,[]);
 for(const mutate of [s=>s.letters.pop(),s=>s.letters[0].shelf=2,s=>s.blank.pop(),s=>s.letters[0].lines.pop(),s=>s.letters[0].lines[0].ids[0]='bad',s=>s.letters[0].lines[0].en='{said}',s=>s.letters[0].lines[0].ja='',s=>s.letters[0].lines[0].en+=' forbidden。']){
  const copy=structuredClone(s);mutate(copy);assert.ok(checkStory(copy,ws,a).issues.length);
 }
});
test('物語検査：後の区の語の数と上限、括弧外の対象語重複',()=>{
 const {ws,s,a}=fixture();
 ws[1000].w='future';
 s.letters[0].lines[0].en+=' future future future future token0';
 const r=checkStory(s,ws,a);
 assert.ok(r.reports[0].includes('後の区の語 4'));
 assert.ok(r.issues.some(x=>x.includes('上限3')));
 assert.ok(r.issues.some(x=>x.includes('括弧外')));
});
test('物語：allow 初版の上限と見本5行の検査が実行できる',()=>{
 assert.ok(allow.words.length<=600);
 assert.equal(new Set(allow.words).size,allow.words.length);
 const r=checkStory(story,words,allow,{partial:true});
 assert.ok(r.reports[0].includes('通1:'));
 assert.ok(Array.isArray(r.issues));
 console.log('見本5行の検査:', r.reports.join(' / '), r.issues.length ? r.issues.join(' / ') : '問題なし');
});
// 本番データが届いた場合は、件数・全語一回・語彙を同じ検査で保証する。
try {
 const full=JSON.parse(await readFile(new URL('../products/word-guild/data/story.json',import.meta.url)));
 test('物語：本番データの全件検査',()=>assert.deepEqual(checkStory(full,words,allow).issues,[]));
} catch(e) { if(e.code!=='ENOENT')throw e; }
test('物語：clipParts は語を分けて返し、clipFor と同じ文になる',()=>{
 const c=clipParts(story,'b0021',17);
 assert.equal(c.word,'means');
 assert.equal((c.left+c.word+c.right).trim(),clipFor(story,'b0021',17));
 assert.equal(clipParts(story,'unknown'),null);
});
