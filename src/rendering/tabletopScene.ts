import * as THREE from 'three';
import { GAMEPLAY_VISUAL,UI_COLORS,WORLD } from '../visual/tokens';
import { ensureBoardFonts } from '../visual/fonts';
import { BOARD } from '../game/data/board';
import type { GameState } from '../game/types/domain';
import { PLAYER_COLORS } from '../components/format';
import { BOARD_PLATFORM, SQUARE_TILES, type CameraMode } from './squareBoard';
import { TabletopArt, boardPrinting } from './tabletopArt';
import { formationSlot,movementDestination,occupants } from './gameplayVisuals';
import { TILE_VISUAL_LAYOUT,tileOffset,tileRotation } from './tileVisualLayout';

import { fitOverview, followAnchor, type ScreenRect } from './cameraFraming';

interface PawnMotion { node: THREE.Group; ring:THREE.Group; identityDot:THREE.Group; colorRing:THREE.Mesh<THREE.RingGeometry,THREE.MeshBasicMaterial>; from: THREE.Vector3; to: THREE.Vector3; start: number }
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
  private flags=new Map<string,{index:number;ownerIndex:number}>();
  private flagParts:THREE.InstancedMesh[]=[];
  private flagTransforms:THREE.Matrix4[]=[];
  private bannerPart=0;
  private buildings=new Map<string,{level:number;node:THREE.Group}>();
  private ringGeometry=new THREE.RingGeometry(.16,.215,24);
  private ringEdgeGeometry=new THREE.RingGeometry(.215,.232,24);
  private dotGeometry=new THREE.CircleGeometry(1,12);
  private dotEdgeMaterial=new THREE.MeshBasicMaterial({color:GAMEPLAY_VISUAL.ringEdge,side:THREE.DoubleSide,depthTest:false});
  private ringEdgeMaterial=new THREE.MeshBasicMaterial({color:GAMEPLAY_VISUAL.ringEdge,transparent:true,opacity:.60,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true});
  private selectedPropertyId:string|null=null;
  private turnPulseStart=0;
  private movementTarget:{actor:string;index:number}|null=null;
  private arrivalStart=0;
  private target = new THREE.Vector3(0, .2, 0);
  private mode: CameraMode = 'overview';
  private game: GameState;
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
  private destination: THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>;
  private destinationEdge: THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>;
  private selection: THREE.Mesh<THREE.BufferGeometry,THREE.MeshBasicMaterial>;

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
      const placement=tileOffset(point,.10,-1.13);
      model.position.set(placement.x,.17,placement.z);model.rotation.y=tileRotation(point);
      model.scale.setScalar(.55);landmarks.add(model);
    }
    this.scene.add(landmarks);this.batchScenery(landmarks);
    const diceMaterials = this.art.diceMaterials();
    for (let i = 0; i < 2; i++) {
      const die = new THREE.Mesh(new THREE.BoxGeometry(.34, .34, .34), diceMaterials); this.scene.add(die); this.dice.push(die);
    }
    this.destinationEdge=this.tileMarker(WORLD.house.flagPole,.085,true);
    this.destination=this.tileMarker(GAMEPLAY_VISUAL.destination,.055,true);
    this.selection=this.tileMarker(GAMEPLAY_VISUAL.selection,.035,false);this.selection.material.opacity=.78;
    this.scene.add(this.destinationEdge,this.destination,this.selection);
    const template=this.art.ownerFlag();template.banner.material.color.set(0xffffff);template.group.updateMatrixWorld(true);
    const propertyCount=BOARD.filter(t=>t.propertyId).length;
    for(const [i,child] of template.group.children.entries()){
      const part=child as THREE.Mesh;
      const batch=new THREE.InstancedMesh(part.geometry,part.material,propertyCount);batch.frustumCulled=false;
      const hidden=new THREE.Matrix4().makeScale(0,0,0);
      for(let index=0;index<propertyCount;index++)batch.setMatrixAt(index,hidden);
      if(child===template.banner){this.bannerPart=i;for(let index=0;index<propertyCount;index++)batch.setColorAt(index,new THREE.Color(WORLD.tile.paper));}
      this.flagParts.push(batch);this.flagTransforms.push(part.matrix.clone());this.scene.add(batch);
    }
    for(const tile of BOARD){
      if(!tile.propertyId)continue;
      this.flags.set(tile.propertyId,{index:this.flags.size,ownerIndex:-2});
    }
    this.camera.position.copy(cameraOffset).add(this.target); this.camera.lookAt(this.target);
    this.resize(host.clientWidth, host.clientHeight);
    this.setGame(game);
  }

  private tileMarker(color:string,thickness:number,corners:boolean) {
    const vertices:number[]=[],indices:number[]=[];
    const rect=(x:number,z:number,w:number,d:number)=>{
      const offset=vertices.length/3;
      vertices.push(x,0,z,x+w,0,z,x+w,0,z+d,x,0,z+d);
      indices.push(offset,offset+2,offset+1,offset,offset+3,offset+2);
    };
    if(corners){for(const x of [-1,1])for(const z of [-1,1]){
      rect(x<0?-.5:.5-.24,z<0?-.5:.5-thickness,.24,thickness);
      rect(x<0?-.5:.5-thickness,z<0?-.5:.5-.24,thickness,.24);
    }}else{
      rect(-.5,-.5,1,thickness);rect(-.5,.5-thickness,1,thickness);
      rect(-.5,-.5,thickness,1);rect(.5-thickness,-.5,thickness,1);
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);
    const marker=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color,transparent:true,opacity:1,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true}));
    marker.visible=false;marker.renderOrder=2;return marker;
  }

  setSelection(id:string|null){if(this.selectedPropertyId!==id){this.selectedPropertyId=id;this.request();}}

  private environment() {
    const a = this.art, scene = this.scene, platform = BOARD_PLATFORM;
    a.box(scene, 0, -1.27, 0, 100, .15, 100, UI_COLORS['game-bg']);
    a.box(scene, 0, -.92, 0, platform.islandSize, .68, platform.islandSize, WORLD.environment.stone);
    a.box(scene, 0, -.56, 0, platform.islandRimSize, .14, platform.islandRimSize, WORLD.environment.grassRim);
    a.box(scene, 0, -.33, 0, platform.plinthSize, .40, platform.plinthSize, WORLD.environment.stoneTop);
    a.box(scene, 0, -.08, 0, platform.rimSize, .18, platform.rimSize, WORLD.environment.rim);
    a.box(scene, 0, .05, 0, platform.courtyardSize, .15, platform.courtyardSize, WORLD.environment.grass);
    // Paved courtyard surrounds the open grass; no title/controls in the scene.
    for (const side of [-1, 1]) {
      a.box(scene, side * 3.60, .145, 0, .36, .025, 7.6, WORLD.environment.path);
      a.box(scene, 0, .145, side * 3.60, 7.6, .025, .36, WORLD.environment.path);
      // Block joints on the raised island, rather than costly shadow maps.
      for (let i = -6; i <= 6; i++) {
        const face = side * (platform.islandSize / 2 + .007);
        a.box(scene, i, -.89, face, .025, .58, .015, WORLD.environment.joint);
        a.box(scene, face, -.89, i, .015, .58, .025, WORLD.environment.joint);
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
      const inverse=new THREE.Matrix4().copy(root.matrixWorld).invert();
      meshes.forEach((mesh, index) => { batch.setMatrixAt(index, new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld)); mesh.removeFromParent(); });
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
    const previous=this.game;
    this.game = game;
    if(previous.currentPlayerId!==game.currentPlayerId||previous.phase!==game.phase&&game.phase==='TURN_START')this.turnPulseStart=performance.now();
    const destination=movementDestination(game);
    if(destination!==null){
      this.movementTarget={actor:game.currentPlayerId,index:destination};this.arrivalStart=0;
    }else if(this.movementTarget){
      const actor=game.players.find(p=>p.id===this.movementTarget!.actor);
      if(previous.phase==='MOVING'&&actor?.position===this.movementTarget.index&&game.phase==='RESOLVING_TILE')this.arrivalStart=performance.now();
      else if(actor?.id!==game.currentPlayerId||actor.isBankrupt||actor.position!==this.movementTarget.index||['ROLLING','TURN_START','GAME_START','GAME_OVER','JAIL_DECISION'].includes(game.phase)){
        this.movementTarget=null;this.arrivalStart=0;
      }
    }
    for(const tile of BOARD){
      if(!tile.propertyId)continue;
      const state=game.properties[tile.propertyId],flag=this.flags.get(tile.propertyId)!;
      const ownerIndex=game.players.findIndex(p=>p.id===state.ownerId&&!p.isBankrupt);
      if(flag.ownerIndex!==ownerIndex){
        flag.ownerIndex=ownerIndex;
        const point=SQUARE_TILES[tile.index],pos=tileOffset(point,TILE_VISUAL_LAYOUT.flag.x,TILE_VISUAL_LAYOUT.flag.z);
        const matrix=new THREE.Matrix4().compose(new THREE.Vector3(pos.x,.18,pos.z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),tileRotation(point)),new THREE.Vector3(1,1,1));
        this.flagParts.forEach((part,i)=>{
          part.setMatrixAt(flag.index,ownerIndex<0?new THREE.Matrix4().makeScale(0,0,0):new THREE.Matrix4().multiplyMatrices(matrix,this.flagTransforms[i]));part.instanceMatrix.needsUpdate=true;
        });
        const banners=this.flagParts[this.bannerPart];banners.setColorAt(flag.index,new THREE.Color(ownerIndex<0?WORLD.tile.paper:PLAYER_COLORS[ownerIndex]));banners.instanceColor!.needsUpdate=true;
      }
      const level=ownerIndex>=0?state.level:0,existing=this.buildings.get(tile.propertyId);
      if(existing?.level===level||!existing&&!level)continue;
      if(existing){existing.node.traverse(node=>{if(node instanceof THREE.InstancedMesh)node.dispose();});existing.node.removeFromParent();this.buildings.delete(tile.propertyId);}
      if(level){
        const point=SQUARE_TILES[tile.index],pos=tileOffset(point,TILE_VISUAL_LAYOUT.building.x,TILE_VISUAL_LAYOUT.building.z);
        const node=this.art.house(level);node.position.set(pos.x,.18,pos.z);node.rotation.y=tileRotation(point);node.scale.setScalar(.86);
        this.houses.add(node);this.batchScenery(node);this.buildings.set(tile.propertyId,{level,node});
      }
    }
    const hasOwner=[...this.flags.values()].some(f=>f.ownerIndex>=0);
    for(const part of this.flagParts)part.visible=hasOwner;
    for (const [index, player] of game.players.entries()) {
      const point = SQUARE_TILES[player.position];
      const peers=occupants(game,player.position),slot=player.isBankrupt?{x:0,z:0}:formationSlot(peers.length,peers.indexOf(player.id));
      const outward=point.corner?TILE_VISUAL_LAYOUT.cornerPawnOutward:peers.length>2?TILE_VISUAL_LAYOUT.crowdedPawnOutward:TILE_VISUAL_LAYOUT.pawnOutward;
      const pos=tileOffset(point,slot.x,slot.z+outward);
      const target = new THREE.Vector3(pos.x, .18, pos.z);
      let motion = this.pawns.get(player.id);
      if (!motion) {
        const node = this.art.pawn(PLAYER_COLORS[index], index); node.scale.setScalar(.75); node.position.copy(target); this.scene.add(node);
        const ring=new THREE.Group();
        const colorRing=new THREE.Mesh(this.ringGeometry,new THREE.MeshBasicMaterial({color:PLAYER_COLORS[index],transparent:true,opacity:GAMEPLAY_VISUAL.inactiveRingOpacity,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true}));
        const edge=new THREE.Mesh(this.ringEdgeGeometry,this.ringEdgeMaterial);colorRing.rotation.x=edge.rotation.x=-Math.PI/2;ring.add(colorRing,edge);this.scene.add(ring);
        const identityDot=new THREE.Group(),edgeDot=new THREE.Mesh(this.dotGeometry,this.dotEdgeMaterial);
        const centerDot=new THREE.Mesh(this.dotGeometry,new THREE.MeshBasicMaterial({color:PLAYER_COLORS[index],side:THREE.DoubleSide,depthTest:false}));
        centerDot.scale.setScalar(.76);centerDot.position.z=.002;edgeDot.renderOrder=3;centerDot.renderOrder=4;
        identityDot.add(edgeDot,centerDot);identityDot.visible=false;this.scene.add(identityDot);
        motion = { node,ring,identityDot,colorRing, from: target.clone(), to: target, start: 0 }; this.pawns.set(player.id, motion);
      }
      motion.node.visible = motion.ring.visible = !player.isBankrupt;
      if(player.jailed && motion.to.distanceTo(target)>2){motion.node.position.copy(target);motion.from.copy(target);motion.to=target;motion.start=0;}
      if (!motion.to.equals(target)) {
        motion.from.copy(motion.node.position); motion.to = target; motion.start = performance.now();
        motion.node.rotation.y = Math.atan2(target.x - motion.from.x, target.z - motion.from.z);
      }
    }
    for(const [id,motion] of this.pawns)if(!game.players.some(p=>p.id===id)){motion.node.removeFromParent();motion.ring.removeFromParent();motion.identityDot.traverse(n=>{if(n instanceof THREE.Mesh&&n.material!==this.dotEdgeMaterial)(n.material as THREE.Material).dispose();});motion.identityDot.removeFromParent();motion.colorRing.material.dispose();motion.node.traverse(n=>{if(n instanceof THREE.Mesh&&n.geometry.type==='ConeGeometry')n.geometry.dispose();});this.pawns.delete(id);}
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
      const t = this.reduced || !motion.start ? 1 : Math.min(1, (now - motion.start) / GAMEPLAY_VISUAL.stepMs);
      const smooth = t * t * (3 - 2 * t);
      motion.node.position.lerpVectors(motion.from, motion.to, smooth);
      motion.node.position.y += Math.sin(t * Math.PI) * GAMEPLAY_VISUAL.stepBounce;
      if (t < 1) animating = true;
      const active=motion===this.pawns.get(this.game.currentPlayerId);
      const pulse=this.reduced?1:Math.min(1,(now-this.turnPulseStart)/GAMEPLAY_VISUAL.turnPulseMs);
      motion.ring.position.copy(motion.node.position).setY(.17);
      motion.ring.scale.setScalar(active?1.12+Math.sin(pulse*Math.PI)*.16:1);
      motion.colorRing.material.opacity=active?GAMEPLAY_VISUAL.activeRingOpacity:GAMEPLAY_VISUAL.inactiveRingOpacity;
      if(active&&pulse<1)animating=true;
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
    // Crowded overview gets identity dots; follow assists an active pawn behind the group.
    for(const player of this.game.players){
      const motion=this.pawns.get(player.id)!;
      const peers=occupants(this.game,player.position);
      const behind=peers.some(id=>{const other=this.pawns.get(id)!.node.position;return other.x+other.z>motion.node.position.x+motion.node.position.z+.15;});
      motion.identityDot.visible=!player.isBankrupt&&peers.length>1&&(this.mode==='overview'||player.id===this.game.currentPlayerId&&behind);
      if(motion.identityDot.visible){
        const radius=Math.min(.16,Math.max(.055,2.2*(this.camera.top-this.camera.bottom)/(this.height*this.camera.zoom)));
        motion.identityDot.position.copy(motion.node.position).add(new THREE.Vector3(0,.82,0));motion.identityDot.scale.setScalar(radius);motion.identityDot.lookAt(this.camera.position);
      }
    }
    if (active) {
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
    const destinationIndex=movementDestination(this.game);
    const arrival=this.arrivalStart?(now-this.arrivalStart)/GAMEPLAY_VISUAL.arrivalMs:1;
    const targetIndex=destinationIndex??(arrival<1?this.movementTarget?.index:null);
    this.destination.visible=targetIndex!=null;
    this.destinationEdge.visible=this.destination.visible;
    if(targetIndex!=null){
      const point=SQUARE_TILES[targetIndex];
      this.destination.position.set(point.x,.177,point.z);this.destination.scale.set(point.width-.045,1,point.depth-.045);
      if(destinationIndex===null&&!this.reduced){const pulse=1+Math.sin(arrival*Math.PI)*.035;this.destination.scale.x*=pulse;this.destination.scale.z*=pulse;}
      this.destination.material.opacity=destinationIndex!==null||arrival<.2?1:Math.max(0,(1-arrival)/.8);
      this.destinationEdge.position.copy(this.destination.position).setY(.174);this.destinationEdge.scale.copy(this.destination.scale);this.destinationEdge.material.opacity=this.destination.material.opacity*.82;
      if(destinationIndex===null&&arrival<1&&!this.reduced)animating=true;
      if(this.reduced&&destinationIndex===null)this.destination.visible=this.destinationEdge.visible=false;
    }
    const selectedTile=BOARD.find(t=>t.propertyId===this.selectedPropertyId);
    this.selection.visible=!!selectedTile&&!(this.destination.visible&&targetIndex===selectedTile.index);
    if(selectedTile){const point=SQUARE_TILES[selectedTile.index];this.selection.position.set(point.x,.172,point.z);this.selection.scale.set(point.width-.055,1,point.depth-.055);}
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
    this.host.dataset.destinationTile=targetIndex==null?'':String(targetIndex);
    this.host.dataset.selectedProperty=this.selectedPropertyId??'';
    this.host.dataset.ownerFlags=JSON.stringify([...this.flags].filter(([,f])=>f.ownerIndex>=0).map(([id,f])=>{const color=new THREE.Color();this.flagParts[this.bannerPart].getColorAt(f.index,color);return {id,color:'#'+color.getHexString()};}));
    this.host.dataset.buildingLevels=JSON.stringify([...this.buildings].map(([id,b])=>({id,level:b.level})));
    this.host.dataset.pawnSlots=JSON.stringify([...this.pawns].filter(([,m])=>m.node.visible).map(([id,m])=>{const p=m.node.position.clone().setY(.55).project(this.camera);return {id,x:m.to.x,z:m.to.z,screenX:(p.x+1)*this.width/2,screenY:(1-p.y)*this.height/2};}));
    this.host.dataset.resourceMemory=JSON.stringify(this.renderer.info.memory);
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
    this.ringGeometry.dispose();this.ringEdgeGeometry.dispose();this.ringEdgeMaterial.dispose();
    this.dotGeometry.dispose();this.dotEdgeMaterial.dispose();
    this.art.dispose();this.renderer.dispose();
    if (!this.renderer.getContext().isContextLost()) this.renderer.forceContextLoss();
    this.renderer.domElement.remove(); this.scene.clear();
  }
}
