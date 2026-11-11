import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.window={};
const {Conversation}=await import('../conversation.mjs');

test('同じ発話の復帰失敗を再試行すると、保持した位置からresumeする',async()=>{
 let resumes=0,starts=0,cleared=false;
 const context={resume:()=>Promise.resolve()};
 const player={snapshot:{state:'error',id:'dialogue:7',position:1.7},
  resume(){resumes++;return Promise.resolve({status:'playing'});}};
 const conversation={music:{context},player,failedLoad:false,currentId:"dialogue:7",fallback:true,
  director:{snapshot:{current:{playbackId:'dialogue:7'}},resume(){}},
  startLine(){starts++;},onError(message){cleared=message==='';},paintButton(){}};
 Conversation.prototype.enable.call(conversation);
 await Promise.resolve();
 assert.equal(resumes,1);assert.equal(starts,0);assert.equal(player.snapshot.position,1.7);
 assert.equal(cleared,true);assert.equal(conversation.fallback,false);
});

test('別の発話または音声未収録の失敗は、新しい発話を再生する',()=>{
 for(const id of [null,'dialogue:old']){
  let resumes=0,starts=0;
  const conversation={music:{context:{resume:()=>Promise.resolve()}},
   player:{snapshot:{state:'error',id},resume(){resumes++;}},failedLoad:false,
   director:{snapshot:{current:{playbackId:'dialogue:new'}},resume(){}},
   startLine(line){assert.equal(line.playbackId,'dialogue:new');starts++;},
   onError(){},paintButton(){}};
  Conversation.prototype.enable.call(conversation);
  assert.equal(resumes,0);assert.equal(starts,1);
 }
});

test('字幕代替の時計は非表示と会話停止中に進まず、古い声の終了を代行しない',()=>{
 const ended=[];
 const conversation={hidden:true,fallback:true,currentId:'dialogue:9',remaining:200,
  director:{snapshot:{paused:false},onLineEnded:id=>ended.push(id)}};
 Conversation.prototype.advance.call(conversation,1000);assert.equal(conversation.remaining,200);
 conversation.hidden=false;conversation.director.snapshot.paused=true;
 Conversation.prototype.advance.call(conversation,1000);assert.equal(conversation.remaining,200);
 conversation.director.snapshot.paused=false;conversation.fallback=false;
 Conversation.prototype.advance.call(conversation,1000);assert.deepEqual(ended,[]);
 conversation.fallback=true;
 Conversation.prototype.advance.call(conversation,201);assert.deepEqual(ended,['dialogue:9']);
});
