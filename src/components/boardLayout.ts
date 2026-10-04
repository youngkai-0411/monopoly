export const BOARD_COLUMNS=11;
export const BOARD_ROWS=11;
export function boardCell(index:number) {
 if(!Number.isInteger(index)||index<0||index>=40)throw new RangeError('Board index must be 0–39.');
 if(index<=10)return {gridColumn:11-index,gridRow:11};
 if(index<=20)return {gridColumn:1,gridRow:21-index};
 if(index<=30)return {gridColumn:index-19,gridRow:1};
 return {gridColumn:11,gridRow:index-29};
}
