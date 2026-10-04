import { useEffect,useRef } from 'react';
import { ASSET_BY_ID } from '../game/data/properties';
import type { GameState } from '../game/types/domain';
import { buildingLabel } from '../game/engine/selectors';
import { displayLandmark,rentLabel } from './gameplayUI';
import { money } from './format';
import { PlayerIndicator } from './PlayerIndicator';
import { GameIcon } from './GameIcon';
export function PropertyContextCard({game,id,onDetail,onClose,focusRequested}:{game:GameState;id:string;onDetail:()=>void;onClose:()=>void;focusRequested:boolean}){
 const ref=useRef<HTMLElement>(null);
 useEffect(()=>{if(focusRequested)ref.current?.querySelector<HTMLButtonElement>('button')?.focus({preventScroll:true});},[id,focusRequested]);
 const p=ASSET_BY_ID.get(id)!,state=game.properties[id],owner=game.players.find(a=>a.id===state.ownerId),landmark=displayLandmark(p);
 return <aside ref={ref} className="property-context game-occluder" aria-label={'Thông tin '+p.name}><div className="context-heading"><strong>{p.name}</strong><button aria-label="Ẩn thông tin tài sản" onClick={onClose}><GameIcon name="close"/></button></div>{landmark&&<p>{landmark}</p>}<dl><div><dt>Chủ</dt><dd>{owner&&<PlayerIndicator index={game.players.indexOf(owner)}/>} {owner?.name??'Chưa có chủ'}</dd></div><div><dt>{p.kind==='LAND'?'Công trình':'Loại'}</dt><dd>{p.kind==='LAND'?buildingLabel(state.level):p.kind==='RAILROAD'?'Ga tàu':'Tiện ích'}</dd></div><div><dt>Giá</dt><dd>{money(p.price)}</dd></div><div><dt>Thuê</dt><dd>{rentLabel(game,p)}</dd></div></dl><button className="context-detail" onClick={onDetail}>Xem chi tiết ↗</button></aside>;
}
