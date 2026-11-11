// ローカルに同梱した公式無料音源。出典・条件は assets/music/CREDITS.md。
const cue=(track,url,gain)=>Object.freeze({track,url,gain,start:0,end:null});
export const MUSIC_CUES=Object.freeze({
 top:cue('nandeshou','assets/music/nandeshou.wgm',.32),
 battle:cue('breeze3','assets/music/breeze3-loop.mp3',.28),
 boss:cue('flap2','assets/music/flap2-loop.mp3',.28),
 final:cue('raid','assets/music/raid-loop.mp3',.24),
 return:cue('gudaguda','assets/music/gudaguda.wgm',.38)
});
export function musicRange(scene,duration){const c=MUSIC_CUES[scene]||MUSIC_CUES.top;if(!Number.isFinite(duration)||duration<=.1)throw Error('音源が短すぎます');return [c.start,c.end??duration];}
export function musicBytes(buffer){const bytes=new Uint8Array(buffer);if(bytes.length>=4&&String.fromCharCode(...bytes.slice(0,4))==='WGM1')return bytes.slice(4).map(b=>b^0xa7).buffer;return buffer;}
