import { Container, Graphics } from 'pixi.js';

export const GROUP_COLORS: Record<string, number> = {
  'mien-tay': 0x8b5a2b, 'phuong-nam': 0x42abe5, 'cao-nguyen': 0xd95aa5,
  'duyen-hai': 0xef9150, 'di-san': 0xdc2626, 'mien-trung-bac': 0xfacc15,
  'mien-bac': 0x16a34a, 'do-thi': 0x557fda,
};
export const SPECIAL_COLORS: Record<string, number> = {
  START: 0xd4efd7, CHANCE: 0xdbe8fc, LIFE: 0xfce1ec, TAX: 0xf9ded0,
  JAIL: 0xd9e3e4, GO_TO_JAIL:0xf2bb9a, REST: 0xd5eeea, TRAVEL: 0xe5dff6, TRAVEL_FUND: 0xffedba,
};

export function house(level: number, color = 0xeaa04e): Container {
  const result = new Container();
  const g = new Graphics();
  const height = 9 + level * 5;
  g.ellipse(1, 2, 16, 5).fill({ color: 0x193d3e, alpha: .17 });
  g.poly([-12, 0, 3, 5, 3, 5 - height, -12, -height]).fill(0xffe6ad);
  g.poly([3, 5, 13, 0, 13, -height, 3, 5 - height]).fill(0xd6ad72);
  g.poly([-15, -height, 0, -height - 10, 16, -height, 3, 5 - height]).fill(color);
  g.poly([0, -height - 10, 16, -height, 3, 5 - height]).fill(0xb16a43);
  g.poly([-8, -3, -3, -1, -3, -10, -8, -12]).fill(0x497c83);
  for (let i = 0; i < level; i++) {
    const y = -height + 6 + i * 5;
    g.poly([6, y, 10, y - 2, 10, y + 2, 6, y + 4]).fill(0xfff3c8);
  }
  if (level === 3) {
    g.rect(7, -height - 13, 2, 10).fill(0x744e44);
    g.poly([9, -height - 13, 19, -height - 10, 9, -height - 7]).fill(0xf4cf5b);
  }
  result.addChild(g);
  return result;
}

export function pawn(color: number, variant: number): Container {
  const result = new Container();
  const g = new Graphics();
  g.ellipse(1, 0, 9, 3).fill({ color: 0x173f3e, alpha: .24 });
  g.roundRect(-6, -14, 12, 13, 5).fill(color);
  g.ellipse(-3, -1, 4, 2).fill(0x304b56).ellipse(4, -1, 4, 2).fill(0x304b56);
  g.circle(0, -21, 7).fill(0xffd3a7);
  if (variant === 0) {
    g.poly([-10, -23, 0, -34, 10, -23]).fill(0xffefbb);
    g.ellipse(0, -23, 10, 2).fill(0xd9ac64);
  } else if (variant === 1) {
    g.roundRect(-8, -30, 15, 7, 3).fill(color).rect(0, -25, 11, 3).fill(0x367fad);
  } else if (variant === 2) {
    g.circle(-5, -26, 5).circle(4, -26, 5).fill(0x425242);
    g.circle(8, -28, 3).fill(0xf6b65d);
  } else {
    g.ellipse(0, -27, 8, 4).fill(0xe9b93d);
    g.roundRect(-5, -33, 10, 6, 2).fill(0xffdc63);
  }
  g.circle(-2.5, -21, 1).circle(2.5, -21, 1).fill(0x4c4942);
  g.moveTo(-2, -17).quadraticCurveTo(0, -15, 2, -17).stroke({ color: 0xb87361, width: 1 });
  g.poly([-5, -13, 4, -13, 2, -9]).fill(0xfff4cf);
  result.addChild(g);
  return result;
}

export function tree(): Container {
  const result = new Container();
  const g = new Graphics();
  g.ellipse(1, 2, 11, 4).fill({ color: 0x244841, alpha: .14 });
  g.roundRect(-2, -19, 5, 21, 2).fill(0xa77752);
  g.circle(-5, -24, 10).fill(0x349668);
  g.circle(5, -27, 11).fill(0x4eaf75);
  g.circle(-2, -33, 10).fill(0x76c78b);
  result.addChild(g);
  return result;
}
