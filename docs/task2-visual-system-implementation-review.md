# Task #2 — Visual System V3: kết quả triển khai

Ngày: 04/10/2026. Trạng thái: **DONE — A đến G đã hoàn thành**.

Giữ board game Việt Nam hiện đại, low-poly isometric, Cream / Teal / Gold. Gameplay và bố cục bàn cờ không đổi. Font, màu semantic, button variants, identity, hierarchy và readability đã được chuẩn hóa trong presentation.

## A. Visual Audit

Các vấn đề trước: UI Segoe UI/Arial khác atlas Arial; HUD 11–12px; chữ event/winner quá nhạt; lỗi có nhiều màu đỏ; chấm player phụ thuộc emoji OS; selected HUD/setup dùng vàng; nhiều surface gần giống nhau; màu viền/nền phân tán; owner strip mỏng; destination highlight tồn tại tới optional actions.

Đã xử lý toàn bộ các điểm trên. [Kế hoạch và audit chi tiết](task2-visual-system-review-plan.md) giữ làm tài liệu trước triển khai.

| Inventory CSS | Trước | Sau |
| --- | --- | --- |
| HEX occurrences, toàn stylesheet | 278 | 85 |
| HEX strings khác nhau, toàn stylesheet | 199 | 80 |
| HEX trong block gameplay V2/V3 active | 139 | 0 |
| HEX khác nhau trong block active | 75 | 0 |

Đây là số literals trong CSS, không phải số màu mắt nhìn hoặc số màu semantic. Màu vẫn tồn tại có chủ đích trong token constants, manifest, scene art và historical prototype rules. Không xóa theme/prototype lịch sử chỉ để giảm số đếm.

## B. Design Tokens

- `src/visual/tokens.ts`: UI semantic colors, player colors, font family/weights và named world palette. Không có game rule hoặc economy trong module này.
- `src/visual/tokens.css`: type scale, spacing, radius, elevation và surfaces/backdrops; aliases cho consumers cũ.
- Entry point cài CSS variables một lần từ TS constants; renderer/atlas dùng trực tiếp cùng constants. Không đọc computed style mỗi frame.
- Group màu lấy từ manifest và truyền vào CSS group variables. Ba hệ UI / group / player giữ ranh giới riêng.

| Color role | Tokens / values |
| --- | --- |
| Background | `game-bg #B4DED7` |
| Surfaces | `surface-primary #FFF9E9`, `surface-secondary #EDF2E4` |
| Borders | `border-default #A9C5B5`, `border-strong #8EAD9D` |
| Text | `text-primary #254B4C`, `text-secondary #48675E` |
| Primary action | `action #EDB944`, `action-light #FFDB7D`, `action-deep #EDB435`, `action-text #382800` |
| Selected | `selected #285D59`, `selected-text #FFF9E9` |
| Danger | `danger-text #973F31`, `danger-surface #FFE5D0`, `danger-border #DBAD8B` |

Không thêm muted/success/danger-strong constants trùng giá trị khi chưa có consumer cần phân biệt. Spacing 2/4/8/12/16/24/32; radius 10/12/16/20/pill; soft shadows theo context/decision/blocking. Geometry, safe area và kích thước touch không bị ép vào spacing scale.

## C. Typography

**Be Vietnam Pro**, self-host, weights **500 / 700 / 800**, Latin + Vietnamese. Sáu WOFF2 tổng **103,408 bytes** (~101 KiB); preload Latin 500/700, Vietnamese và display face tải theo nhu cầu. Không tải font từ CDN trong gameplay. Có OFL và nguồn/hash từng file trong `public/fonts/be-vietnam-pro/`.

UI và atlas cùng family, fallback Arial/sans-serif. Type scale: display 32/28, title 24, sheet 20, heading 18/16, body 14, label 13/12, micro 11. HUD tên **14px/700**, tiền **12px/500** và tabular numbers. Tên dài HUD có ellipsis và title đầy đủ; context/sheet giữ full property names và wrap.

Atlas dùng heading 700, logical font 18px; giá 500/14px trong logical cell 128. Được raster ở scale 1.5 thành cell 192, atlas 1344×1344. Đây là texture-space, không phải cỡ CSS trên màn hình.

Font load explicit cả Latin/Vietnamese cho atlas. Renderer vẽ fallback ngay, không chặn engine/turn. Khi font sẵn sàng, atlas refresh một lần, texture/geometry/material cũ được dispose. Có guard khi unmount/StrictMode/context loss; font lỗi vẫn chơi bằng fallback. Font wait deadline chỉ là diagnostic, không khóa UI hoặc bỏ mất late load.

## D. Color Changes

| Before → After | Lý do |
| --- | --- |
| Roll `#FFD96F → #F0B938`, text `#3B2A00` → chung CTA `#FFDB7D → #EDB435`, text `#382800` | Một primary-action variant |
| Active HUD vàng `#B47822 / #E8B746` → selected teal `#285D59` | Vàng dành cho action, teal dành cho turn/selected |
| Setup selected `#FFF0BD` → `#285D59` + cream text | Selected dùng cùng semantic role camera/navigation |
| Event/winner title `#FFE094` → `#254B4C` | Contrast trên kem từ 1.22:1 lên 9.13:1 |
| Winner description `#B6D5DC` → `#48675E` | Contrast trên kem từ 1.48:1 lên 5.92:1 |
| Setup error `#FF9F9F`, toast `#702F39` / white, danger `#A34535` → danger family chung | Error readable, nhất quán giữa surfaces |
| Các nền phụ `#EAF0DF / #FFFDF5 / #E6EEDC` → primary/secondary semantic surfaces | Giảm biến thể không có role |
| Các viền `#94B4A5 / #B5C8AD / #C4D2BA / #B5C4AA` → default/strong border | Phân cấp có chủ đích |
| Atlas text `#243F42 / #557167` → primary/secondary UI text | Direction typography/color nhất quán |
| Atlas border `#C4C6AC` → world tile border `#A9B69E` | Tách ô rõ hơn mà vẫn mềm |
| Pawn ring vàng `#F9BD3F` → teal `#285D59` | Turn cue không cạnh tranh gold primary action |

Giữ toàn bộ **8 group HEX/mapping** và **4 player HEX**. Group strip, owner strip và HUD indicator không bị trộn thành một màu duy nhất. Gold còn dùng ở CTA, destination/resolve focus tạm thời, trophy; không dùng cho toàn bộ winner typography hoặc selected UI.

## E. Component Changes

- HUD/setup: controlled `PlayerIndicator`, nhận màu đúng HEX; không còn emoji làm player color indicator. Core controls dùng `GameIcon` SVG với `currentColor`, labels giữ nguyên.
- Buttons: primary / secondary / selected / danger / ghost navigation. Disabled readable và giữ native disable/engine guard.
- Surfaces: Level 0 world; 1 HUD/navigation nhẹ; 2 context/camera có elevation; 3 decision thu hút focus; 4 debt/bankruptcy/winner có backdrop mạnh. Native dialog/cancel/focus restoration giữ nguyên.
- Context: font lớn hơn, full name, owner indicator độc lập, target close 48px. Không sidebar hay title gameplay thường trực.
- Event: deck → player label → title → illustration → description → effect → CTA. Effect formats dữ liệu card hiện có; không dự đoán RNG, tính phí trả nợ hoặc duplicate economy. Hai deck phân biệt bằng glyph/border treatment trong cùng palette. Emoji chỉ ở event illustration.
- Winner: title/name dark teal, trophy vàng, money có nhãn **Tiền mặt**. Không gọi tiền mặt là tổng tài sản. Responsive dài/thấp đã kiểm tra.
- Errors: setup/sheet/toast/destructive controls cùng danger family.

Files mới: `visual/tokens.ts`, `tokens.css`, `fonts.css`, `fonts.ts`, `PlayerIndicator.tsx`, `GameIcon.tsx`, `eventPresentation.ts`. Files cập nhật: entry/styles, App, NewGame, Board camera icons, SecondaryActions, PropertyContextCard, GameOverlay, format; GraphicsPreview/PixiPreview chỉ chuyển shared player indicator. Dice CSS dùng màu chung với xúc xắc 3D.

## F. Board Changes

- Tăng atlas 896×896 → 1344×1344; full names, font loaded correctly, dark text, band cao 21 → 25 logical px. Một mesh/texture, không DOM labels theo frame.
- Centralize Three.js art palette, giữ model/cảnh/lights direction. Không dựng lại scene, không đổi vị trí/kích thước bàn, camera policy hoặc geometry.
- Owner strip cao .012 → .032 world units, rộng .075 → .12, có dark outline; vẫn tách group color và player color.
- Active pawn ring teal nhẹ, không pulse/glow vô hạn. Gold destination outline chỉ trong resolve/decision/rent/event, không tồn tại ở optional actions.
- Không thêm LOD. Detail đọc qua context/sheet; full overview vẫn có giới hạn đọc chữ nhỏ do cả 40 ô phải fit màn hình.

UV bug khi tăng độ nét atlas đã được phát hiện qua review ảnh và sửa trước final validation. Polish check kiểm UV finite trong [0,1], 160 vertices / 240 indices, pixel group và nét chữ tên ô; tránh regression bàn cờ trống dù metadata tiles vẫn đúng.

## G. Responsive Testing

Gameplay checks: **568×320, 667×375, 844×390, 852×393, 896×414, 915×412, 932×430, 1024×768, 1440×900**.

Card/surface stress: 32 cards × 7 landscape sizes = **224 event cases**; cả 5 viewport bắt buộc và hai viewport nhỏ. Debt, bankruptcy, winner, setup/settings/asset sheets/errors không horizontal text overflow. Có 2/3/4-player setup, 4 tên dài và money 1.234.567 Tr tại 568×320.

Đã kiểm font-ready/fallback/late load/unmount, 3 lần remount, actual raycast, keyboard/focus, manual camera khi moving, reduced motion, safe-area padding, portrait khi mở dialog, WebGL loss → DOM fallback. Sheet nhiều nội dung có scroll riêng; không ép font nhỏ để nhét toàn bộ nội dung.

## H. Validation

| Check | Kết quả |
| --- | --- |
| TypeScript strict | Pass |
| Vitest | 86 tests / 8 files pass |
| Design/data | 9 checks pass |
| Production build | Pass; không chunk-size warnings |
| Lint | Chưa có config/script/dependency lint; không báo pass giả |
| Gameplay/browser regression | 9 viewport, 24 nhóm checks, không console/page errors |
| Visual polish suite | 224 event cases, 7 surface matrices, slow/failed/unmount fonts, remounts, atlas và contrast pass |
| Production UI-only smoke | 24 observed turn transitions, purchases/events/rent, log và portrait recovery pass; không import store/snapshot |
| Shared camera study / Pixi study | Pass |
| Source preservation | 22 protected files unchanged; không thêm file vào vùng protected |

Production smoke xử lý jail decision trước khi mở log: navigation bị khóa ở mandatory phase là behavior đúng, không sửa game để cho phép test vượt guard. Seed browser cũng dùng bởi renderer; không coi nó là engine RNG deterministic. Report ghi số lượt/roll/buy/event/rent thực tế của lần chạy cuối.

Performance tại gameplay overview cùng fixture: **109 draw calls / 6,926 triangles trước và sau**, idle **0 renders** khi settle. Atlas RGBA base estimate tăng ~3.06 MiB → ~6.89 MiB, chưa tính mipmaps/driver overhead. Giới hạn cell 192, không tăng texture vô hạn.

Bundle cuối: main **389.48 kB / gzip 122.97 kB**, CSS **44.17 kB / gzip 8.80 kB**; một shared properties chunk **21.03 kB / gzip 8.20 kB** được bundler tách ra. Không coi main giảm là tổng payload giảm: có thêm chunk, CSS và 103,408 bytes font; chưa benchmark pin/nhiệt/FPS thiết bị thật.

Contrast opaque: primary 9.13, secondary 5.92, selected 7.13, danger 5.66, CTA endpoints 10.66/7.60. HUD/navigation alpha tăng từ thử nghiệm 72% lên **86%**: text phụ trên composite teal tối đạt **4.78:1**. Context dùng 97% cho controls; property card opaque cream. Không dùng player/group fills làm body text trên cream.

Evidence: [gameplay](task2-uiux-checks.json), [polish](task2-polish-checks.json), [production](task2-production-checks.json), [protected SHA256](task2-engine-preservation.json), [baseline](task2-before-uiux-checks.json).

## I. Before / After

[Mở trang so sánh](task2-visual-comparison.html). Gameplay/overview so cùng 844×390, 4 người, cùng trạng thái chưa roll; ảnh sau chờ font/animation settle. Các ảnh ở trạng thái action/decision là evidence bổ sung, không dùng pixel diff vì camera/action timing có thể khác.

| Trạng thái | Trước | Sau |
| --- | --- | --- |
| Gameplay/HUD | [Baseline](task2-before-gameplay-mobile.png) | [V3](task2-gameplay-mobile.png) |
| Màn nhỏ | [Baseline](task2-before-gameplay-small-mobile.png) | [V3](task2-gameplay-small-mobile.png) |
| Property context | [Baseline](task2-before-context-mobile.png) | [V3](task2-context-mobile.png) |
| Property sheet | [Baseline](task2-before-property-mobile.png) | [V3](task2-property-top-mobile.png) |
| Winner | [Baseline](task2-before-winner-mobile.png) | [V3 settled](task2-winner-mobile.png) |

Ảnh bổ sung: [Cơ Hội](task2-event-chance-mobile.png), [Cuộc Sống](task2-event-life-mobile.png), [ownership](task2-ownership-mobile.png), [HUD dài/màn nhỏ](task2-hud-long-small.png), [setup error](task2-setup-error-mobile.png), [sheet error](task2-sheet-error-mobile.png), [winner dài](task2-winner-long-mobile.png), [production](task2-production-mobile.png).

## J. Remaining Issues

- Chưa có Android/iPhone/Safari thật trong môi trường test; kết quả viewport/touch emulation không phải benchmark điện thoại thật.
- Full-board overview vẫn ưu tiên nhận diện group/owner và bố cục; chữ chi tiết xem bằng zoom/context. Không claim mọi tên đều đọc rõ ở góc xa trên màn 568px.
- Historical prototype styles còn literals/typography riêng; không thuộc active V3 block. Chỉ cập nhật shared consumers cần thiết, không refactor unrelated art study.
- Chưa có lint framework. Không thêm chỉ để gắn nhãn lint pass.
- Font assets self-host cần được deploy cùng public files. Nếu asset lỗi, fallback đã kiểm tra; atlas có giới hạn memory nhưng vẫn cần đo thiết bị thật trước khi tăng độ nét tiếp.

**Task #2 hoàn tất. Không triển khai thêm gameplay feature.**
