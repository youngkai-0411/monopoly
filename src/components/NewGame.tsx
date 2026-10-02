import { useState, type FormEvent } from 'react';
import { GAME_RULES } from '../game/rules/config';
import { useGameStore } from '../store/gameStore';
import { PLAYER_TOKENS, money } from './format';

export function NewGame() {
  const [count,setCount]=useState(2);
  const [names,setNames]=useState(['Nghĩa','Kai','An','Linh']);
  const start=useGameStore(state=>state.startLocalGame);
  const error=useGameStore(state=>state.error);
  function submit(event: FormEvent) { event.preventDefault(); start(names.slice(0,count)); }
  return <section className="setup-screen">
    <form className="setup-card" onSubmit={submit}>
      <div className="setup-intro"><span className="section-kicker">CHƠI CÙNG NHAU</span><h1>Bắt đầu ván mới</h1><p>2–4 người chơi trên cùng thiết bị.<br/>Mỗi người có {money(GAME_RULES.startingMoney)}.</p></div>
      <div className="setup-fields">
        <fieldset className="player-count"><legend>Số người chơi</legend>{[2,3,4].map(value=><button key={value} type="button" className={count===value?'selected':''} aria-pressed={count===value} onClick={()=>setCount(value)}>{value} người</button>)}</fieldset>
        <div className="name-fields">{names.slice(0,count).map((name,index)=><label key={index}><span>{PLAYER_TOKENS[index]} Người {index+1}</span><input required maxLength={24} value={name} autoComplete="off" onChange={event=>setNames(names.map((old,i)=>i===index?event.target.value:old))}/></label>)}</div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" type="submit">Vào bàn chơi →</button>
      </div>
    </form>
  </section>;
}
