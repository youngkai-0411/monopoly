import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const d = JSON.parse(await read('docs/classic-vietnam-v2.json'));
const spec = await read('docs/classic-vietnam-spec.md');
const checks = [];
const check = (name, verify) => { verify(); checks.push({ name, passed: true }); };
const byId = new Map(d.assets.map(a => [a.id, a]));
const kinds = 'START LAND LIFE LAND TAX RAILROAD LAND CHANCE LAND LAND JAIL LAND UTILITY LAND LAND RAILROAD LAND LIFE LAND LAND REST LAND CHANCE LAND LAND RAILROAD LAND LAND UTILITY LAND GO_TO_JAIL LAND LAND LIFE LAND RAILROAD CHANCE LAND TAX LAND'.split(' ');

check('reference board order and corners', () => {
  assert.equal(d.board.length, 40);
  assert.deepEqual(d.board.map(t => t.index), Array.from({ length: 40 }, (_, i) => i));
  assert.deepEqual(d.board.map(t => t.kind), kinds);
  assert.deepEqual(d.geometry.cornerIndices, [0, 10, 20, 30]);
});
check('28 unique assets and one board occurrence each', () => {
  assert.equal(d.assets.length, 28);
  assert.equal(byId.size, 28);
  const placed = d.board.filter(t => t.assetId);
  assert.equal(placed.length, 28);
  assert.equal(new Set(placed.map(t => t.assetId)).size, 28);
  for (const t of placed) assert.equal(byId.get(t.assetId)?.kind, t.kind);
  for (const kind of ['LAND', 'RAILROAD', 'UTILITY']) {
    assert.equal(d.assets.filter(a => a.kind === kind).length, { LAND: 22, RAILROAD: 4, UTILITY: 2 }[kind]);
  }
});
check('eight groups, six triples and two pairs, all land assigned once', () => {
  assert.equal(d.groups.length, 8);
  assert.equal(new Set(d.groups.map(g => g.id)).size, 8);
  assert.deepEqual(d.groups.map(g => g.assetIds.length), [2, 3, 3, 3, 3, 3, 3, 2]);
  const members = d.groups.flatMap(g => g.assetIds);
  assert.equal(members.length, 22);
  assert.equal(new Set(members).size, 22);
  for (const g of d.groups) for (const id of g.assetIds) {
    const asset = byId.get(id);
    assert.equal(asset?.kind, 'LAND');
    assert.equal(asset.groupId, g.id);
  }
});
check('integer positive prices and increasing rent tables', () => {
  for (const a of d.assets) {
    assert.ok(Number.isInteger(a.price) && a.price > 0);
    if (a.kind === 'LAND') {
      assert.equal(a.rentByLevel.length, 6);
      assert.ok(Number.isInteger(a.houseCost) && a.houseCost > 0);
      assert.equal(a.hotelCost, a.houseCost);
      a.rentByLevel.forEach((rent, i, table) => {
        assert.ok(Number.isInteger(rent) && rent > 0);
        if (i > 0) assert.ok(rent > table[i - 1]);
      });
      assert.equal(d.groups.find(g => g.id === a.groupId)?.assetIds.includes(a.id), true);
    } else {
      assert.equal(a.groupId, undefined);
      assert.equal(a.rentByLevel, undefined);
      assert.equal(a.houseCost, undefined);
    }
  }
});
check('starting cash, fees and all rail/utility economics', () => {
  assert.equal(d.economy.startingMoney, 1500);
  assert.equal(d.economy.passStartReward, 200);
  assert.equal(d.economy.jailFine, 50);
  assert.equal(d.economy.jailMaxAttempts, 3);
  assert.equal(d.economy.maxConsecutiveDoubles, 3);
  assert.equal(d.economy.undevelopedSetRentMultiplier, 2);
  assert.equal(d.economy.landLevelCount, 6);
  assert.equal(d.economy.sellBuildingRate, 0.5);
  assert.deepEqual(d.economy.buildingBank, { houses: 32, hotels: 12 });
  assert.deepEqual(d.board.filter(t => t.kind === 'TAX').map(t => t.amount), [200, 100]);
  assert.deepEqual(d.economy.railroadRent, [25, 50, 100, 200]);
  assert.deepEqual(d.economy.utilityRentMultipliers, [4, 10]);
  assert.equal(d.economy.utilityDiceSource, 'NEW_RENT_ROLL');
  for (const a of d.assets.filter(a => a.kind === 'RAILROAD')) {
    assert.equal(a.price, 200);
    assert.deepEqual(a.rentByOwnedCount, d.economy.railroadRent);
  }
  for (const a of d.assets.filter(a => a.kind === 'UTILITY')) {
    assert.equal(a.price, 150);
    assert.deepEqual(a.rentMultiplierByOwnedCount, d.economy.utilityRentMultipliers);
  }
});
check('square closes with nine normal tiles and two corners per side', () => {
  const g = d.geometry;
  assert.equal(g.normalTilesBetweenCorners, 9);
  assert.equal(g.normalTileDepth, g.cornerSize);
  assert.equal(g.boardOuterSize, g.normalTilesBetweenCorners * g.normalTileWidth + 2 * g.cornerSize);
  assert.equal(4 * g.normalTilesBetweenCorners + 4, d.board.length);
});
// Retained display metadata contains the original 23 landmark IDs.
const legacy = await read('src/game/data/properties.ts');
const legacyIds = [...legacy.matchAll(/^  "([^"]+)": \{/gm)].map(m => m[1]);
check('retained land IDs match legacy data minus Phu Quoc', () => {
  assert.equal(legacyIds.length, 23);
  assert.deepEqual(d.migration.removedLandIds, ['phu-quoc']);
  assert.deepEqual(d.assets.filter(a => a.kind === 'LAND').map(a => a.id),
    legacyIds.filter(id => !d.migration.removedLandIds.includes(id)));
});

check('documentation board/group/rent tables match JSON', () => {
  const kindNames = { START: 'Bắt đầu', LAND: 'Đất', RAILROAD: 'Ga', UTILITY: 'Tiện ích', CHANCE: 'Rút Cơ Hội', LIFE: 'Rút Cuộc Sống', TAX: 'Thuế', JAIL: 'Nhà tù / Thăm tù', REST: 'Nghỉ ngơi', GO_TO_JAIL: 'Đi tù' };
  for (const t of d.board) {
    const a = byId.get(t.assetId);
    const color = a?.groupId ? d.groups.find(g => g.id === a.groupId).colorName : '—';
    assert.ok(spec.includes('| ' + [t.index, a?.name ?? t.name, kindNames[t.kind], color, a?.price ?? t.amount ?? '—'].join(' | ') + ' |'));
  }
  for (const g of d.groups) assert.ok(spec.includes('| ' + [g.name, g.colorName + ' (' + g.color + ')', g.assetIds.map(id => byId.get(id).name).join(', ')].join(' | ') + ' |'));
  for (const a of d.assets.filter(a => a.kind === 'LAND')) assert.ok(spec.includes('| ' + [a.name, a.price, a.houseCost, ...a.rentByLevel].join(' | ') + ' |'));
});
check('runtime enabled and deferred scope explicit', () => {
  assert.equal(d.runtimeEnabled, true);
  assert.equal(d.status, 'IMPLEMENTED');
  assert.equal(d.migration.newGameRequired, true);
  for (const feature of ['AUCTIONS', 'MORTGAGES', 'TRADING', 'CLASSIC_CREDITOR_ASSET_TRANSFER']) assert.ok(d.scope.deferredNeedsScopeDecision.includes(feature));
});
const report = { checkedAt: new Date().toISOString(), manifest: d.id, scope: 'RUNTIME_DATA_AND_DOCUMENTATION', passed: true, counts: { tiles: 40, ownable: 28, land: 22, railroads: 4, utilities: 2, groups: 8 }, checks };
await writeFile(new URL('docs/classic-design-checks.json', root), JSON.stringify(report, null, 2) + '\n');
console.log('Classic Vietnam design: ' + checks.length + ' checks passed (data and documentation; engine validated by npm test).');
