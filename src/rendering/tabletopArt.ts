import * as THREE from 'three';
import { WORLD,TYPE } from '../visual/tokens';
import { BOARD } from '../game/data/board';
import { PROPERTIES } from '../game/data/properties';
import { GROUPS } from '../game/data/groups';
import { SQUARE_TILES } from './squareBoard';

export const TILE_LABELS: Record<string, string> = {
  START: 'Xuất phát', CHANCE: 'Cơ hội', LIFE: 'Cuộc sống', TAX: 'Thuế',
  JAIL: 'Nhà tù / Thăm tù', REST: 'Nghỉ ngơi', GO_TO_JAIL: 'Đi tù', RAILROAD:'Ga tàu', UTILITY:'Tiện ích',
};
const groups: Record<string,string> = Object.fromEntries(GROUPS.map(g=>[g.id,g.color]));
const symbols: Record<string, string> = { START: '➜', CHANCE: '?', LIFE: '♥', TAX: '−', JAIL: '▥', REST: '☀', GO_TO_JAIL: '➜', RAILROAD:'▰', UTILITY:'◇' };
const definitions = new Map(PROPERTIES.map(p => [p.id, p]));

function canvasTexture(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** One atlas/one mesh for all printed names, prices, symbols and color bands. */
export function boardPrinting(): THREE.Mesh {
  const cell = 192, columns = 7, unit = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = cell * columns;
  const ctx = canvas.getContext('2d')!;
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  for (const tile of BOARD) {
    const p = tile.propertyId ? definitions.get(tile.propertyId) : undefined;
    const label = p?.name ?? tile.name ?? TILE_LABELS[tile.type];
    const x = tile.index % columns * cell, y = Math.floor(tile.index / columns) * cell;
    ctx.save();
    ctx.translate(x, y); ctx.scale(cell/unit, cell/unit);
    ctx.fillStyle = p ? WORLD.tile.paper : tile.type === 'START' ? WORLD.tile.start : tile.type === 'LIFE' ? WORLD.tile.life : WORLD.tile.special;
    ctx.fillRect(0, 0, unit, unit);
    ctx.strokeStyle = WORLD.tile.border; ctx.lineWidth = 3; ctx.strokeRect(2, 2, unit - 4, unit - 4);
    if (p?.kind === 'LAND') { ctx.fillStyle = groups[p.groupId]; ctx.fillRect(3, 3, unit - 6, 25); }
    else if(p) {ctx.fillStyle=p.kind==='RAILROAD'?WORLD.tile.rail:WORLD.tile.utility;ctx.textAlign='center';ctx.font=`${TYPE.heading} 30px ${TYPE.atlasFamily}`;ctx.fillText(p.kind==='RAILROAD'?'▰':'◇',unit/2,33);}
    else { ctx.fillStyle = WORLD.tile.symbol; ctx.textAlign = 'center'; ctx.font = `${TYPE.heading} 38px ${TYPE.atlasFamily}`; ctx.fillText(symbols[tile.type], unit / 2, 49); }
    ctx.fillStyle = WORLD.tile.text; ctx.textAlign = 'center'; ctx.font = `${TYPE.heading} 18px ${TYPE.atlasFamily}`;
    const words = label.split(' '), lines: string[] = [];
    let line = '';
    for (const word of words) {
      if (line && ctx.measureText(`${line} ${word}`).width > 113) { lines.push(line); line = word; }
      else line = line ? `${line} ${word}` : word;
    }
    lines.push(line);
    const start = p ? 63 - (lines.length - 1) * 11 : 83 - (lines.length - 1) * 11;
    lines.forEach((text, i) => ctx.fillText(text, unit / 2, start + i * 23));
    if (p) { ctx.font = `${TYPE.body} 14px ${TYPE.atlasFamily}`; ctx.fillStyle = WORLD.tile.price; ctx.fillText(`${p.price} Tr`, unit / 2, 109); }
    ctx.restore();
    const point = SQUARE_TILES[tile.index], sx=(point.width-.055)/2, sz=(point.depth-.055)/2;
    const offset = positions.length / 3;
    positions.push(point.x - sx, .155, point.z + sz, point.x + sx, .155, point.z + sz,
      point.x + sx, .155, point.z - sz, point.x - sx, .155, point.z - sz);
    const u = x / canvas.width, v = 1 - (y + cell) / canvas.height, uvUnit = 1 / columns;
    const uvCorners=[[u,v],[u+uvUnit,v],[u+uvUnit,v+uvUnit],[u,v+uvUnit]];
    const rotation=point.corner?0:{bottom:0,left:1,top:2,right:3}[point.side];
    uvs.push(...uvCorners.flatMap((_,i)=>uvCorners[(i+rotation)%4]));
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: canvasTexture(canvas) }));
}

export class TabletopArt {
  private materials = new Map<string, THREE.MeshLambertMaterial>();
  private boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  private sphereGeometry = new THREE.IcosahedronGeometry(1, 1);
  private roofGeometry = new THREE.ConeGeometry(1, 1, 4);
  private roundGeometry = new THREE.CylinderGeometry(1, 1, 1, 12);
  private shadowMaterial: THREE.MeshBasicMaterial;
  private shadowGeometry = new THREE.PlaneGeometry(1, 1);

  constructor() {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    gradient.addColorStop(0, WORLD.shadow.center); gradient.addColorStop(1, WORLD.shadow.edge);
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
    this.shadowMaterial = new THREE.MeshBasicMaterial({ map: canvasTexture(canvas), transparent: true, depthWrite: false });
  }
  material(color: string) {
    let material = this.materials.get(color);
    if (!material) { material = new THREE.MeshLambertMaterial({ color, flatShading: true }); this.materials.set(color, material); }
    return material;
  }
  box(parent: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, d: number, color: string) {
    const mesh = new THREE.Mesh(this.boxGeometry, this.material(color)); mesh.position.set(x, y, z); mesh.scale.set(w, h, d); parent.add(mesh); return mesh;
  }
  sphere(parent: THREE.Object3D, x: number, y: number, z: number, sx: number, sy: number, sz: number, color: string) {
    const mesh = new THREE.Mesh(this.sphereGeometry, this.material(color)); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); parent.add(mesh); return mesh;
  }
  cylinder(parent: THREE.Object3D, x: number, y: number, z: number, radius: number, height: number, color: string) {
    const mesh = new THREE.Mesh(this.roundGeometry, this.material(color)); mesh.position.set(x, y, z); mesh.scale.set(radius, height, radius); parent.add(mesh); return mesh;
  }
  shadow(parent: THREE.Object3D, width: number, depth = width) {
    const mesh = new THREE.Mesh(this.shadowGeometry, this.shadowMaterial);
    mesh.rotation.x = -Math.PI / 2; mesh.position.y = .01; mesh.scale.set(width, depth, 1); parent.add(mesh);
  }
  roof(parent: THREE.Object3D, y: number, w: number, h: number, color: string) {
    const mesh = new THREE.Mesh(this.roofGeometry, this.material(color)); mesh.rotation.y = Math.PI / 4;
    mesh.position.y = y; mesh.scale.set(w, h, w); parent.add(mesh); return mesh;
  }
  ownerFlag() {
    const group=new THREE.Group();
    this.box(group,0,.018,0,.12,.035,.12,WORLD.house.flagPole);
    this.box(group,0,.24,0,.026,.48,.026,WORLD.house.flagPole);
    // Unlit color preserves the identity shared with the HUD, independent of lighting.
    const banner=new THREE.Mesh(this.boxGeometry,new THREE.MeshBasicMaterial({color:WORLD.tile.paper}));
    banner.position.set(.12,.40,0);banner.scale.set(.24,.15,.025);group.add(banner);
    this.box(group,.12,.48,0,.25,.016,.035,WORLD.tile.paper);
    return {group,banner};
  }
  house(level: number) {
    const group = new THREE.Group();
    if(level<5) {
      // Same-sized houses: development increases the cluster, not tiny repetitions.
      const slots=level===1?[[0,0]]:level===2?[[-.16,0],[.16,0]]:level===3?[[-.16,-.15],[.16,-.15],[0,.16]]:[[-.16,-.15],[.16,-.15],[-.16,.15],[.16,.15]];
      this.shadow(group,.75,.72);
      for(const [x,z] of slots){
        const home=new THREE.Group();home.position.set(x,0,z);
        this.box(home,0,.12,0,.26,.24,.25,WORLD.house.wall);
        this.roof(home,.29,.23,.16,WORLD.landmark.trainRoof);
        this.box(home,0,.08,.132,.065,.15,.012,WORLD.house.door);
        this.box(home,.135,.15,0,.012,.065,.08,WORLD.house.window);
        group.add(home);
      }
      return group;
    }
    const height = .57;
    this.shadow(group, .78);
    this.box(group, 0, height / 2, 0, .52, height, .43, WORLD.house.wall);
    this.roof(group, height + .08, .46, .19, WORLD.house.hotelRoof);
    this.box(group, -.09, .12, .22, .10, .23, .015, WORLD.house.door);
    for (let i = 0; i < 3; i++) {
      this.box(group,.267,.12+i*.17,.03,.012,.075,.11,WORLD.house.window);
      this.box(group,.11,.12+i*.17,.221,.075,.075,.012,WORLD.house.window);
    }
    this.box(group,0,.51,.224,.24,.035,.012,WORLD.house.flag);
    return group;
  }
  landmark(kind:'RAILROAD'|'UTILITY'|'JAIL',water=false) {
    const group=new THREE.Group();this.shadow(group,.95);
    if(kind==='RAILROAD'){
      this.box(group,0,.05,0,.95,.10,.54,WORLD.landmark.trainBase);
      this.box(group,0,.28,0,.72,.4,.4,WORLD.landmark.trainWall);this.roof(group,.56,.62,.22,WORLD.landmark.trainRoof);
      for(const x of [-.23,0,.23])this.box(group,x,.30,.205,.12,.18,.02,WORLD.landmark.trainWindow);
    }else if(kind==='JAIL'){
      this.box(group,0,.32,0,.8,.6,.65,WORLD.landmark.jailWall);
      for(const x of [-.28,-.14,0,.14,.28])this.box(group,x,.35,.34,.045,.44,.035,WORLD.landmark.jailBars);
      this.box(group,0,.66,0,.9,.08,.75,WORLD.landmark.jailRoof);
    }else if(water){
      for(const x of [-.18,.18])this.box(group,x,.38,0,.05,.75,.05,WORLD.landmark.waterLeg);
      this.cylinder(group,0,.73,0,.30,.42,WORLD.landmark.waterTank);this.roof(group,1,.3,.16,WORLD.landmark.waterRoof);
    }else{
      this.box(group,0,.28,0,.7,.52,.42,WORLD.landmark.powerWall);this.roof(group,.60,.56,.22,WORLD.landmark.powerRoof);
      this.cylinder(group,.24,.74,-.12,.07,.55,WORLD.landmark.chimney);
      this.box(group,-.1,.30,.215,.15,.24,.02,WORLD.landmark.powerDoor);
    }
    return group;
  }
  tree() {
    const group = new THREE.Group(); this.shadow(group, 1.1);
    this.cylinder(group, 0, .36, 0, .07, .72, WORLD.tree.trunk);
    this.sphere(group, -.17, .8, 0, .35, .4, .35, WORLD.tree.dark);
    this.sphere(group, .15, 1, .04, .35, .39, .35, WORLD.tree.light); return group;
  }
  pavilion() {
    const group = new THREE.Group(); this.shadow(group, 1.8);
    this.box(group, 0, .12, 0, 1.1, .24, 1.1, WORLD.pavilion.base);
    for (const x of [-.33, .33]) for (const z of [-.33, .33]) this.box(group, x, .61, z, .09, .9, .09, WORLD.pavilion.posts);
    this.box(group, 0, .5, 0, .60, .55, .60, WORLD.pavilion.wall);
    this.roof(group, 1.02, 1.03, .37, WORLD.pavilion.roof); this.roof(group, 1.27, .67, .25, WORLD.pavilion.upperRoof);
    this.sphere(group, 0, 1.42, 0, .06, .08, .06, WORLD.pavilion.cap); return group;
  }
  pawn(color: string, index: number) {
    const group = new THREE.Group(); this.shadow(group, .65);
    this.box(group, -.08, .07, .03, .12, .12, .22, WORLD.pawn.shoes);
    this.box(group, .08, .07, .03, .12, .12, .22, WORLD.pawn.shoes);
    this.box(group, 0, .32, 0, .27, .39, .20, color);
    this.sphere(group, 0, .64, 0, .17, .18, .16, WORLD.pawn.skin);
    this.sphere(group, -.06, .67, .145, .019, .023, .018, WORLD.pawn.eyes);
    this.sphere(group, .06, .67, .145, .019, .023, .018, WORLD.pawn.eyes);
    this.sphere(group, -.2, .37, 0, .055, .12, .055, WORLD.pawn.skin);
    this.sphere(group, .2, .37, 0, .055, .12, .055, WORLD.pawn.skin);
    if (index === 0) {
      const hat = new THREE.Mesh(new THREE.ConeGeometry(.29, .20, 12), this.material(WORLD.pawn.conicalHat)); hat.position.y = .88; group.add(hat);
    } else if (index === 1) {
      this.sphere(group, 0, .80, 0, .18, .09, .17, color); this.box(group, 0, .79, .19, .23, .035, .14, color);
    } else if (index === 2) {
      this.sphere(group, 0, .80, 0, .18, .10, .17, WORLD.pawn.hair); this.sphere(group, .13, .87, -.05, .075, .08, .075, WORLD.pawn.hair);
    } else {
      this.cylinder(group, 0, .79, 0, .23, .035, WORLD.pawn.hatRim); this.cylinder(group, 0, .86, 0, .16, .14, WORLD.pawn.hat);
    }
    return group;
  }
  diceMaterials() {
    const dots: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
    const materials = Array.from({ length: 6 }, (_, i) => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 64;
      const ctx = canvas.getContext('2d')!; ctx.fillStyle = WORLD.dice.body; ctx.fillRect(0, 0, 64, 64); ctx.fillStyle = WORLD.dice.dots;
      for (const dot of dots[i + 1]) { ctx.beginPath(); ctx.arc(14 + dot % 3 * 18, 14 + Math.floor(dot / 3) * 18, 5, 0, Math.PI * 2); ctx.fill(); }
      return new THREE.MeshLambertMaterial({ map: canvasTexture(canvas) });
    });
    return [materials[0], materials[5], materials[2], materials[3], materials[1], materials[4]];
  }
  dispose() {
    this.boxGeometry.dispose(); this.sphereGeometry.dispose(); this.roofGeometry.dispose(); this.roundGeometry.dispose();
    this.shadowGeometry.dispose(); this.shadowMaterial.map?.dispose(); this.shadowMaterial.dispose();
    for (const material of this.materials.values()) material.dispose();
  }
}
