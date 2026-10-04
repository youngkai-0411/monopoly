import { useState, type FormEvent } from 'react';
import { GAME_RULES } from '../game/rules/config';
import { useGameStore } from '../store/gameStore';
import { PlayerIndicator } from './PlayerIndicator';
import { GameIcon } from './GameIcon';
import { money } from './format';

export function NewGame() {
  const [count,setCount]=useState(2);
  const [names,setNames]=useState(['Nghĩa','Kai','An','Linh']);
  const start=useGameStore(state=>state.startLocalGame);
  const error=useGameStore(state=>state.error);
  function submit(event: FormEvent) { event.preventDefault(); start(names.slice(0,count)); }
  return <section className="setup-screen">
    <form className="setup-card" onSubmit={submit}>
      <div className="setup-intro"><span className="section-kicker">HÀNH TRÌNH VIỆT NAM</span><div className="setup-illustration" aria-hidden="true"><GameIcon name="palm"/><i/><GameIcon name="home"/><i/><GameIcon name="train"/><i/><GameIcon name="lantern"/></div><h1>Cùng nhau xây<br/>một hành trình</h1><p>2–4 người chơi trên cùng thiết bị.<br/>40 ô · 8 nhóm màu · Bàn cờ 3D.<br/>Mỗi người có {money(GAME_RULES.startingMoney)}.</p></div>
      <div className="setup-fields">
        <fieldset className="player-count"><legend>Số người chơi</legend>{[2,3,4].map(value=><button key={value} type="button" className={count===value?'selected':''} aria-pressed={count===value} onClick={()=>setCount(value)}>{value} người</button>)}</fieldset>
        <div className="name-fields">{names.slice(0,count).map((name,index)=><label key={index}><span><PlayerIndicator index={index}/> Người {index+1}</span><input required maxLength={24} value={name} autoComplete="off" onChange={event=>setNames(names.map((old,i)=>i===index?event.target.value:old))}/></label>)}</div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit">Vào bàn chơi →</button>
        <a className="graphics-preview-link" href="/?graphics=1">Khám phá bàn cờ trước ↗</a>
      </div>
    </form>
  </section>;
}
