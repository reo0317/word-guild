// なぞりの規則（旧 core.mjs の Trace を写したもの。規則は変えない）。
const CELLS = 42;
const COLS = 7;
export const BOARD = Array.from({length: CELLS}, () => 'N').map((c, i) => ({8: 'C', 9: 'A', 10: 'T'}[i] ?? c));
export function adjacent(a,b){return Number.isInteger(a)&&Number.isInteger(b)&&a>=0&&b>=0&&a<CELLS&&b<CELLS&&Math.abs(a%COLS-b%COLS)+Math.abs(Math.floor(a/COLS)-Math.floor(b/COLS))===1;}
export class Trace{
 constructor(board=BOARD){this.board=board;this.cancel();}
 cancel(){this.pointer=null;this.path=[];}
 start(id,index){if(this.pointer!==null||!Number.isInteger(index)||index<0||index>=CELLS)return false;this.pointer=id;this.path=[index];return true;}
 add(id,index){if(this.pointer===null||id!==this.pointer||!adjacent(this.path.at(-1),index))return false;if(this.path.length>1&&this.path.at(-2)===index)this.path.pop();else this.path.push(index);return true;}
 get text(){return this.path.map(i=>this.board[i]).join('');}
 finish(id){if(this.pointer===null||id!==this.pointer)return null;const text=this.text;this.cancel();return text;}
}
