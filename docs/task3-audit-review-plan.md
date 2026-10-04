# Task #3 — Review và kế hoạch audit 3D

Ngày: 04/10/2026. Baseline: commit `2019a79`.

Trạng thái: **Đã review yêu cầu và source chính; chưa thực hiện audit đầy đủ hoặc chụp bộ ảnh Task #3.**

## 1. Kết luận review

Task khả thi, không có blocker nghiêm trọng. Đây là audit hiện trạng, đầu ra phục vụ quyết định 3D Palette V2 ở task sau. Không thay màu, material, lighting, renderer, geometry, camera, engine hoặc gameplay. Không tự đề xuất palette mới và không sửa các vấn đề được phát hiện.

Yêu cầu hiện tại của người dùng là review và lập kế hoạch. File này ghi kế hoạch thực hiện; chưa thay thế output chính `3d-visual-reference.md`.

## 2. Những điểm đã xác nhận từ source

| Nội dung | Hiện trạng | Ý nghĩa với audit |
| --- | --- | --- |
| Renderer gameplay | `App → Board → ThreeBoard → TabletopScene` | Gameplay `/` là nguồn chính của ảnh và đánh giá |
| Prototype | `?graphics=1` dùng ThreeBoard/TabletopScene với framing khác; `?graphics=2` dùng Pixi | Không gộp màu hoặc readability của Pixi vào gameplay 3D |
| Material | Factory Lambert `flatShading`; atlas/ring/shadow dùng Basic; destination dùng LineBasic | Không dùng bảng mẫu Standard/PBR của task như giá trị thực tế |
| Lighting | Hemisphere intensity 2.3; Directional intensity 2.0, position (-8,16,9) | Cần phân biệt base HEX với màu cuối dưới ánh sáng |
| Shadows | Art tạo gradient CanvasTexture trên plane; không thấy cấu hình shadow map/cast/receive trong source 3D | Phải mô tả bóng giả và kiểm tra default của renderer, không gọi là directional shadow |
| Renderer settings | antialias true, alpha false, low-power; DPR cap 1.5; output sRGB | Tone mapping/exposure không set tại constructor: tra dependency đã cài, ghi rõ default |
| Atlas | 1344×1344; cell 192; logical cell 128; Be Vietnam Pro; CanvasTexture sRGB | Kiểm tra filtering/default và font-ready/fallback riêng |
| Player palette | #EE6B73, #59BAFA, #73D7A0, #FFD46A | Theo consumer để kiểm tra token/HUD/owner/building, không chỉ liệt kê constants |
| Ownership | Strip có màu player và outline teal, giữ group band trong atlas | Hai visual channel khác nhau; phải kiểm tra thấy được ở khoảng cách nào |
| Upgrade | Lv.0–Lv.5; 1–4 nhà, Lv.5 khách sạn | Ví dụ Lv.0–Lv.3 trong task không khớp game hiện tại; audit đủ 0–5, không đổi rules |
| Landmark 3D | Factory cho railroad, utility điện/nước và jail | Tên landmark trong property data/context không chứng minh có model riêng |
| Water | Fountain water/drop và water-tank model đã có | Không ghi Water hoàn toàn chưa implement; river/sea kiểm riêng |
| Camera | Orthographic, offset (12,14,12), modes overview/follow | Chưa có property-close mode riêng; screenshot C phải ghi đúng khả năng hiện tại |
| Focus | Pawn ring teal #285D59; destination outline #D49422 | Selected UI/context và destination không tự động là cùng một hiệu ứng 3D |

Các thông tin trên là review source bước đầu. Việc đánh giá màu hiển thị, visibility, thời điểm highlight và mức độ collision cần ảnh mới và trace các phase trước khi kết luận.

## 3. Các điểm cần diễn giải đúng trong task

1. **Defaults:** giá trị không set phải ghi “Uses Three.js default value”, kèm giá trị/version nếu đã kiểm chứng từ dependency local. Không suy đoán. Roughness/metalness không áp dụng cho Lambert/Basic; không tự điền 0/.8. Không thêm cấu hình để thuận tiện audit.
2. **Close view:** dùng trạng thái gần nhất mà UI hiện có cho phép — follow tại property, chọn ô, context và property detail. Nếu không đạt close/selected 3D như yêu cầu, ghi thiếu capability; không dựng thêm zoom/camera/outline.
3. **Landmark:** phân biệt metadata địa danh, model special tile và pavilion môi trường. Chỉ report model thực sự được tạo và consumer thực sự gọi.
4. **Current vs selected vs destination:** trace riêng current pawn/tile, inspect selection, resolve highlight; ghi rõ trường hợp chưa implement. Không mặc định current tile luôn có outline.
5. **Readability:** nhận xét từ ảnh tại viewport xác định; không dùng contrast UI opaque để chứng minh màu mesh lit hoặc khả năng đọc trên điện thoại thật.
6. **Category absent:** chỉ dùng “Not currently implemented” sau khi tìm cả factory, consumer và scene graph/source liên quan. Road/path và water/fountain không gộp tùy ý.

## 4. Kế hoạch thực hiện

### A — Khóa baseline và lập source map

- Ghi commit, Three.js version, viewport/browser/DPR và trạng thái Git ban đầu.
- Hash các file production trong `src/`, manifest `docs/classic-vietnam-v2.json`, `index.html`, package/config; đối chiếu lại khi hoàn thành để chứng minh source không bị sửa.
- Trace routes và import graph. Đọc toàn bộ rendering 3D, shared art/token/font/data và UI overlays liên quan.
- Inventory constructor/material/texture/light/renderer/geometry, không chỉ search HEX.

Đầu ra: danh sách nguồn và phạm vi active/prototype/fallback rõ ràng.

### B — Audit renderer, lighting, shadows và color management

- Đọc cấu hình renderer/camera và các mutation về sau, không chỉ constructor.
- Tra default từ Three.js **đã cài trong node_modules** nếu app không set; kiểm phiên bản và ghi nguồn.
- Xác định outputColorSpace, CanvasTexture colorSpace, working color space/color-management enablement, tone mapping/exposure và texture filtering.
- Kiểm light types, color/intensity/position; shadow map/default, object cast/receive, gradient contact-shadow planes.
- Với settings không tồn tại ở API đang cài, ghi not applicable thay vì áp dụng tên từ phiên bản cũ.

Đầu ra: sections 1–4, material facts cho section 14.

### C — Inventory palette và các model

- Tạo bảng **Global 3D Palette** trong phần palette, đúng cột Element / Color / Source / Notes.
- Environment: background/island/grass/path/stone/trees/fountain/water/bench/pavilion/card stacks/stairs; categories không có ghi rõ.
- Board: base/body/side/printed paper/corner/special/border/band; xác định phần dùng chung environment geometry.
- Lấy đúng 8 nhóm từ manifest: Miền Tây, Phương Nam, Cao Nguyên, Duyên Hải, Di Sản, Miền Trung Bắc, Miền Bắc, Đô Thị. Trace nơi dùng từng màu.
- Theo player palette đến pawn parts, HUD, owner indicator, house roofs; liệt kê các màu trang phục/skin/hats phụ và màu hotel cố định.
- Inventory building/landmark parts, shared factories, levels 0–5, scale/placement; tách palette có consumer với token không được dùng.
- Ownership: type, geometry dimensions, position/orientation, material, visibility và color source.

Đầu ra: sections 5–12 và 14–15, mỗi màu có source và usage kiểm chứng được.

### D — Audit focus và lifecycle

- Trace phase predicate của destination, active ring visibility/position, pawn movement và camera transitions.
- Kiểm selected property có state/mesh highlight riêng hay chỉ context UI.
- Ghi ring/line/glow/emissive/opacity/animation/duration thực tế; duration dựa phase ghi phase-driven, không tự gán số giây.
- Atlas: font loading/refresh, wrapping/orientation, texture size, filtering, DPR handling và disposal; ghi khác biệt Basic unlit với Lambert lit.

Đầu ra: sections 13 và 15, phân biệt rõ các visual channel.

### E — Chụp evidence mobile và quan sát readability

Ưu tiên **852×393**, có thể thêm **932×430**. Chờ font/texture/camera settle cho ảnh tĩnh; ảnh movement/highlight ghi rõ phase và thời điểm. Dùng gameplay `/`, không đổi visuals để làm đẹp ảnh.

| Ảnh dự kiến | Trạng thái | Tên file |
| --- | --- | --- |
| A | Mobile overview, 4 players | `docs/task3-overview-mobile.png` |
| B | Follow player / medium | `docs/task3-follow-mobile.png` |
| C | Property inspection ở khoảng cách hiện có, có context/detail nếu cần | `docs/task3-property-inspection-mobile.png` |
| D | Owned property, có group band và owner strip | `docs/task3-owned-property-mobile.png` |
| E | Destination đang resolve; selection chụp riêng nếu cần | `docs/task3-destination-mobile.png` |
| F | Model special landmark thực tế, ví dụ ga/điện/nước/nhà tù | `docs/task3-landmark-mobile.png` |

- Ưu tiên thao tác UI thật. Với trạng thái hiếm cần fixture, dùng temporary browser/tooling và GameState hợp lệ qua API hiện có; ghi rõ fixture, không sửa engine/rules hoặc cài debug API production.
- Ghi metadata viewport/DPR/route/camera/phase/players/property-owner-level cho từng ảnh trong reference.
- Giữ ảnh nguyên trạng, không chỉnh màu, crop che vấn đề hoặc tạo camera riêng.
- Đánh giá FAR / MEDIUM / CLOSE theo yêu cầu; CLOSE không tồn tại riêng phải ghi giới hạn, không gọi property dialog là camera close.
- Chấm 5 layers bằng Good / Acceptable / Needs Review / Problematic; phân biệt facts với observations.
- Đánh giá 4 nhóm collision chính: green/grass; yellow/player/group/destination; blue/player/group/teal roofs; red/player/group/danger UI. Tính đến shape, position, material và lighting, không kết luận chỉ từ HEX.

Đầu ra: ảnh A–E, F khi có thể; sections 16–18 và evidence cho issues.

### F — Viết reference và đối soát

Tạo **`3d-visual-reference.md` tại root project**, giữ đúng 20 section trong task:

1. Renderer
2. Lighting
3. Shadows
4. Color Management
5. Environment Palette
6. Board Palette
7. Property Group Palette
8. Player Palette
9. Ownership Visualization
10. Building Palette
11. Landmark Palette
12. Upgrade Visualization
13. Active / Selected / Destination
14. Material Inventory
15. Canvas Atlas
16. Camera Readability
17. Color Collision Analysis
18. Gameplay Visual Hierarchy
19. Current Issues
20. Source Map

- Palette rows/source references dùng file + function và line hiện tại khi hữu ích. Source Map cuối tài liệu dùng Feature → File → Function/component.
- Issues dùng Severity **Low / Medium / High**, evidence và Needs Review; không đưa solution/new palette.
- Không ghi runtime measured khi chỉ là source/config fact; không gọi desktop touch emulation là điện thoại thật.
- Đối chiếu hash/diff production với baseline, xác nhận tất cả image links hợp lệ và ảnh đã xem trực tiếp.

Đầu ra: reference đủ 20 section, screenshot links, inventory có nguồn, issues có evidence; production source unchanged.

## 5. File dự kiến tạo và file chỉ đọc

**Tạo khi thực hiện audit:** root `3d-visual-reference.md`, screenshots `docs/task3-*.png`. Temporary tooling chỉ phục vụ audit, nằm ngoài production và được dọn sau khi dùng; không đưa vào architecture/commit gameplay.

**Chỉ đọc:** `src/rendering/tabletopScene.ts`, `tabletopArt.ts`, `squareBoard.ts`, `cameraFraming.ts`, `src/visual/*`, `src/components/ThreeBoard.tsx`, `Board.tsx`, `PropertyContextCard.tsx`, `PlayerIndicator.tsx`, `GameOverlay.tsx`, `gameplayUI.ts`, `src/App.tsx`, `src/main.tsx`, `src/styles.css`, manifest/group/property data và scripts/reports kiểm thử liên quan. Pixi files chỉ dùng để xác định phạm vi khác.

Không chỉnh package/config/README để phục vụ audit. Không commit hoặc push ở bước audit nếu người dùng chưa yêu cầu.

## 6. Validation và điều kiện hoàn thành

- Game chạy được tại URL hiện có; có WebGL canvas, font settle, không lỗi page/console trong phiên chụp.
- Capture đủ A–E ở mobile landscape; C phản ánh đúng inspection hiện có, F nếu có thể.
- 8 group colors và 4 player colors có trace consumer; ownership/group/focus được phân biệt.
- Settings app-set/default/not applicable và category absent được ghi rõ; material không có PBR properties không bị gán giá trị giả.
- Reference đủ 20 section, Global Palette, material inventory, issues và Source Map.
- Source hash/diff production không đổi; không sản xuất palette V2 hoặc sửa các issues.
- Typecheck/build/tests chỉ chạy lại nếu có dấu hiệu runtime/source/baseline không nhất quán. Baseline vừa được kiểm trước commit: typecheck, 86 tests và build pass; không ghi các kết quả đó là test mới của Task #3.

Hoàn thành audit thì báo cáo file/ảnh, tóm tắt hiện trạng và major collisions, sau đó dừng. Quyết định 3D Palette V2 thuộc task tiếp theo.
