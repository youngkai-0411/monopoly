import { TYPE } from './tokens';
let pending: Promise<boolean> | undefined;
/** Explicit glyph/weight load also covers fonts used only by Canvas, not DOM. */
export function ensureBoardFonts(): Promise<boolean> {
  if (!document.fonts) return Promise.resolve(false);
  return pending ??= Promise.all([TYPE.body,TYPE.heading].map(weight =>
    document.fonts.load(`${weight} 20px ${TYPE.atlasFamily}`, 'Xuất phát Quảng Ngãi Điện lực 300 Tr')
  )).then(faces => faces.every(list => list.length > 0) &&
    [TYPE.body,TYPE.heading].every(weight => document.fonts.check(`${weight} 20px "Be Vietnam Pro"`,'Quảng Ngãi 300 Tr'))
  ).catch(() => false);
}
