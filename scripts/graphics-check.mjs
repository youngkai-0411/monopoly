import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const base = process.env.MONOPOLY_GRAPHICS_URL ?? 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: process.env.MONOPOLY_BROWSER ?? 'chrome', headless: true });
const errors = [], viewports = [];
try {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()); });
  await page.goto(`${base}/?graphics=1`);
  const host = page.locator('.three-board-host');
  await host.locator('canvas').waitFor();
  for (const [width, height] of [[568, 320], [667, 375], [740, 360], [844, 390], [932, 430], [1024, 768], [1440, 900]]) {
    await page.setViewportSize({ width, height });
    await page.waitForTimeout(180);
    const result = await page.evaluate(() => {
      const host = document.querySelector('.three-board-host');
      const tiles = [...host.querySelectorAll('[data-tile]')];
      const overlays = [...document.querySelectorAll('.three-status,.three-toolbar,.three-camera-buttons')];
      const polygon = JSON.parse(host.dataset.boardScreenPolygon), hostBounds = host.getBoundingClientRect();
      const intersectsBoard = element => {
        const box = element.getBoundingClientRect();
        const rectangle = [{ x: box.left - hostBounds.left, y: box.top - hostBounds.top }, { x: box.right - hostBounds.left, y: box.top - hostBounds.top },
          { x: box.right - hostBounds.left, y: box.bottom - hostBounds.top }, { x: box.left - hostBounds.left, y: box.bottom - hostBounds.top }];
        const axes = [{ x: 1, y: 0 }, { x: 0, y: 1 }, ...polygon.map((p, i) => {
          const next = polygon[(i + 1) % polygon.length]; return { x: -(next.y - p.y), y: next.x - p.x };
        })];
        return !axes.some(axis => {
          const a = polygon.map(p => p.x * axis.x + p.y * axis.y), b = rectangle.map(p => p.x * axis.x + p.y * axis.y);
          return Math.max(...a) <= Math.min(...b) || Math.max(...b) <= Math.min(...a);
        });
      };
      return { width: innerWidth, height: innerHeight, tiles: tiles.length, properties: host.querySelectorAll('.three-property').length,
        uniformSizes: [...new Set(tiles.map(tile => tile.dataset.size))], uniquePositions: new Set(tiles.map(tile => `${tile.dataset.worldX}:${tile.dataset.worldZ}`)).size,
        fullBoardFits: host.dataset.overviewFits === 'true', canvasCount: host.querySelectorAll('canvas').length,
        overlaysOutsideBoard: overlays.every(element => !intersectsBoard(element)),
        drawCalls: Number(host.dataset.drawCalls), triangles: Number(host.dataset.triangles),
        overlaysFit: overlays.every(element => { const box = element.getBoundingClientRect(); return box.left >= 0 && box.top >= 0 && box.right <= innerWidth + 1 && box.bottom <= innerHeight + 1; }),
        pageScroll: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight,
        primaryHeight: document.querySelector('.three-toolbar .roll-button').getBoundingClientRect().height };
    });
    viewports.push(result);
    assert.equal(result.tiles, 40); assert.equal(result.properties, 28); assert.equal(result.uniquePositions, 40);
    assert.deepEqual(result.uniformSizes.sort(), ['1', '1.6']); assert.equal(result.fullBoardFits, true);
    assert.equal(result.canvasCount, 1); assert.equal(result.overlaysFit, true); assert.equal(result.pageScroll, false);
    assert.equal(result.overlaysOutsideBoard, true, `HUD should not cover any tile at ${width}×${height}`);
    assert.ok(result.primaryHeight >= 48);
    if (width === 844) await page.screenshot({ path: 'docs/3d-overview-mobile.png' });
    if (width === 568) await page.screenshot({ path: 'docs/3d-overview-small-mobile.png' });
  }
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(200);
  const initialRenders = Number(await host.getAttribute('data-render-count'));
  await page.waitForTimeout(600);
  const idleRenders = Number(await host.getAttribute('data-render-count')) - initialRenders;
  assert.equal(idleRenders, 0);
  const start = JSON.parse(await host.getAttribute('data-start-screen'));
  const bounds = await host.boundingBox();
  await page.mouse.click(bounds.x + start.x, bounds.y + start.y);
  assert.equal(await page.locator('.three-preview').getAttribute('data-selected-tile'), '0', 'Raycaster should select the Start cell');
  const accessibleProperty = page.getByRole('button', { name: 'Ô 2: Cà Mau', exact: true });
  await accessibleProperty.focus(); await accessibleProperty.press('Enter');
  assert.equal(await page.locator('.three-status p').textContent(), 'Cà Mau');
  await page.getByRole('button', { name: 'THỬ MỘT LƯỢT →' }).focus();
  await page.getByRole('button', { name: 'Theo nhân vật', exact: true }).tap();
  await page.waitForFunction(() => Number(document.querySelector('.three-board-host').dataset.cameraZoom) > 3.19);
  assert.equal(await host.getAttribute('data-camera-mode'), 'follow');
  await page.getByRole('button', { name: 'Toàn bàn', exact: true }).tap();
  await page.waitForFunction(() => Number(document.querySelector('.three-board-host').dataset.cameraZoom) < 1.01);
  await page.getByRole('button', { name: 'THỬ MỘT LƯỢT →' }).tap();
  const phases = [];
  for (const phase of ['FOCUS', 'ROLLING', 'MOVING', 'LANDING', 'RETURNING', 'OVERVIEW']) {
    await page.waitForFunction(expected => document.querySelector('.three-preview').dataset.demoPhase === expected, phase);
    phases.push(phase);
    if (phase === 'MOVING') {
      await page.waitForTimeout(900);
      assert.ok(Number(await host.getAttribute('data-camera-zoom')) > 3);
      const target = JSON.parse(await host.getAttribute('data-camera-target'));
      assert.ok(target.x < Number(await host.locator('[data-tile="0"]').getAttribute('data-world-x')) - .1, 'Camera must follow the pawn away from Start');
      await page.screenshot({ path: 'docs/3d-follow-mobile.png' });
    }
    if (phase === 'LANDING') await page.screenshot({ path: 'docs/3d-landing-mobile.png' });
  }
  await page.waitForFunction(() => Number(document.querySelector('.three-board-host').dataset.cameraZoom) < 1.01);
  assert.equal(await host.getAttribute('data-overview-fits'), 'true');
  assert.ok((await page.locator('.player-chip.active').textContent()).includes('Mũ xanh'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByText('Hãy xoay ngang điện thoại', { exact: true }).waitFor({ state: 'visible' });
  await page.setViewportSize({ width: 844, height: 390 }); await page.waitForTimeout(200);
  assert.equal(await host.locator('canvas').count(), 1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Theo nhân vật', exact: true }).tap();
  await page.waitForFunction(() => document.querySelector('.three-board-host').dataset.cameraZoom === '3.200');
  const frames = Number(await host.getAttribute('data-render-count')); await page.waitForTimeout(200);
  assert.equal(Number(await host.getAttribute('data-render-count')) - frames, 0, 'Reduced motion must settle immediately');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Toàn bàn', exact: true }).tap();
  await page.waitForFunction(() => Number(document.querySelector('.three-board-host').dataset.cameraZoom) < 1.01);
  assert.deepEqual(errors, []);
  const report = { testedAt: new Date().toISOString(), url: base, browser: await browser.version(),
    environment: 'Windows desktop Chrome; mobile viewport/touch emulation, NOT physical Android/iPhone',
    viewports, idleRenders, raycastSelection: true, keyboardSelection: true, manualCamera: true, phaseSequence: phases,
    cameraFollowsPawn: true, returnsToFullBoard: true, nextPlayer: true, portraitFallback: true, reducedMotion: true, errors };
  await writeFile('docs/3d-viewport-checks.json', `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
} finally { await browser.close(); }
