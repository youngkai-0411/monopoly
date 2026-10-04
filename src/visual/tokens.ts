/** Presentation constants only. Game rules, groups and economy remain in game/data. */
export const UI_COLORS = {
  'game-bg':'#b4ded7', 'surface-primary':'#fff9e9', 'surface-secondary':'#edf2e4',
  'border-default':'#a9c5b5', 'border-strong':'#8ead9d',
  'text-primary':'#254b4c', 'text-secondary':'#48675e',
  action:'#edb944', 'action-light':'#ffdb7d', 'action-deep':'#edb435', 'action-text':'#382800',
  selected:'#285d59', 'selected-text':'#fff9e9',
  'danger-text':'#973f31', 'danger-surface':'#ffe5d0', 'danger-border':'#dbad8b',
} as const;
export const PLAYER_COLORS = ['#ee6b73','#59bafa','#73d7a0','#ffd46a'] as const;
export const TYPE = { family:'"Be Vietnam Pro", Arial, sans-serif', atlasFamily:'"Be Vietnam Pro", Arial', body:500, heading:700, display:800 } as const;
export const WORLD = {
  tile:{ paper:'#fff6df', start:'#d8edcb', life:'#fbe0eb', special:'#e1ebeb', border:'#a9b69e', body:'#f0e9cf', text:UI_COLORS['text-primary'], price:UI_COLORS['text-secondary'], rail:'#33636c', utility:'#617dad', symbol:'#407171' },
  focus:{ destination:'#d49422', gold:'#f9bd3f', active:UI_COLORS.selected },
  environment:{ stone:'#beaa86', grassRim:'#8ab978', stoneTop:'#d5c9ab', rim:'#fff3cd', grass:'#8bc678', path:'#e6cf99', joint:'#aa977a', fountain:'#e8d6ab', water:'#72bcc7', pillar:'#e2d6b9', bowl:'#eee3c8', drop:'#97d5dd', bench:'#a67855', benchBack:'#b88761', benchLeg:'#5d7367', chanceCard:'#6baeb7', lifeCard:'#eeaa78', cardPaper:'#fff6dd', cardInset:'#ffeec5', stairs:'#d9ccaa' },
  house:{ wall:'#ffe6b3', hotelRoof:'#cc5b4c', door:'#3d6c79', window:'#477d8c', flagPole:'#735a4d', flag:'#f6c959' },
  landmark:{ trainBase:'#d7bb85', trainWall:'#f4dfb5', trainRoof:'#397d86', trainWindow:'#416477', jailWall:'#d7d4c7', jailBars:'#48616b', jailRoof:'#617b79', waterLeg:'#789796', waterTank:'#78bec7', waterRoof:'#f3d19a', powerWall:'#f0c879', powerRoof:'#5a8499', chimney:'#687f8a', powerDoor:'#426575' },
  tree:{ trunk:'#987953', dark:'#50a76d', light:'#7ac783' },
  pavilion:{ base:'#d9c89c', posts:'#d99d60', wall:'#7eae92', roof:'#3f9293', upperRoof:'#55aaaa', cap:'#f4cd72' },
  pawn:{ shoes:'#384d58', skin:'#f6c69e', eyes:'#3b4145', conicalHat:'#ffe3a0', hair:'#44564b', hatRim:'#f2c957', hat:'#ffe176' },
  dice:{ body:'#fff8e0', dots:'#335164' },
  light:{ sky:'#fff8e1', ground:'#629d88', sun:'#fff6df' },
  shadow:{ center:'#21443b65', edge:'#21443b00' },
} as const;

/** One bridge at startup: CSS and Canvas/Three.js consume the same UI values. */
export function installVisualTokens(root: HTMLElement) {
  for (const [name,color] of Object.entries(UI_COLORS)) root.style.setProperty('--color-'+name,color);
  root.style.setProperty('--font-game',TYPE.family);
  root.style.setProperty('--color-dice-body',WORLD.dice.body);
  root.style.setProperty('--color-dice-pip',WORLD.dice.dots);
}
