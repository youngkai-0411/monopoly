# Màu sắc và typography — Visual System V3

Cập nhật: 04/10/2026, sau Task #2. Phạm vi: gameplay chính Three.js, setup, HUD, context, sheets, events, winner và DOM fallback. [Bản V2 trước refactor](visual-style-reference-v2.md) giữ làm lịch sử.

## Hệ thống màu

Ba hệ độc lập: UI Cream / Teal / Gold; 8 property groups theo manifest; 4 player colors theo visual constants. World low-poly vẫn warm, soft, friendly, isometric.

| Vai trò | Token CSS | Giá trị |
| --- | --- | --- |
| Nền chính | `--color-game-bg` | `#B4DED7` |
| Surface chính | `--color-surface-primary` | `#FFF9E9` |
| Surface phụ | `--color-surface-secondary` | `#EDF2E4` |
| Viền thường / mạnh | `--color-border-default / strong` | `#A9C5B5 / #8EAD9D` |
| Chữ chính / phụ | `--color-text-primary / secondary` | `#254B4C / #48675E` |
| Gold action | `--color-action` | `#EDB944` |
| CTA gradient | `--color-action-light / deep` | `#FFDB7D → #EDB435` |
| Chữ CTA | `--color-action-text` | `#382800` |
| Selected / chữ selected | `--color-selected / selected-text` | `#285D59 / #FFF9E9` |
| Danger text / surface / border | `--color-danger-text / surface / border` | `#973F31 / #FFE5D0 / #DBAD8B` |

Gold: primary gameplay action, destination/resolve focus tạm thời và trophy. Teal: text, selected, navigation và active turn. Red: danger/error/destructive. Không dùng player/group fill làm màu body text trên cream.

HUD/navigation dùng primary cream ở 86% alpha; context controls 97%, property context/dialog opaque. Backdrop decision 46% selected teal, blocking 64%. Scene bên dưới ảnh hưởng màu composite. Chữ phụ trên opaque cream đạt 5.92:1; trên HUD composite với teal tối đạt 4.78:1.

## Typography

**Be Vietnam Pro**, tự host cùng origin; family UI `"Be Vietnam Pro", Arial, sans-serif`. Atlas cùng family với Arial fallback. Weights 500 / 700 / 800. Six WOFF2 Latin/Vietnamese tổng 103,408 bytes; nguồn và OFL trong public/fonts/be-vietnam-pro. Không có network font dependency tới bên thứ ba khi chơi.

| Vai trò | Cỡ / weight |
| --- | --- |
| Display / winner / setup | 32px, compact 28px hoặc title 24px / 800 |
| Event title | 24px / 800 |
| Sheet title | 20px / 700 |
| Heading / property name | 18px hoặc 16px / 700 |
| Body | 14px / 500 |
| Player name HUD | 14px / 700 |
| Money HUD | 12px / 500, tabular numerals |
| Buttons | 13px, landscape nhỏ 12px / 700 |
| Labels | 13px hoặc 12px |
| Metadata phụ | 11px |
| Dice total / winner money | 24px |
| Purchase price | 28px / 800 |
| Atlas property name | Logical 18px / 700, raster scale 1.5 |
| Atlas price | Logical 14px / 500, raster scale 1.5 |

Atlas cell 192×192, whole texture 1344×1344. Cỡ texture không phải cỡ CSS; zoom/camera quyết định kích thước hiển thị. Full names trong context/sheet, wrap khi cần; tên dài HUD ellipsis kèm title đầy đủ. Micro không dùng cho số tiền/primary control.

Font lỗi: UI/atlas dùng fallback và game vẫn tiếp tục. Font tới muộn: atlas refresh một lần, dispose tài nguyên cũ. Emoji có thể dùng ở event illustration; core controls là SVG, player indicator là CSS controlled color.

## Property groups — giữ nguyên mapping và HEX

| Nhóm | HEX |
| --- | --- |
| Miền Tây | `#8B5A2B` |
| Phương Nam | `#87CEEB` |
| Cao Nguyên | `#D95AA5` |
| Duyên Hải | `#F59E0B` |
| Di Sản | `#DC2626` |
| Miền Trung Bắc | `#FACC15` |
| Miền Bắc | `#16A34A` |
| Đô Thị | `#1D4ED8` |

## Player identity — giữ nguyên HEX

| Player | HEX |
| --- | --- |
| 1 | `#EE6B73` |
| 2 | `#59BAFA` |
| 3 | `#73D7A0` |
| 4 | `#FFD46A` |

HUD/setup/owner context, pawn, ownership strip và DOM fallback dùng chung identity. Chấm player có teal outline để màu nhạt vẫn nhận biết được. Group strip giữ group color; owner strip tách riêng, không đổi toàn bộ mặt property thành player color.

## Surfaces và layout tokens

- Level 0: board world; Level 1: HUD/navigation nhẹ; Level 2: context/camera; Level 3: decision; Level 4: blocking debt/bankruptcy/winner.
- Spacing: 2 / 4 / 8 / 12 / 16 / 24 / 32.
- Radius: control 10, button 12, HUD/card 16, sheet/dialog 20, pill 999.
- Soft elevation context/decision/blocking; touch targets chính 48px trở lên. Geometry, safe area và board framing có giá trị riêng.
- Button variants: primary gold, secondary cream/teal, selected dark teal/light text, danger red family, ghost navigation.
- Event titles/winner names dùng primary text; description dùng secondary text. Winner amount được ghi đúng là tiền mặt.

## World palette chính

| Thành phần | Giá trị |
| --- | --- |
| Tile paper / body / border | `#FFF6DF / #F0E9CF / #A9B69E` |
| Start / Life / special tile | `#D8EDCB / #FBE0EB / #E1EBEB` |
| Tile text / price | `#254B4C / #48675E` |
| Grass / rim grass | `#8BC678 / #8AB978` |
| Stone / upper stone | `#BEAA86 / #D5C9AB` |
| Rim / path | `#FFF3CD / #E6CF99` |
| Water / drop | `#72BCC7 / #97D5DD` |
| Tree foliage | `#50A76D / #7AC783` |
| Pavilion roofs | `#3F9293 / #55AAAA` |
| House wall / hotel roof | `#FFE6B3 / #CC5B4C` |
| Dice body / dots | `#FFF8E0 / #335164` |
| Active pawn ring / destination | `#285D59 / #D49422` |

House roofs use owner/player color; hotel roof uses the shared art color. World colors are base material/atlas values; lighting changes actual pixels. Full named scene palette is in WORLD constants, separate from UI semantics.

## Source of truth và evidence

- [Visual constants](../src/visual/tokens.ts): UI/player/world palette và font direction.
- [Layout/type/elevation tokens](../src/visual/tokens.css).
- [Fonts](../src/visual/fonts.css), [asset provenance](../public/fonts/be-vietnam-pro/sources.json).
- [Group manifest](classic-vietnam-v2.json), [UI styles](../src/styles.css).
- [Atlas/model art](../src/rendering/tabletopArt.ts), [scene](../src/rendering/tabletopScene.ts).
- [Báo cáo Task #2](task2-visual-system-implementation-review.md), [visual checks](task2-polish-checks.json), [trước/sau](task2-visual-comparison.html).

Đã đối chiếu computed style, font load/late/failure, contrast opaque/composite, all 32 cards và mobile viewports. Physical Android/iPhone/Safari chưa được đo.
