# Task #4 — Visual Gameplay System V2: Implementation Review

Ngày: 04/10/2026. Baseline: `2019a796667e7b52fa2df7c1cca350f6c1a5bede`.

Đã triển khai P0 + P1 + P2 và kiểm tra/sửa trong cùng lượt làm việc. Báo cáo này ghi kết quả cuối; kế hoạch trước nằm ở `task4-visual-gameplay-review-plan.md`. Chưa commit/push.

## A. Implementation Summary

Bàn cờ hiện có visual channel riêng cho group, owner, development, vị trí player, current turn, selection và destination. Giữ low-poly/isometric/pastel, classic 40 ô, UI V3, palette gốc, atlas/font và hướng camera. Không thêm luật, camera mode, environment redesign, postprocessing hoặc framework mới.

P0 hoàn thiện owner flag, ring, formation, selection chung và destination đúng từ engine. P1 cải thiện bố trí/model nhà và khách sạn, dời special models khỏi vùng in quan trọng, thêm identity dot nhỏ cho nhóm quân đông. P2 giảm bounce, thêm arrival pulse/fade hữu hạn, giữ animation và render lifecycle hoạt động theo nhu cầu.

Checksum xác nhận **19 file engine/rules/data/store không thay đổi**, xem `task4-engine-preservation.json`. Board geometry, group/property definitions và economy giữ nguyên. Báo cáo và ảnh Task #3 vẫn là baseline lịch sử.

## B. Property & Ownership

Group band vẫn nằm trong atlas với màu gốc, xoay theo cạnh bàn. Bỏ owner strip ở world +Z; owner dùng cờ độc lập nên không đè lên band hoặc đổi màu group.

Mỗi LAND/RAILROAD/UTILITY có tối đa một cờ khi có owner hợp lệ. Unowned hoặc owner bankrupt không có cờ. Banner dùng màu player từ constants chung, material Basic không chịu lighting; base material trắng để instance color không bị nhân với màu cream. Pole/base trung tính, viền banner cream giúp nhận ra màu Mint trên nền xanh.

Cờ sử dụng **4 InstancedMesh batches**, capacity 28 properties. Ownership change chỉ cập nhật matrix/color liên quan. Ca transfer, remove/re-add và mua cả ba loại property đã qua kiểm tra. Flags không phụ thuộc level của building.

## C. Player System

Giữ character models và scale .75. Mỗi player có ring cùng màu identity, viền teal mảnh và opacity nhẹ. Active ring rõ hơn và có một pulse turn-start 700 ms; inactive ring dịu hơn. Không có pulse vô hạn.

Formation dựa vào occupancy thực tế, giữ match order:

| Occupancy | Bố trí |
| --- | --- |
| 1 | Giữa vùng đứng dành cho quân |
| 2 | Hai quân cạnh nhau |
| 3 | Tam giác |
| 4 | Lưới 2×2 |

Đổi current player không đảo slot. Quân bankrupt bị loại khỏi occupancy. Khi đến/rời ô, các quân cần đổi slot retarget từ vị trí visual hiện tại, không reset animation mỗi frame. Footprint được kiểm ở mọi cạnh/corner; vùng đứng 3–4 quân kéo vào trong để bàn chân vẫn trên mặt ô.

Trong overview, nhóm từ hai quân có chấm identity nhỏ phía trên đầu. Trong follow, chấm chỉ hỗ trợ active pawn đứng phía sau nhóm theo hướng camera cố định; quân phía trước dùng ring rõ ràng. Không phóng to character để bù crowding. Đã chụp và kiểm riêng bốn current players trên cùng ô khách sạn.

## D. Selection & Destination

`App` giữ một selectedPropertyId. Context không giữ bản sao ID; panel chỉ giữ loại panel. `Board`, `GameOverlay` và `ThreeBoard` nhận cùng effective property ID, bao gồm property decision bắt buộc. Assets → detail và context → detail giữ selection; close/new turn/reset hoặc phase không cho inspect xóa selection thủ công.

Selection là outline mảnh, tĩnh, màu gold trầm (`WORLD.focus.destination`, opacity .78). Destination là corner brackets gold sáng (`WORLD.focus.gold`) với nền warm brown để dễ thấy trên cream. Destination mạnh hơn selection; nếu cùng ô, không chồng hai cue.

Destination chỉ tính khi MOVING có movement thật:

`positiveModulo(player.position + direction × remaining, BOARD.length)`.

Không lấy dice cũ trong ROLLING, không diễn giải lại card rules. Target giữ nguyên qua STEP_MOVE; đã kiểm forward/backward, wrap và nhiều vòng. Khi engine tạo movement, marker xuất hiện trước bước đầu. Utility rent roll và jail decision không tạo movement marker. Teleport/actor change/new roll xóa target cũ.

Arrival giữ thông tin visual ngắn hạn để pulse/fade, không có logical movement state mới và không phát sinh engine actions từ renderer.

## E. Buildings

Giữ đúng luật **Lv.0 trống; Lv.1–4 là 1–4 nhà; Lv.5 là khách sạn**. Cụm hai/ba/bốn nhà tăng footprint và đổi bố trí, không thu nhỏ từng nhà khi thêm nhà. Không biến “2 nhà” trong engine thành một tòa nhà lớn không còn thể hiện số lượng.

Nhà dùng wall cream, roof teal, door/window dark teal. Khách sạn thấp hơn baseline, có roof terracotta và cửa sổ ba tầng. Bỏ full roof player tint; owner luôn đọc từ cờ. Chi tiết flag trang trí ở hotel được thay bằng trim kiến trúc để tránh nhầm với owner flag.

Building nằm ở mép trong, quay theo tile frame; owner flag bên cạnh, pawns ở vùng ngoài trên mặt ô. Cụm nhà reuse primitive và instance các phần lặp. Cache theo property/level; không dựng lại mọi building khi một owner thay đổi. Lv.0–5, even-building và ngân hàng nhà/khách sạn đã qua checks.

## F. Overview / Follow

Giữ orthographic camera, hướng `(12,14,12)`, overview fitting, follow zoom, manual camera override và UI occluder framing. Follow target vẫn là active pawn, nên tọa độ camera đi theo vị trí formation mới; không thêm orbit hoặc property-close camera mode.

Overview ưu tiên phân bố owner/group, development và vị trí quân. Follow ưu tiên active player, chuyển động và tile interaction. Railroad, utility và jail giữ model/icon hiện có, dời/scaled nhẹ vào mép trong theo cùng frame để tránh vùng tên/group. Không bổ sung các loại Travel/Travel Fund từ specification cũ.

Năm viewport bắt buộc 844×390, 852×393, 896×414, 915×412, 932×430 đã kiểm cả trạng thái empty board lẫn owned hotel + four players, selection và destination. Thêm 568×320, 667×375, tablet, desktop và portrait fallback. Bàn fit viewport và không có page scroll trong các ca kiểm.

## G. Motion

Tile movement dùng smoothstep 400 ms và bounce .055, giảm từ .11. Engine STEP_MOVE timer giữ nguyên. Jail teleport không diễn thành một đường đi bộ giả qua các ô.

Arrival 650 ms: nhấn gold target ngắn, scale pulse nhẹ rồi fade; không lưu cue sang lượt tiếp theo. Turn-start pulse 700 ms kết thúc. Reduced motion snap/tối giản, camera/pawn/effect settle về idle. Không thêm ripple/particles vì chưa cần để đọc gameplay.

GraphicsPreview được cập nhật movement remaining và selection props để dùng đúng contract của shared scene; không ảnh hưởng store/engine của game thật.

## H. Files Changed

| File | Thay đổi |
| --- | --- |
| `src/App.tsx` | Shared selection controller và effective property focus |
| `src/components/Board.tsx` | Context dùng shared ID, phase/panel lifecycle, truyền world focus |
| `src/components/GameOverlay.tsx` | Panel không copy ID; assets/detail/decision dùng ID chung |
| `src/components/ThreeBoard.tsx` | Update scene selection qua setter, không remount renderer |
| `src/components/GraphicsPreview.tsx` | Selection/movement contract của demo tương thích scene |
| `src/rendering/tabletopScene.ts` | Flag instancing, rings/identity aid, formation, markers, caches, motion/disposal |
| `src/rendering/tabletopArt.ts` | Owner flag factory; house clusters và hotel silhouette |
| `src/rendering/gameplayVisuals.ts` — mới | Pure destination/occupancy/formation helpers |
| `src/rendering/tileVisualLayout.ts` — mới | Shared side frame và placement zones |
| `src/visual/tokens.ts` | Semantic tuning tham chiếu palette gốc |
| `tests/gameplayVisuals.test.ts` — mới | Destination invariants, occupancy/formation và footprint bounds |
| `scripts/task4-visual-check.mjs` — mới | Reproducible visual fixtures, pinned before source, mobile/lifecycle/resource checks |
| `scripts/production-smoke.mjs` | Sửa harness: inspection hợp lệ ở OPTIONAL_ACTIONS sau lần rent cuối |
| `docs/task4-*.png`, checks JSON, comparison HTML và báo cáo | Bằng chứng before/after, preservation và actual results |
| Các ảnh/report graphics và design check có sẵn | Được tạo lại bởi scripts kiểm tra hiện có |

CSS/fonts, engine/rules/data/store, camera framing, square board và Pixi production source không sửa. Production smoke chỉ sửa điều kiện chờ của test harness; không thay guards hoặc giảm yêu cầu gameplay.

## I. Tests — Actual Results

Chạy bằng bundled Node 24.19.0. Baseline có 86 tests; bản cuối có 95 tests trong 9 files.

| Check | Kết quả |
| --- | --- |
| `npm run typecheck` qua `npm run check` | PASS, không TypeScript errors |
| `npm test` | PASS — 95/95 |
| `npm run build` | PASS — production bundle tạo thành công |
| Lint | Unavailable: package không có lint script/tooling; không khai PASS |
| `npm run design:check` | PASS — 9 checks |
| `npm run game:check` | PASS — 9 viewports, 24 nhóm UI/gameplay checks, errors [] |
| `npm run production:check` | PASS — 28 ended turns, 35 rolls, 6 extra rolls, 2 buys, 5 events, 1 rent; UI-only, không snapshot injection |
| `npm run graphics:check` | PASS — 7 viewports, picking, camera phase sequence, reduced motion, idle, portrait |
| `npm run graphics:check:2d` | PASS — 40 tiles, dice movement, WebGL loss → DOM fallback |
| `node scripts/task4-visual-check.mjs` | PASS — 13 nhóm checks, 9 viewport guards và các fixture states |
| Preservation | PASS — 19 protected files, changed [] |
| `git diff --check` | PASS |
| Comparison artifact | PASS — 16 images tải thành công, slider hoạt động |

Gameplay coverage có buy LAND/RAILROAD/UTILITY, utility rent dice/payment, jail fee/card, xây đều tới hotel, event movement resolve, debt/liquidation, bankruptcy/winner, extra turn, guards/double input, assets/errors, manual overview và context reset. Browser harness còn kiểm actual canvas raycast, keyboard selection, safe-area/long text, WebGL fallback và disposal.

Lỗi trong quá trình kiểm đã được xử lý: marker selection quá chìm; draw pass dư trên transparent DoubleSide planes; idle sample quá sớm khi camera còn settle; production harness chờ WAITING dù đã ở OPTIONAL_ACTIONS; crowded formation vượt mép mặt ô. Không còn check thất bại trong bộ kết quả cuối.

## J. Screenshot Validation

Ảnh chính tại **852×393 CSS px, deviceScaleFactor 2, renderer DPR cap 1.5**. Before từ commit baseline được serve riêng; không reset source đang làm. Cùng game fixture, camera mode/hướng nhìn và viewport; follow anchor thay đổi theo vị trí presentation mới của pawn.

| Yêu cầu | Ảnh |
| --- | --- |
| A — Overview 4 players | `task4-overview-mobile.png`, `task4-hotel-four-overview-mobile.png` |
| B — Follow | `task4-follow-mobile.png`, `task4-hotel-follow-mobile.png` |
| C — Owned + band + flag + building | `task4-owned-developed-mobile.png` |
| D — Unowned, no owner flag | `task4-unowned-mobile.png` |
| E — Selection + UI | `task4-selected-mobile.png`, `task4-selected-detail-mobile.png` |
| F — Gold destination | `task4-destination-mobile.png`, `task4-destination-overview-mobile.png` |
| G — Multiple players | `task4-formation-1-mobile.png` tới `task4-formation-4-mobile.png` |
| H — High-level + flag | `task4-hotel-four-follow-mobile.png`, `task4-level-5-mobile.png` |
| I — Special tiles | `task4-railroad-mobile.png`, `task4-utility-mobile.png`, `task4-jail-mobile.png`; các góc/event/tax trong overview |

Bổ sung `task4-level-0-mobile.png` tới `task4-level-5-mobile.png`; `task4-crowded-active-1-mobile.png` tới `task4-crowded-active-4-mobile.png`; viewport 568/852/932, UI/gameplay/tablet/desktop/production captures. Đã xem trực tiếp các ảnh quan trọng, gồm hotel crowd, mọi current player, level 4/5, selection và destination.

`task4-visual-comparison.html` có 8 cặp before/after với slider. JSON evidence: `task4-before-visual-checks.json`, `task4-visual-checks.json`, `task4-uiux-checks.json`, `task4-production-checks.json`. Ảnh audit Task #3 không bị thay thế.

## K. Performance

Đo render counters cùng fixture và viewport, không dùng FPS giả hoặc gọi browser emulation là máy thật:

| Fixture | Draw calls before → after | Triangles before → after |
| --- | --- | --- |
| Overview, 4 quân ở các góc, unowned | 109 → 116 | 6926 → 7262 |
| 28 owned properties, houses/hotels | 128 → 148 | 8136 → 9140 |
| Hotel + 4 quân cùng ô, overview | 128 → 156 | 8136 → 9236 |
| Hotel + 4 quân cùng ô, follow | 93 → 106 | 7530 → 8390 |

Draw cost tăng có giới hạn do rings/flags/readability aid. Flags chỉ 4 batches; shared geometry/material và cache per-property giữ update nhẹ. Ring/marker planes dùng single pass, không trả thêm pass chỉ vì DoubleSide transparency. Giữ lighting, fake shadows, renderer DPR, antialias, power preference và render-on-demand.

Scene về **zero idle renders** sau movement/camera/pulse/fade. 12 chu kỳ remove/re-add ownership/development giữ `renderer.info.memory` ổn định sau warm-up; fixture developed/crowded đo 11 geometries và 2 GPU textures. Đây là giá trị của fixture, không phải cap cho mọi trạng thái (dice textures được upload khi thực sự thấy dice). 10 remounts giữ một canvas và không page/console errors. Disposed InstancedMesh buffers khi bỏ buildings; shared assets giữ tới scene destroy, font atlas cũ được dispose khi refresh.

Không thêm shadow maps, lights động, bloom, complex shaders hoặc particle systems. Chưa đo FPS/thermal/battery trên điện thoại thật; số liệu trên không xác nhận hiệu năng Safari/iPhone hay Android hardware.

## L. Remaining Issues / Practical Limits

Không thấy blocker gameplay hoặc visual lifecycle thuộc Task #4 trong bộ kiểm đã chạy. Ở góc isometric khi bốn quân cùng ô, một phần thân quân phía sau vẫn có thể bị quân trước che; không quân nào mất hoàn toàn, và ring/identity aid giúp đọc current player. Giá in trên ô đang có quân có thể bị che; context/detail vẫn hiển thị thông tin đầy đủ.

Viewport nhỏ trong overview ưu tiên vị trí/owner/group/development; không bảo đảm đọc mọi dòng tên/giá từ toàn bàn. Follow/context/detail phục vụ đọc chi tiết. Chưa kiểm máy Android/iPhone thật. Sau phản hồi của người dùng, nền đỡ và đường ghép mép nền đã được sửa riêng; xem [báo cáo căn chỉnh nền](board-platform-alignment-review.md). Ảnh after trong trang so sánh đã cập nhật theo bản sửa này.

Before/after cho thấy giảm nhập nhằng rõ: group không bị owner strip lấn; owner có cờ riêng; current player có identity ring/aid; selection giữ đúng property qua UI; destination nằm ở ô sẽ đến thay vì current tile; hotel không còn che hoàn toàn nhóm quân như baseline.
