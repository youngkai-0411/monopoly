const pips: Record<number, number[]> = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
};
const adjacent: Record<number, number[]> = {
  1: [1, 6, 3, 4, 2, 5], 2: [2, 5, 3, 4, 6, 1], 3: [3, 4, 6, 1, 2, 5],
  4: [4, 3, 1, 6, 2, 5], 5: [5, 2, 3, 4, 1, 6], 6: [6, 1, 4, 3, 2, 5],
};
const faces = ['front', 'back', 'right', 'left', 'top', 'bottom'];

export function Dice({ values, total, rolling }: { values: readonly number[] | undefined; total: number | undefined; rolling: boolean }) {
  return <div className={`dice-row sculpted-dice ${rolling ? 'rolling' : ''}`} role="img"
    aria-label={rolling ? 'Đang đổ xúc xắc' : `Xúc xắc: ${values?.join(', ') ?? 'chưa đổ'}, tổng ${total ?? 'chưa có'}`}>
    {(values ?? [0, 0]).map((value, i) => <div className="die-stage" key={i} aria-hidden="true">
      <div className="dice-shadow"/><div className="dice-cube">
        {faces.map((face, j) => <div className={`dice-face dice-${face}`} key={face}>
          {(value || j > 0) ? Array.from({ length: 9 }, (_, dot) => <i className={pips[(adjacent[value] ?? adjacent[1])[j]].includes(dot) ? 'pip' : ''} key={dot}/>) : <span>?</span>}
        </div>)}
      </div>
    </div>)}
    <div className="dice-total"><small>TỔNG</small><strong>{total ?? '—'}</strong></div>
  </div>;
}
