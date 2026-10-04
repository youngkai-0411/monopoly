import * as THREE from 'three';
import { UI_COLORS,WORLD } from '../visual/tokens';
import { ensureBoardFonts } from '../visual/fonts';
import { BOARD } from '../game/data/board';
import { PROPERTIES } from '../game/data/properties';
import type { GameState } from '../game/types/domain';
import { PLAYER_COLORS } from '../components/format';
import { SQUARE_TILES, type CameraMode } from './squareBoard';
import { TabletopArt, boardPrinting } from './tabletopArt';

import { fitOverview, followAnchor, type ScreenRect } from './cameraFraming';

interface PawnMotion { node: THREE.Group; from: THREE.Vector3; to: THREE.Vector3; start: number }
const cameraOffset = new THREE.Vector3(12, 14, 12);

/** Isolated 3D presentation; game rules/state are supplied, never advanced here. */
export class TabletopScene {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-10, 10, 8, -8, .1, 100);
  private art = new TabletopArt();
  private tiles: THREE.InstancedMesh;
  private printing: THREE.Mesh;
  private fontTimer: ReturnType<typeof setTimeout> | undefined;
  private houses = new THREE.Group();
  private pawns = new Map<string, PawnMotion>();
  private dice: THREE.Mesh[] = [];
  private diceAnchor = new THREE.Vector3();
  private ring: THREE.Mesh;
  private target = new THREE.Vector3(0, .2, 0);
  private mode: CameraMode = 'overview';
  private game: GameState;
  private propertySignature = '';
  private raycaster = new THREE.Raycaster();
  private frame = 0;
  private previousTime = 0;
  private visible = !document.hidden;
  private reduced = false;
  private disposed = false;
  private width = 1;
  private height = 1;
  private renderCount = 0;
  private overlays: ScreenRect[] = [];
  private overview = {anchor:{x:0,y:0},zoom:1,clear:true};
  private screenAnchor = new THREE.Vector2();
  private destination: THREE.LineLoop;

  constructor(private host: HTMLElement, game: GameState, private immersive = false) {
    this.game = game;
    this.renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    this.renderer.setClearColor(UI_COLORS['game-bg']);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute('aria-label', 'Bàn cờ Việt Nam 3D: 40 ô, 4 góc đặc biệt');
    this.renderer.domElement.setAttribute('role', 'img');
    host.prepend(this.renderer.domElement);
    this.scene.add(new THREE.HemisphereLight(WORLD.light.sky, WORLD.light.ground, 2.3));
    const sun = new THREE.DirectionalLight(WORLD.light.sun, 2.0); sun.position.set(-8, 16, 9); this.scene.add(sun);
    this.environment();
    this.batchScenery();
    this.tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(1, .14, 1), this.art.material(WORLD.tile.body), BOARD.length);
    const matrix = new THREE.Matrix4();
    for (const point of SQUARE_TILES) { matrix.compose(new THREE.Vector3(point.x,.08,point.z),new THREE.Quaternion(),new THREE.Vector3(point.width-.03,1,point.depth-.03)); this.tiles.setMatrixAt(point.index, matrix); }
    this.printing = boardPrinting();
    this.scene.add(this.tiles, this.printing, this.houses);
    this.host.dataset.atlasFont='fallback';
    this.host.dataset.atlasRefreshes='0';
    this.fontTimer=setTimeout(()=>{this.host.dataset.atlasFontWait='expired';},2500);
    void ensureBoardFonts().then(ready=>{
      clearTimeout(this.fontTimer);
      if(this.disposed||!ready)return;
      const replacement=boardPrinting(),old=this.printing;
      this.scene.remove(old);this.printing=replacement;this.scene.add(replacement);
      old.geometry.dispose();const material=old.material as THREE.MeshBasicMaterial;material.map?.dispose();material.dispose();
      this.host.dataset.atlasFont='Be Vietnam Pro';this.host.dataset.atlasRefreshes='1';
      this.request();
    });
    const landmarks=new THREE.Group();
    for(const tile of BOARD) {
      if(!['RAILROAD','UTILITY','JAIL'].includes(tile.type))continue;
      const point=SQUARE_TILES[tile.index];
      const model=this.art.landmark(tile.type as 'RAILROAD'|'UTILITY'|'JAIL',tile.propertyId==='cap-nuoc');
      model.position.set(point.x+(point.side==='left'?.48:point.side==='right'?-.48:0),.17,point.z+(point.side==='top'?.50:point.side==='bottom'?-.50:0));
      model.scale.setScalar(.66);landmarks.add(model);
    }
    this.scene.add(landmarks);this.batchScenery(landmarks);
    const diceMaterials = this.art.diceMaterials();
    for (let i = 0; i < 2; i++) {
      const die = new THREE.Mesh(new THREE.BoxGeometry(.34, .34, .34), diceMaterials); this.scene.add(die); this.dice.push(die);
    }
    this.ring = new THREE.Mesh(new THREE.RingGeometry(.29, .37, 24), new THREE.MeshBasicMaterial({ color: WORLD.focus.active, side: THREE.DoubleSide }));
    this.ring.rotation.x = -Math.PI / 2; this.scene.add(this.ring);
    this.destination = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.5,0,-.5),new THREE.Vector3(.5,0,-.5),new THREE.Vector3(.5,0,.5),new THREE.Vector3(-.5,0,.5)]),new THREE.LineBasicMaterial({color:WORLD.focus.destination}));
    this.scene.add(this.destination);
    this.camera.position.copy(cameraOffset).add(this.target); this.camera.lookAt(this.target);
    this.resize(host.clientWidth, host.clientHeight);
    this.setGame(game);
  }

  private environment() {
    const a = this.art, scene = this.scene;
    a.box(scene, 0, -1.27, 0, 100, .15, 100, UI_COLORS['game-bg']);
    a.box(scene, 0, -.92, 0, 15.3, .68, 13.3, WORLD.environment.stone);
    a.box(scene, 0, -.56, 0, 15.5, .14, 13.5, WORLD.environment.grassRim);
    a.box(scene, 0, -.33, 0, 12.55, .40, 10.6, WORLD.environment.stoneTop);
    a.box(scene, 0, -.08, 0, 12.4, .13, 10.45, WORLD.environment.rim);
    a.box(scene, 0, .05, 0, 8.95, .15, 7.95, WORLD.environment.grass);
    // Paved courtyard surrounds the open grass; no title/controls in the scene.
    for (const side of [-1, 1]) {
      a.box(scene, side * 3.60, .145, 0, .36, .025, 7.6, WORLD.environment.path);
      a.box(scene, 0, .145, side * 3.60, 7.6, .025, .36, WORLD.environment.path);
      // Block joints on the raised island, rather than costly shadow maps.
      for (let i = -6; i <= 6; i++) {
        a.box(scene, i, -.89, side * 7.66, .025, .58, .015, WORLD.environment.joint);
        a.box(scene, side * 7.66, -.89, i, .015, .58, .025, WORLD.environment.joint);
      }
    }
    a.cylinder(scene, 0, .19, 0, 1.14, .10, WORLD.environment.fountain);
    a.cylinder(scene, 0, .25, 0, 1.02, .045, WORLD.environment.water);
    a.cylinder(scene, 0, .40, 0, .17, .32, WORLD.environment.pillar);
    a.cylinder(scene, 0, .59, 0, .36, .08, WORLD.environment.bowl);
    a.sphere(scene, 0, .77, 0, .075, .18, .075, WORLD.environment.drop);
    for (const [x, z] of [[-7, -7], [-7, 7], [7, -7], [7, 7]]) {
      const pavilion = a.pavilion(); pavilion.position.set(x, -.47, z); scene.add(pavilion);
    }
    for (const [x, z] of [[-7, -3], [-7, 2], [7, -2], [7, 3], [-2, -7], [2, 7], [-3.2, -3.2], [3.2, 3.2]]) {
      const tree = a.tree(); tree.position.set(x, Math.abs(x) > 5 || Math.abs(z) > 5 ? -.47 : .15, z); tree.scale.setScalar(.8); scene.add(tree);
    }
    for (const [x, z] of [[-2, 3.1], [2, -3.1]]) {
      a.box(scene, x, .30, z, .8, .10, .23, WORLD.environment.bench);
      a.box(scene, x, .50, z - .10, .8, .32, .065, WORLD.environment.benchBack);
      for (const dx of [-.27, .27]) a.box(scene, x + dx, .22, z, .06, .25, .18, WORLD.environment.benchLeg);
    }
    for (const [x, z, color] of [[-1.8, 1.7, WORLD.environment.chanceCard], [1.8, -1.7, WORLD.environment.lifeCard]] as const) {
      for (let layer = 0; layer < 3; layer++) a.box(scene, x, .20 + layer * .035, z, .9, .025, .65, layer === 2 ? color : WORLD.environment.cardPaper);
      a.box(scene, x, .284, z, .7, .008, .43, WORLD.environment.cardInset);
    }
    for (let step = 0; step < 4; step++) {
      a.box(scene, 6.6 + step * .25, -.4 - step * .16, 0, .28, .16, 1.4, WORLD.environment.stairs);
      a.box(scene, 0, -.4 - step * .16, 6.6 + step * .25, 1.4, .16, .28, WORLD.environment.stairs);
    }
  }

  private batchScenery(root: THREE.Object3D = this.scene) {
    // Combine repeated static geometry/materials into GPU instances.
    // Pawns and owned houses are added afterwards and remain independently movable.
    const batches = new Map<string, THREE.Mesh[]>();
    this.scene.updateMatrixWorld(true);
    root.traverse(node => {
      if (!(node instanceof THREE.Mesh) || Array.isArray(node.material) || node.material.transparent) return;
      const key = `${node.geometry.uuid}:${node.material.uuid}`;
      const batch = batches.get(key) ?? []; batch.push(node); batches.set(key, batch);
    });
    for (const meshes of batches.values()) {
      if (meshes.length < 2) continue;
      const batch = new THREE.InstancedMesh(meshes[0].geometry, meshes[0].material, meshes.length);
      meshes.forEach((mesh, index) => { batch.setMatrixAt(index, mesh.matrixWorld); mesh.removeFromParent(); });
      root.add(batch);
    }
  }

  resize(width: number, height: number) {
    if (width < 1 || height < 1 || this.disposed) return;
    this.width = width; this.height = height;
    this.renderer.setSize(width, height);
    const aspect = width / height;
    const halfHeight = this.immersive ? Math.max(5.9,8 / aspect) : Math.max(8.7,10.8 / aspect);
    this.camera.left = -halfHeight * aspect; this.camera.right = halfHeight * aspect;
    this.camera.top = halfHeight; this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix(); this.reframe(); this.screenAnchor.set(0,0); this.request();
  }
  setFraming(overlays:ScreenRect[]) { this.overlays=overlays;this.reframe();this.request(); }
  private reframe(){
    if(!this.immersive)return;
    const camera=this.camera.clone();camera.zoom=1;camera.clearViewOffset();camera.position.copy(cameraOffset).add(new THREE.Vector3(0,.2,0));camera.lookAt(0,.2,0);camera.updateMatrixWorld();camera.updateProjectionMatrix();
    const tiles=SQUARE_TILES.map(p=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>{const v=new THREE.Vector3(p.x+x*p.width/2,.16,p.z+z*p.depth/2).project(camera);return {x:(v.x+1)*this.width/2,y:(1-v.y)*this.height/2};}));
    this.overview=fitOverview(this.width,this.height,tiles,this.overlays);
  }
  setMode(mode: CameraMode) { this.mode = mode; this.request(); }
  setReducedMotion(value: boolean) { this.reduced = value; this.request(); }
  setVisible(value: boolean) {
    this.visible = value; this.previousTime = 0;
    if (value) this.request(); else { cancelAnimationFrame(this.frame); this.frame = 0; }
  }
  setGame(game: GameState) {
    const wasRolling = this.game.phase === 'ROLLING';
    this.game = game;
    const signature = PROPERTIES.map(p => `${game.properties[p.id].ownerId}:${game.properties[p.id].level}`).join('|');
    if (signature !== this.propertySignature) {
      this.propertySignature = signature;
      // Models reuse the art pool. Their shared GPU resources live until scene disposal.
      this.houses.traverse(node=>{if(node instanceof THREE.InstancedMesh)node.dispose();});this.houses.clear();
      for (const tile of BOARD) {
        if (!tile.propertyId) continue;
        const state = game.properties[tile.propertyId];
        if (!state.ownerId) continue;
        const point = SQUARE_TILES[tile.index];
        const index = game.players.findIndex(p => p.id === state.ownerId);
        this.art.box(this.houses, point.x, .172, point.z + point.depth/2-.07, point.width-.15, .032, .12, PLAYER_COLORS[index]);
        // A dark outline keeps light player colors readable independently of the group strip.
        this.art.box(this.houses, point.x, .159, point.z + point.depth/2-.07, point.width-.10, .022, .16, WORLD.focus.active);
        if (state.level) {
          const house = this.art.house(state.level, PLAYER_COLORS[index]);
          // Houses occupy the inner lip, leaving printed names visible.
          house.position.set(point.x + (point.side === 'left' ? .4 : point.side === 'right' ? -.4 : 0), .18,
            point.z + (point.side === 'top' ? .4 : point.side === 'bottom' ? -.4 : 0));
          house.scale.setScalar(.80); this.houses.add(house);
        }
      }
      this.batchScenery(this.houses);
    }
    for (const [index, player] of game.players.entries()) {
      const point = SQUARE_TILES[player.position];
      const target = new THREE.Vector3(point.x + (index % 2 ? .09 : -.09), .18, point.z + (index < 2 ? -.08 : .10));
      let motion = this.pawns.get(player.id);
      if (!motion) {
        const node = this.art.pawn(PLAYER_COLORS[index], index); node.scale.setScalar(.75); node.position.copy(target); this.scene.add(node);
        motion = { node, from: target.clone(), to: target, start: 0 }; this.pawns.set(player.id, motion);
      }
      motion.node.visible = !player.isBankrupt;
      if(player.jailed && motion.to.distanceTo(target)>2){motion.node.position.copy(target);motion.from.copy(target);motion.to=target;motion.start=0;}
      if (!motion.to.equals(target)) {
        motion.from.copy(motion.node.position); motion.to = target; motion.start = performance.now();
        motion.node.rotation.y = Math.atan2(target.x - motion.from.x, target.z - motion.from.z);
      }
    }
    if (game.phase === 'ROLLING' && !wasRolling) {
      const active = this.pawns.get(game.currentPlayerId);
      if (active) this.diceAnchor.copy(active.node.position);
    }
    this.request();
  }
  pick(clientX: number, clientY: number): number | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const pointer = new THREE.Vector2((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1);
    this.raycaster.setFromCamera(pointer, this.camera);
    return this.raycaster.intersectObject(this.tiles)[0]?.instanceId ?? null;
  }
  private request() { if (!this.frame && this.visible && !this.disposed) this.frame = requestAnimationFrame(this.draw); }
  private draw = (now: number) => {
    this.frame = 0;
    if (!this.visible || this.disposed) return;
    const dt = this.previousTime ? Math.min(.064, (now - this.previousTime) / 1000) : 1 / 60; this.previousTime = now;
    let animating = false;
    for (const motion of this.pawns.values()) {
      const t = this.reduced || !motion.start ? 1 : Math.min(1, (now - motion.start) / 420);
      const smooth = t * t * (3 - 2 * t);
      motion.node.position.lerpVectors(motion.from, motion.to, smooth);
      motion.node.position.y += Math.sin(t * Math.PI) * .11;
      if (t < 1) animating = true;
    }
    const active = this.pawns.get(this.game.currentPlayerId);
    const desired = this.mode === 'follow' && active ? active.node.position.clone().setY(.38) : new THREE.Vector3(0, .2, 0);
    const desiredZoom = this.mode === 'follow' ? 3.2 : this.immersive ? this.overview.zoom : 1;
    const anchor=this.immersive?(this.mode==='follow'?followAnchor(this.width,this.height,this.overlays):this.overview.anchor):{x:this.width/2,y:this.height/2};
    if(this.reduced||this.screenAnchor.lengthSq()===0)this.screenAnchor.set(anchor.x,anchor.y);
    else {this.screenAnchor.lerp(new THREE.Vector2(anchor.x,anchor.y),1-Math.exp(-dt/.17));if(this.screenAnchor.distanceTo(new THREE.Vector2(anchor.x,anchor.y))>.05)animating=true;else this.screenAnchor.set(anchor.x,anchor.y);}
    if(this.immersive)this.camera.setViewOffset(this.width,this.height,this.width/2-this.screenAnchor.x,this.height/2-this.screenAnchor.y,this.width,this.height);
    if (this.reduced) { this.target.copy(desired); this.camera.zoom = desiredZoom; }
    else {
      const alpha = 1 - Math.exp(-dt / .17);
      this.target.lerp(desired, alpha); this.camera.zoom += (desiredZoom - this.camera.zoom) * alpha;
      if (this.target.distanceTo(desired) > .003 || Math.abs(this.camera.zoom - desiredZoom) > .001) animating = true;
      else { this.target.copy(desired); this.camera.zoom = desiredZoom; }
    }
    this.camera.position.copy(cameraOffset).add(this.target); this.camera.lookAt(this.target); this.camera.updateProjectionMatrix();
    if (active) {
      this.ring.position.copy(active.node.position).setY(.17);
      const rolling = this.game.phase === 'ROLLING';
      for (const [i, die] of this.dice.entries()) {
        die.visible = this.mode === 'follow' && (rolling || this.game.phase === 'MOVING');
        die.position.set(this.diceAnchor.x + .55 + i * .42, .36 + (rolling && !this.reduced ? Math.abs(Math.sin(now * .016 + i)) * .35 : 0), this.diceAnchor.z + .50);
        if (rolling && !this.reduced) { die.rotation.set(now * .01 + i, now * .013, now * .008); animating = true; }
        else {
          const value = this.game.dice?.values[i] ?? 3;
          const rotations: Record<number, [number, number, number]> = { 1: [0, 0, Math.PI / 2], 2: [-Math.PI / 2, 0, 0], 3: [0, 0, 0], 4: [Math.PI, 0, 0], 5: [Math.PI / 2, 0, 0], 6: [0, 0, -Math.PI / 2] };
          die.rotation.set(...rotations[value]);
        }
      }
    }
    const destination=SQUARE_TILES[this.game.players.find(p=>p.id===this.game.currentPlayerId)!.position];
    this.destination.position.set(destination.x,.168,destination.z);this.destination.scale.set(destination.width-.02,1,destination.depth-.02);
    this.destination.visible=['RESOLVING_TILE','PROPERTY_DECISION','UTILITY_ROLL','RENT','EVENT'].includes(this.game.phase);
    this.renderer.render(this.scene, this.camera);
    this.renderCount++;
    this.host.dataset.cameraZoom = this.camera.zoom.toFixed(3);
    this.host.dataset.cameraTarget = JSON.stringify({ x: this.target.x, z: this.target.z });
    this.host.dataset.renderCount = String(this.renderCount);
    this.host.dataset.drawCalls = String(this.renderer.info.render.calls);
    this.host.dataset.triangles = String(this.renderer.info.render.triangles);
    const corners = [[-6.1, -6.1], [6.1, -6.1], [6.1, 6.1], [-6.1, 6.1]].map(([x, z]) => new THREE.Vector3(x, .16, z).project(this.camera));
    this.host.dataset.overviewFits = String(corners.every(v => Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1));
    this.host.dataset.boardScreenPolygon = JSON.stringify(corners.map(v => ({ x: (v.x + 1) * this.width / 2, y: (1 - v.y) * this.height / 2 })));
    this.host.dataset.overviewClear=String(this.overview.clear);
    this.host.dataset.destinationHighlight=String(this.destination.visible);
    this.host.dataset.tileScreens=JSON.stringify(SQUARE_TILES.map(p=>{const v=new THREE.Vector3(p.x,.18,p.z).project(this.camera);return {index:p.index,x:(v.x+1)*this.width/2,y:(1-v.y)*this.height/2};}));
    if(active){const v=active.node.position.clone().setY(.6).project(this.camera);this.host.dataset.tokenScreen=JSON.stringify({x:(v.x+1)*this.width/2,y:(1-v.y)*this.height/2});}
    const point = SQUARE_TILES[0], projected = new THREE.Vector3(point.x, .16, point.z).project(this.camera);
    this.host.dataset.startScreen = JSON.stringify({ x: (projected.x + 1) * this.width / 2, y: (1 - projected.y) * this.height / 2 });
    if (animating) this.request(); else this.previousTime = 0;
  };

  destroy() {
    this.disposed = true; clearTimeout(this.fontTimer); cancelAnimationFrame(this.frame);
    const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
    this.scene.traverse(node => {
      if (!(node instanceof THREE.Mesh)) return;
      if (node instanceof THREE.InstancedMesh) node.dispose();
      geometries.add(node.geometry);
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        materials.add(material);
        if ('map' in material && material.map instanceof THREE.Texture) textures.add(material.map);
      }
    });
    for (const geometry of geometries) geometry.dispose();
    for (const texture of textures) texture.dispose();
    for (const material of materials) material.dispose();
    this.destination.geometry.dispose();(this.destination.material as THREE.Material).dispose();
    this.art.dispose();this.renderer.dispose();
    if (!this.renderer.getContext().isContextLost()) this.renderer.forceContextLoss();
    this.renderer.domElement.remove(); this.scene.clear();
  }
}
