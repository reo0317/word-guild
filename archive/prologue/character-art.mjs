// 受領素材: quality/characters-v8/HANDOFF.md / asset-records.json。
// 原画ではなく256px・可逆WebPの表示用素材を参照する。
export const CHARACTER_VERSION=8;
export const CHARACTERS=Object.freeze(['male','female','fire','water','grass','guide','cat','dog','sun','ant','animal','final']);
export const EXPRESSIONS=Object.freeze(['idle','blink','joy','worried','action-1','action-2']);
export const RETURN_POSES=Object.freeze(['launch','fall','land']);
export const CHARACTER_ART=Object.freeze(Object.fromEntries(CHARACTERS.map(id=>{
 const poses=Object.freeze(['male','female'].includes(id)?[...EXPRESSIONS,...RETURN_POSES]:[...EXPRESSIONS]);
 const frames=Object.freeze(Object.fromEntries(poses.map(pose=>[pose,`assets/${id}-${pose}-display-v${CHARACTER_VERSION}.webp`])));
 return [id,Object.freeze({id,version:CHARACTER_VERSION,width:256,height:256,baseline:240,poses,frames,
  action2:['cat','dog','sun','ant','animal'].includes(id)?'defeat':id==='guide'?'surprise':id==='final'?'strike':'action'})];
})));
