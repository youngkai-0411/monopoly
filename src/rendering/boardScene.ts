import { Application, Container, Graphics } from 'pixi.js';
import { BOARD } from '../game/data/board';
import { PROPERTIES } from '../game/data/properties';
import type { GameState } from '../game/types/domain';
import { PLAYER_COLORS } from '../components/format';
import type { BoardGeometry, Point } from './boardGeometry';
import { GROUP_COLORS, SPECIAL_COLORS, house, pawn, tree } from './sceneArt';

const definitions = new Map(PROPERTIES.map(p => [p.id, p]));
interface PawnView { node: Container; from: Point; target: Point; started: number }

/** Presentation only: no dice sampling, turn transitions or economy changes. */
export class BoardScene {
  private base = new Container();
  private properties = new Container();
  private people = new Container();
  private highlight = new Graphics();
  private pawns = new Map<string, PawnView>();
  private geometry: BoardGeometry | null = null;
  private propertySignature = '';
  private frame = 0;
  private visible = !document.hidden;
  private reducedMotion = false;
  private dead = false;

  constructor(private app: Application) {
    this.people.sortableChildren = true;
    app.stage.eventMode = 'none';
    app.stage.addChild(this.base, this.properties, this.highlight, this.people);
  }

  resize(geometry: BoardGeometry, game: GameState) {
    this.geometry = geometry;
    this.app.renderer.resize(geometry.width, geometry.height);
    this.clear(this.base);
    this.clear(this.people);
    this.pawns.clear();
    this.propertySignature = '';
    const { outline, center, depth } = geometry;
    const g = new Graphics();
    g.poly(outline.map((v, i) => i % 2 ? v + depth + 3 : v + 1)).fill({ color: 0x102f38, alpha: .22 });
    g.poly(outline.map((v, i) => i % 2 ? v + depth : v)).fill(0x2e6669);
    g.poly(outline).fill(0xb9d0c1).stroke({ color: 0xf6f0cf, width: 2 });
    g.roundRect(center.x - 8, center.y - 4, center.width + 16, center.height + 8, 7).fill(0x91c79a);
    g.roundRect(center.x - 2, center.y + 2, center.width + 4, center.height - 4, 8).fill(0x78b78a);
    // Inlaid courtyard paths and grass, without filters or dynamic shadows.
    g.roundRect(center.x + 12, center.y + 12, center.width - 24, center.height - 24, 18)
      .stroke({ color: 0xdde2b4, width: 9, alpha: .75 });
    for (let i = 0; i < 7; i++) {
      g.rect(center.x + 28 + i * (center.width - 56) / 7, center.y + 22, 1, Math.max(1, center.height - 44)).fill({ color: 0xe9efc4, alpha: .13 });
    }
    for (const tile of BOARD) {
      const shape = geometry.tiles[tile.index];
      const definition = tile.propertyId ? definitions.get(tile.propertyId) : null;
      g.poly(shape.polygon).fill(definition ? 0xfff5db : SPECIAL_COLORS[tile.type]);
      g.poly(shape.polygon).stroke({ color: 0xa2b0a0, width: 1, alpha: .8 });
      if (definition) {
        const [a, b, c, d] = shape.polygon;
        if (shape.side) {
          const bottomX = shape.polygon[6], bottomY = shape.polygon[7];
          g.poly([a, b, a + 5, b, bottomX + 5, bottomY, bottomX, bottomY]).fill(GROUP_COLORS[definition.groupId ?? ''] ?? 0x477b86);
        } else {
          g.poly([a, b, c, d, c - .4, d + 5, a - .4, b + 5]).fill(GROUP_COLORS[definition.groupId ?? ''] ?? 0x477b86);
        }
      }
    }
    this.base.addChild(g);
    // Small scenery stays at the courtyard edges, clear of the control panel.
    for (const [x, y] of [[center.x + 15, center.y + 38], [center.x + center.width - 14, center.y + 40],
      [center.x + 15, center.y + center.height - 12], [center.x + center.width - 14, center.y + center.height - 12]]) {
      const model = tree();
      model.position.set(x, y);
      model.scale.set(geometry.height < 340 ? .6 : .85);
      this.base.addChild(model);
    }
    if (center.width > 460) {
      const left = house(2, 0x52a6a0);
      left.position.set(center.x + 40, center.y + center.height * .65);
      left.scale.set(1.1);
      const right = house(3, 0xe9a855);
      right.position.set(center.x + center.width - 40, center.y + center.height * .65);
      right.scale.set(1.1);
      this.base.addChild(left, right);
    }
    this.setGame(game);
  }

  setGame(game: GameState) {
    const geometry = this.geometry;
    if (!geometry || this.dead) return;
    const signature = PROPERTIES.map(p => `${game.properties[p.id].ownerId}:${game.properties[p.id].level}`).join('|');
    if (signature !== this.propertySignature) {
      this.propertySignature = signature;
      this.clear(this.properties);
      for (const tile of BOARD) {
        if (!tile.propertyId) continue;
        const state = game.properties[tile.propertyId];
        if (!state.ownerId) continue;
        const shape = geometry.tiles[tile.index];
        const color = Number.parseInt(PLAYER_COLORS[game.players.findIndex(p => p.id === state.ownerId)].slice(1), 16);
        const mark = new Graphics().roundRect(shape.x + 3, shape.y + shape.height - 4, shape.width - 6, 3, 1).fill(color);
        this.properties.addChild(mark);
        if (state.level) {
          const building = house(state.level, color);
          building.position.set(shape.marker.x, shape.marker.y + 1);
          building.scale.set(shape.side ? Math.min(.6, shape.height / 45) : Math.min(.7, shape.width / 49));
          this.properties.addChild(building);
        }
      }
    }
    for (const [index, player] of game.players.entries()) {
      const shape = geometry.tiles[player.position];
      const target = { x: shape.marker.x + (index % 2 ? 6 : -6), y: shape.marker.y + (index < 2 ? 0 : 7) };
      let view = this.pawns.get(player.id);
      if (!view) {
        const node = pawn(Number.parseInt(PLAYER_COLORS[index].slice(1), 16), index);
        node.scale.set(shape.side ? Math.min(.62, shape.height / 43) : Math.min(.7, shape.width / 48));
        node.position.set(target.x, target.y);
        view = { node, from: target, target, started: 0 };
        this.pawns.set(player.id, view);
        this.people.addChild(node);
      }
      view.node.visible = !player.isBankrupt;
      view.node.scale.set(shape.side ? Math.min(.62, shape.height / 43) : Math.min(.7, shape.width / 48));
      if (view.target.x !== target.x || view.target.y !== target.y) {
        view.from = { x: view.node.x, y: view.node.y };
        view.target = target;
        view.started = performance.now();
      }
    }
    const active = game.players.find(p => p.id === game.currentPlayerId);
    this.highlight.clear();
    if (active && !active.isBankrupt) {
      this.highlight.poly(geometry.tiles[active.position].polygon).stroke({ color: 0xffbf38, width: 2.5 });
    }
    this.schedule();
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    if (visible) this.schedule();
    else { cancelAnimationFrame(this.frame); this.frame = 0; }
  }
  setReducedMotion(reduced: boolean) { this.reducedMotion = reduced; this.schedule(); }

  private schedule() {
    if (!this.frame && this.visible && !this.dead) this.frame = requestAnimationFrame(this.draw);
  }
  private draw = (now: number) => {
    this.frame = 0;
    if (!this.visible || this.dead) return;
    let moving = false;
    for (const view of this.pawns.values()) {
      const t = this.reducedMotion || !view.started ? 1 : Math.min(1, (now - view.started) / 100);
      const ease = 1 - (1 - t) ** 2;
      view.node.position.set(view.from.x + (view.target.x - view.from.x) * ease,
        view.from.y + (view.target.y - view.from.y) * ease - Math.sin(t * Math.PI) * 4);
      view.node.zIndex = view.node.y;
      if (t < 1 && view.node.visible) moving = true;
    }
    this.app.render();
    // No idle render loop: a turn-based board only redraws after changes.
    if (moving) this.schedule();
  };
  private clear(container: Container) {
    for (const child of container.removeChildren()) child.destroy({ children: true });
  }
  destroy() { this.dead = true; cancelAnimationFrame(this.frame); }
}
