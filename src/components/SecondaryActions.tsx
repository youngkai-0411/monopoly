import { GameIcon } from './GameIcon';
export function SecondaryActions({disabled,onAssets,onCards,onLog}:{disabled:boolean;onAssets:()=>void;onCards:()=>void;onLog:()=>void}){
 return <nav className="secondary-actions game-occluder" aria-label="Thông tin của bạn" data-muted={disabled}>{([['home','Tài sản',onAssets],['cards','Thẻ',onCards],['log','Nhật ký',onLog]] as const).map(([icon,label,action])=><button key={label} disabled={disabled} onClick={action} aria-label={label}><GameIcon name={icon}/><small>{label}</small></button>)}</nav>;
}
