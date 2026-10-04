# Task #2 — Visual System V3: Review và kế hoạch

Ngày review: 04/10/2026. Trạng thái: **DONE — A đến G đã triển khai và kiểm tra**. Nội dung bên dưới giữ kế hoạch trước triển khai; kết quả thực tế nằm ở [báo cáo Task #2](task2-visual-system-implementation-review.md).

Nguồn yêu cầu: [Tasks/Task#2-Visual System Refactor.txt](../Tasks/Task%232-Visual%20System%20Refactor.txt). Tài liệu hiện trạng thực tế nằm ở [docs/visual-style-reference.md](visual-style-reference.md), không phải root repository.

## 1. Kết luận review

Task phù hợp kiến trúc và visual direction hiện tại. Có thể thực hiện theo A → G, ưu tiên typography ngay sau foundation. Giữ Cream / Teal / Gold, board low-poly isometric và giao diện contextual sau Task #1. Không có blocker nghiêm trọng từ audit source hoặc baseline check.

Refactor tập trung presentation; không thay engine, economy, dữ liệu luật, board order/geometry hay turn timing. Không dựng framework design system, Storybook, scene mới hoặc cơ chế LOD phức tạp.

## 2. Audit implementation

| Mức ưu tiên | Phát hiện | Hướng xử lý |
| --- | --- | --- |
| Cao | UI dùng Segoe UI/Arial; atlas dùng Arial riêng; không có webfont | Self-host Be Vietnam Pro, cùng font family cho UI/atlas |
| Cao | Atlas được tạo một lần trong constructor `TabletopScene` | Font loading phải cập nhật atlas nếu font tới muộn; không để chữ fallback bị đóng băng |
| Cao | HUD tên 11–12px, tiền 11px; context metadata 11px, Roll xuống 11px trên màn hẹp | Tên 14px/700, tiền 12–13px/500, nâng chữ thao tác và thông tin cần đọc thường xuyên |
| Cao | `.event-copy h3`, `.winner-copy h3` còn vàng nhạt; winner paragraph còn xanh nhạt | Primary text cho title/name, secondary text cho description |
| Cao | HUD/setup dùng emoji chấm màu, Three.js/fallback dùng HEX kiểm soát | Player indicator CSS/SVG dùng cùng dữ liệu `PLAYER_COLORS` |
| Cao | Player chip active và lựa chọn số người còn accent vàng | Selected/active dùng dark teal; player identity dùng chấm màu riêng |
| Cao | Setup error, sheet error, toast error, `.danger` có nhiều màu đỏ khác nhau | Một danger family, cùng variants và trạng thái |
| Trung bình | Nền/viền/nút khác nhau bởi nhiều màu rất gần; nhiều override xếp cuối stylesheet | Gom semantic tokens; sửa rule tại nguồn và hợp nhất các override đang dùng |
| Trung bình | Core UI dùng emoji và Unicode: settings, camera, assets/cards/log, close | Bộ SVG nhỏ dùng `currentColor`; giữ emoji trong nội dung vui của event |
| Trung bình | Persistent HUD, camera, context và decision surfaces đều kem/bo góc/viền mỏng | Phân 5 level bằng opacity, border, shadow và backdrop |
| Trung bình | Group strip và owner strip đều tồn tại nhưng owner strip chỉ cao khoảng .012 đơn vị; mức nhìn rõ xa cần kiểm tra | Giữ hai tín hiệu ở hai vị trí khác nhau; tăng nhận biết owner có kiểm soát |
| Trung bình | Vòng active pawn luôn theo active player; destination outline còn hiện cả `OPTIONAL_ACTIONS` | Identity/turn cue nhẹ; vàng focus chỉ trong resolve/destination hoặc hết hạn ngắn |
| Trung bình | Event chưa có vùng minh họa/effect độc lập; winner đang hiển thị tiền mặt | Event hierarchy từ dữ liệu thật; winner ghi đúng “Tiền mặt”, không gọi nhầm tổng tài sản |
| Thấp | Spacing, radius, font size có nhiều giá trị rời rạc | Scale nhỏ, ngoại lệ cho geometry/touch target/safe area có lý do |

Đếm toàn bộ `src/styles.css`: **278 lần dùng HEX, 199 chuỗi HEX khác nhau, 27 cỡ chữ px, 13 radius px**. Số này bao gồm rule bị override, màu có alpha và prototype lịch sử; không phải số màu đang đồng thời hiển thị trong gameplay. Khi triển khai sẽ đo riêng nhóm selectors active trước/sau.

Contrast tính trên cặp màu opaque tham chiếu:

| Cặp màu | Ratio |
| --- | --- |
| Event/winner title `#FFE094` / cream `#FFF9E9` | 1.22:1 |
| Winner paragraph `#B6D5DC` / cream | 1.48:1 |
| Setup error `#FF9F9F` / cream | 1.87:1 |
| Primary text `#254B4C` / cream | 9.13:1 |
| Secondary text `#48675E` / cream | 5.92:1 |
| Selected text cream / teal `#285D59` | 7.13:1 |
| Danger text `#973F31` / danger surface `#FFE5D0` | 5.66:1 |

Winner có gradient và các panel khác có alpha; các ratio tham chiếu không thay cho kiểm tra nền render/composited thực tế. Đã xem screenshot gameplay, property sheet và winner sau Task #1: winner text thiếu contrast rõ; toàn bộ bàn cờ vẫn là visual focus cần giữ.

### Khác biệt và quy tắc cần diễn giải

- Task mục 5 nói vàng chỉ cho primary action, nhưng mục 21/27 cho phép vàng ở focus bàn cờ và celebration. Áp dụng: **UI controls dùng gold cho primary CTA; board destination/resolve và trophy/celebration là ngoại lệ giới hạn**. Focus keyboard của navigation dùng teal.
- Task gợi ý “Tổng tài sản” ở winner, nhưng implementation chỉ hiển thị `winner.money`. Giữ nội dung tiền mặt có nhãn rõ. Chỉ dùng total wealth nếu đã có phép tính đúng từ selector hiện có; không tự dựng công thức economy trong JSX.
- Canvas dùng orthographic camera: các tile trên cùng mặt phẳng không nhỏ đi theo khoảng cách như perspective camera. Zoom, viewport, góc nhìn và nghiêng mặt ô vẫn ảnh hưởng độ đọc. Chọn font/độ nét/wrapping/context trước LOD.
- Mái nhà hiện được tạo bằng màu **owner/player**, không phải màu group. Group strip vẫn theo group; owner strip và áo token theo player. Đã sửa mô tả nhầm này trong tài liệu hiện trạng.
- Data nhóm đất nằm trong manifest đang được game import. Mặc định giữ 8 HEX và mapping. Nếu audit ảnh chứng minh cần soften, dùng mapping presentation theo group ID và ghi before/after; không sửa rule/economy hoặc tạo hai palette bất nhất.
- Tên hàm `Sheet` hiện gộp inspection, decision, blocking state. Có thể thêm thuộc tính visual level/variant nhưng giữ `showModal`, focus restoration, cancel policy và handlers.
- `fullScreen` winner hiện chỉ chọn class. Sẽ kiểm tra cả bố cục winner trên landscape thấp; không đưa lại title lớn thường trực vào gameplay.

## 3. Quyết định foundation

### Source of truth

Tạo module presentation `src/visual/tokens.ts`: pure constants cho semantic UI colors, family/weights, player identity và scene/atlas palette. UI colors/font dùng cùng object trong CSS custom properties (khởi tạo một lần ở entry point) và renderer; không đọc computed style mỗi frame. Spacing/radius/elevation UI được khai báo gọn trong `src/visual/tokens.css`.

Ba hệ màu giữ ranh giới rõ: `ui`, `propertyGroups`, `players`. Scene art có named constants riêng; không ép màu cỏ/đá/gỗ vào token surface của UI. Group lấy từ dữ liệu hiện có; player colors một nguồn dùng xuyên HUD, setup, owner marker, pawn và fallback. Không tạo theme engine hoặc package mới.

### Token mục tiêu ban đầu

| Token | Giá trị đề xuất |
| --- | --- |
| `--color-game-bg` | `#B4DED7` |
| `--color-surface-primary` | `#FFF9E9` |
| `--color-surface-secondary` | `#EDF2E4` |
| `--color-border-default` | `#A9C5B5` |
| `--color-border-strong` | `#8EAD9D` |
| `--color-text-primary` | `#254B4C` |
| `--color-text-secondary` | `#48675E` |
| `--color-text-muted` | Dùng secondary trước; chỉ thêm màu riêng nếu có vai trò và contrast đạt |
| `--color-action` | `#EDB944` |
| `--color-action-light` / `--color-action-deep` | `#FFDB7D` / `#EDB435` |
| `--color-action-text` | `#382800` |
| `--color-selected` / `--color-selected-text` | `#285D59` / `#FFF9E9` |
| `--color-danger-text` / `--color-danger-surface` | `#973F31` / `#FFE5D0` |
| `--color-danger-border` / `--color-danger-strong` | `#DBAD8B` / `#973F31` |
| `--color-success` | `#285D59`, có nhãn/icon trạng thái; không tạo thêm xanh gần giống |

Đây là token đề xuất, chưa phải implementation. Chỉ bổ sung token khi có consumer thực tế. Biến cũ `--panel`, `--line`, `--gold` có thể alias tạm để không phá historical previews, rồi cập nhật các consumer nằm trong scope.

### Typography và font assets

- Be Vietnam Pro tự host cùng origin, weights **500 / 700 / 800**, ưu tiên WOFF2 Latin + Vietnamese. Nguồn chuẩn đã có Medium/Bold/ExtraBold; giữ copyright/OFL cùng font. Không gọi Google Fonts CDN trong gameplay và không thêm dependency font runtime.
- Nếu nguồn asset chỉ cung cấp TTF, chuẩn bị WOFF2 trong bước asset/build và kiểm tra glyph; ghi kích thước thực tế. Không tuyên bố ngân sách font trước khi đo.
- `@font-face` có fallback hiển thị, preload hợp lý. Chỉ tải weights cần thiết, không tải italic hoặc cả family.
- UI hiển thị ngay bằng fallback nếu font lỗi; explicit load weights dùng trong atlas, với giới hạn chờ. Khi font thành công muộn, refresh texture **một lần**, remeasure/wrap text và request render. Không remount toàn bộ scene, không chờ network font để advance gameplay.
- Refresh/dispose an toàn với StrictMode, scene đã unmount, font lỗi/404 và context loss. Atlas giữ một mesh/texture; texture cũ dispose sau thay thế.
- Scale: display 32/28, title 24/20, heading 18/16, body 14, label 13/12, micro 11. Dùng weight 500 body, 700 headings/buttons/names, 800 display.
- HUD tên 14/700, tiền 12–13/500 và tabular numerals. Không tăng chiều cao HUD một cách tự động; kiểm tra 4 người và tên dài. Micro dành cho vòng chơi/metadata phụ.
- Tên địa danh giữ đầy đủ trong context/sheet; wrap khi cần. Atlas được đo riêng theo texture space, không gán CSS font-size thành pixel màn hình.

### Layout và surfaces

- Spacing UI: 4 / 8 / 12 / 16 / 24 / 32; thêm 2 cho chi tiết rất nhỏ nếu có consumer. Các offset để chừa camera/canvas và safe area là geometry, không ép vào scale.
- Radius: control 10, button 12, HUD/card 16, sheet/dialog 20, pill 999. Consolidate theo role.
- Elevation: Level 0 world; Level 1 HUD/nav nhẹ; Level 2 context/camera có soft elevation; Level 3 decision nổi bật và CTA rõ; Level 4 blocking có backdrop mạnh hơn.
- Variant button: primary, secondary, selected, danger, ghost. Tái sử dụng class/props đơn giản, giữ action handlers và semantics. Disabled vẫn đọc được; không giảm opacity cả surface tới mức khó đọc.
- Core icons: SVG nội bộ nhỏ, `currentColor`, accessible label; không thêm icon library lớn. Player indicator có chấm màu và tên, active có cue hình dạng/nhãn để không chỉ dựa vào màu.

## 4. Implementation theo thứ tự Task

| Phase | Công việc cụ thể | Điều kiện qua bước |
| --- | --- | --- |
| A — Audit | Chụp baseline cùng fixtures; inventory selectors active; lưu SHA256 engine/store/manifest; ghi contrast/font/spacing/radius | Baseline và ranh giới bảo vệ được lưu trước code edit |
| B — Tokens | Tạo pure tokens, CSS scales và bridge UI/renderer; map màu gần giống; thay declarations tại nguồn | Không thêm tầng framework; màu đúng role, foundation build/typecheck đạt |
| C — Typography | Font assets/OFL, loading/fallback/atlas refresh; type scale; HUD, property, buttons, sheets | Dấu Việt đúng, font readiness được verify; tên dài/tiền/nút không clip |
| D — Colors | Variant nút, selected teal, danger family; player indicators đồng nhất; audit group strips | Gold không còn dùng cho selected HUD; HEX player khớp mọi consumer |
| E — Surfaces | Level 1–4 cho HUD/context/inspection/decision/blocking; CTA sticky khi cần | Board vẫn là focus; dialog keyboard/focus/cancel policy giữ đúng |
| F — Board | Atlas font/wrapping/contrast; group strip, owner marker, active/destination lifecycle | Full 40 tiles, overview/follow/raycast/fallback đạt; không tăng draw loop idle |
| G — Polish | Event/winner/errors/icons/spacing/radius/shadow; responsive và before/after | Toàn bộ validation và DoD đạt; báo cáo A–J rồi dừng |

### Event và winner

Event phân deck label → title → illustration → description → effect → CTA. Hai deck dùng accent có vai trò nhất quán trong global system. Phần effect lấy từ card definition/state hiện có: số tiền cố định hiện đúng số tiền; hiệu ứng phụ thuộc người chơi/điểm đến ghi mô tả đúng, không dự đoán kết quả RNG hoặc duplicate rule. Dùng helper presentation nếu cần. Không thay nội dung luật/card hoặc phase APPLY_EVENT.

Winner dùng tên primary text, display/800, tiền mặt có nhãn, trophy/celebration nhẹ và CTA. Không cần title thường trực trong gameplay. Kiểm tra chiều cao nhỏ; giữ reduced motion và không animation vô hạn.

### Board typography: chọn phương án đơn giản trước

Giữ tên đầy đủ + group strip; giá có thể giảm prominence khi xa; chi tiết group/owner/level/landmark ở Context Card. Nâng độ nét atlas hoặc diện tích strip vừa đủ sau kiểm tra screenshot, không tăng texture size vô hạn. Không implement FAR/MEDIUM/CLOSE LOD trong phương án mặc định. Chỉ cân nhắc LOD nếu kết quả font/wrapping/context vẫn không đáp ứng và không tăng complexity đáng kể.

## 5. Files dự kiến

| Nhóm | Files |
| --- | --- |
| Foundation mới | `src/visual/tokens.ts`, `src/visual/tokens.css`, `src/visual/fonts.css`, `src/visual/fonts.ts` |
| Font assets | `public/fonts/be-vietnam-pro/*`, gồm fonts + `OFL.txt` + thông tin nguồn/version |
| Shared UI mới | `src/components/PlayerIndicator.tsx`, `src/components/GameIcon.tsx` |
| Entry/styles | `src/main.tsx`, `src/styles.css`, `index.html` nếu cần preload |
| HUD/setup | `src/App.tsx`, `src/components/NewGame.tsx`, `src/components/format.ts` |
| Gameplay surfaces | `TurnControls.tsx`, `SecondaryActions.tsx`, `PropertyContextCard.tsx`, `GameOverlay.tsx`, `Dice.tsx`, `ActivityToast.tsx` trong `src/components/` |
| Renderer | `src/rendering/tabletopArt.ts`, `src/rendering/tabletopScene.ts`, `src/components/ThreeBoard.tsx` |
| Fallback/parity | `ClassicBoard.tsx`; historical `GraphicsPreview.tsx`, `PixiPreview.tsx` chỉ sửa shared indicator/font consumer bị ảnh hưởng |
| Validation/docs | Browser scripts hiện có hoặc `scripts/task2-visual-check.mjs`; visual baseline/after/contrast/font/protection reports; `docs/visual-style-reference.md`; báo cáo Task #2 |

`Board.tsx` chỉ sửa visual class/icon/state hook nếu cần; không đổi camera policy, auto-advance hoặc phase guard. Không sửa `squareBoard.ts`, `cameraFraming.ts` trừ khi có regression trực tiếp chứng minh cần sửa; ưu tiên dùng cơ chế framing hiện có. `src/rendering/boardScene.ts` Pixi chỉ chuyển shared player color import nếu module được di chuyển, không redesign prototype.

Vùng bảo vệ: **toàn bộ `src/game/**`, `src/store/**`, manifest `docs/classic-vietnam-v2.json`**. Lưu hash trước/sau, kiểm cả file thêm/xóa. Không sửa gameplay tests để hợp thức hóa thay đổi UI. Giữ action type/payload/dispatch, timers và RNG hiện có.

## 6. Validation

### Baseline đã chạy trong lần review này

| Check | Kết quả |
| --- | --- |
| TypeScript `tsc -b --pretty false` | Pass |
| Vitest | 86 tests / 8 files pass |
| Vite production build | Pass; main 404.81 kB / gzip 128.21 kB; CSS 33.53 kB / gzip 7.92 kB |
| Lint | Chưa có script/config/dependency lint; không báo lint pass |

Các command chạy bằng Node 24 runtime phù hợp Vite hiện tại. Đợt review không chạy lại full browser gameplay suite; các report Task #1 là baseline lịch sử, không giả định là test mới của Task #2.

### Sau implementation

- `npm run typecheck`, `npm test`, `npm run build`, `npm run design:check`; browser `game:check`, `production:check`. Lint chỉ chạy nếu có cấu hình hợp lệ; ghi rõ không có nếu vẫn chưa có, không thêm lint framework chỉ để làm đẹp báo cáo.
- Font: same-origin requests, đúng weights và glyph tiếng Việt; cold cache, font tải chậm, 404, chặn external requests, immediate start, remount/unmount. Kiểm atlas được refresh đúng sau late load và không có texture/resource leak qua nhiều lần tạo ván.
- Viewports bắt buộc: **844×390, 852×393, 896×414, 915×412, 932×430**. Thêm stress **568×320, 667×375**; tablet 1024×768, desktop 1440×900; portrait fallback và orientation change.
- Fixtures: 2/3/4 players; tên dài 24 ký tự, dấu tiếng Việt, tiền lớn; full property names; nhiều assets và rent levels; cả 32 event cards; rent/utility/jail/liquidation/bankruptcy/winner; lỗi setup/sheet/toast; disabled/selected; WebGL unavailable; keyboard, focus restore và reduced motion.
- Contrast target: text thường tối thiểu 4.5:1, text lớn 3:1; controls/indicators quan trọng có outline/shape để không chỉ dựa vào màu. Đo cả gradient/alpha composite và inactive HUD. Group/player fills không dùng làm màu chữ trên nền kem nếu contrast không đạt.
- Geometry: không page scroll trong gameplay landscape, 40 tiles và board order giữ nguyên; controls/tên không overflow; CTA luôn tiếp cận được; focus/nhãn icon giữ đúng. Sheet nhiều nội dung được scroll riêng, không ép mọi nội dung vào viewport làm chữ quá nhỏ.
- Camera: overview/follow/manual camera, token framing, full board fit, actual raycast. HUD/text tăng cỡ phải được occluder framing nhận biết, tránh tăng panel tới mức board quá nhỏ.
- Performance: so main/CSS/font payload, atlas memory, draw calls/triangles và idle render với baseline. Không tạo label DOM cho từng frame hoặc animate liên tục. Mobile viewport emulation không được gọi là benchmark Android/iPhone thật; ghi riêng kết quả thiết bị thật nếu có.
- Regression gameplay: UI-only production smoke cho roll/move/buy/rent/event/turn; snapshots dev chỉ cho rare visual states, không ship hooks QA vào game.
- Before/after: cùng viewport, fixture, camera mode, render scale và thời điểm settle/font-ready. Lưu ảnh gameplay/HUD/context/property/event/error/winner/overview/follow. So typography, hierarchy, CTA, identity, group, ownership và mức board bị che.

## 7. Hoàn tất và bàn giao

Chỉ đóng Task #2 khi đạt toàn bộ DoD trong task gốc, baseline gameplay không regression, hash vùng bảo vệ không đổi, font loading không làm lỗi atlas/UI và 5 viewport bắt buộc không overflow nghiêm trọng.

Báo cáo cuối theo A–J: Visual Audit; Tokens; Typography; Color Changes before/after/reason; Component Changes; Board Changes; Responsive Testing; Validation; Before/After; Remaining Issues. Cập nhật tài liệu bảng màu để phản ánh implementation mới. Sau bàn giao dừng, không tự thêm feature gameplay.

## Nguồn font và font loading đã xác minh

- [Be Vietnam Pro trong repository Google Fonts](https://github.com/google/fonts/tree/main/ofl/bevietnampro): có Medium, Bold, ExtraBold.
- [OFL của Be Vietnam Pro](https://raw.githubusercontent.com/google/fonts/main/ofl/bevietnampro/OFL.txt): license/copyright cần đi cùng font asset.
- [Font Loading API — `FontFaceSet.ready`](https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet/ready): font loading/layout readiness. Khi triển khai atlas vẫn load/check cụ thể weights cần dùng; không chỉ gọi `ready` trước khi font bắt đầu tải.
