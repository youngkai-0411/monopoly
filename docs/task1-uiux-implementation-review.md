# Task #1 — Kết quả tối ưu UI/UX gameplay

Ngày 04/10/2026. **Đã hoàn thành A–E và software validation.** [Kế hoạch](task1-uiux-review-plan.md) được triển khai trong phạm vi UI/presentation. Không tự chuyển sang feature development.

## Kết quả chính

Bỏ fixed left sidebar và vùng canvas bị kẹp giữa hai cột. Canvas hiện phủ 100% vùng gameplay dưới HUD, so với 59,7% tại 844×390 và 53,6% tại 568×320 trước task. Đây là diện tích canvas, không phải phần trăm diện tích các ô bàn cờ.

Bàn cờ được phóng lớn bằng framing mới, giữ góc isometric. Overview xét projected tile surfaces và các vùng UI nổi; đủ 40 ô/bốn góc, không để tile centers nằm sau controls ở trạng thái bình thường. Một phần scenery bên ngoài có thể bị crop khi phóng lớn; models và art direction được giữ nguyên.

| Phase | Kết quả |
| --- | --- |
| A — Layout | Canvas toàn vùng, bỏ left sidebar, action panel ở góc gọn, camera icon 48px, navigation tách riêng |
| B — Context UI | Card tạm khi chọn/đáp xuống; sheet full detail; purchase context ngắn; assets theo nhóm; thẻ đang giữ; toast 2,5s |
| C — GamePhase | Waiting/rolling/moving/resolving/optional rõ ràng; giữ extra roll, utility rent dice, jail và các mandatory surfaces |
| D — Camera & Motion | Follow token thật; giữ đích qua decision; viền destination; manual camera được giữ qua movement; UI phụ giảm emphasis |
| E — Responsive & QA | Safe area/touch/typography, 9 viewport, portrait-dialog recovery, keyboard, reduced motion, DOM fallback, tests/build/production |

## UX đã thay đổi

- Primary panel chỉ giữ người chơi, dice/kết quả và hành động hợp lệ. Khi moving/rolling không để lại nút Roll/End giả bị disable; chỉ hiển thị trạng thái và dice. Khi mandatory decision xuất hiện, panel primary thường được thay bằng surface tương ứng.
- Mua/bỏ qua dùng context ngắn, bảng nhóm/thuê có thể mở rộng. Giá/rent/level lấy từ dữ liệu và engine selectors hiện có; không lấy số trong wireframe làm luật.
- Tap tài sản mở contextual card, sau đó xem sheet chi tiết. Auto context sau landing tự đóng sau 5s; context của lượt trước bị xóa. Card thủ công có nút đóng. Tên tài sản đầy đủ trong atlas/context/sheet.
- Metadata hiển thị qua presentation helper; ẩn chuỗi Landmark 81 theo task, không sửa PropertyDefinition sang địa danh khác, không render raw IDs.
- Tài sản được chia theo nhóm màu và tiến độ sở hữu; ga/tiện ích tách phần. Thẻ chỉ hiển thị jail cards đang giữ; sử dụng tiếp tục nằm trong lựa chọn ra tù có sẵn.
- Debt sheet chọn một tài sản đang sở hữu của đúng debtor, một CTA thanh lý; bán một công trình/bán nhóm là lựa chọn phụ. Không thay số tiền, thứ tự payments hoặc cơ chế thanh lý.
- Activity không còn nằm thường trực trong panel. Toast lấy log đã commit, tự hết hạn; nhật ký engine vẫn giữ nguyên.
- Active HUD có accent và turn indicator; inactive nhẹ hơn. Không có pulse/animation vô hạn.
- Keyboard selection chuyển focus từ danh sách ô sang context card, tránh danh sách che nút. Sheet có header/close sticky, khôi phục focus khi đóng; engine errors hiển thị bên trong dialog.
- UI phụ và tile interaction bị ngăn trong busy/mandatory phases. Store lock và engine phase/actor validation giữ nguyên.
- Reduced motion snap camera/tắt dice motion; WebGL mất context vẫn chọn ô, mở detail và dùng các controls ngoài board được.

## Components và files

Đã sửa:
- src/App.tsx — composition/HUD/panel guards; giữ auto-advance timers.
- src/components/Board.tsx — immersive shell, selection/context và camera policy.
- src/components/TurnControls.tsx — phase-sensitive action surface; reuse Dice, không sửa logic xúc xắc.
- src/components/GameOverlay.tsx — context purchase, grouped assets/cards/debt và native sheets.
- src/components/ThreeBoard.tsx — framing bounds, interaction guards, keyboard/raycast/lifecycle.
- src/components/ClassicBoard.tsx — fallback dùng controls bên ngoài, metadata display.
- src/rendering/tabletopScene.ts — camera framing/view offset và destination outline.
- src/styles.css — gameplay layout/responsive/sheets; loại bỏ rules của sidebar cũ.
- scripts/v2-browser-check.mjs và scripts/production-smoke.mjs — kiểm tra layout/surfaces mới.

Tạo mới:
- src/components/PropertyContextCard.tsx
- src/components/SecondaryActions.tsx
- src/components/ActivityToast.tsx
- src/components/gameplayUI.ts — predicates/formatting của presentation.
- src/rendering/cameraFraming.ts — fit projected surfaces quanh controls.
- tests/cameraFraming.test.ts — fit, vùng che và token-height clearance.

Reuse Sheet, Dice, ThreeBoard, game selectors/actions/data. Không rebuild engine, không đổi palette/models/atlas/property data, không thêm trading/auction/bot/online. Historical graphics studies vẫn độc lập.

## Bảo toàn engine

[SHA256 trước/sau](task1-engine-preservation.json): **20 files giữ nguyên**, gồm toàn bộ src/game, store và manifest kinh tế. Không có file thay đổi/thêm trong vùng được bảo vệ.

Helpers mới chỉ đọc state và quyết định presentation. Camera không advance game hoặc quyết định logical position, animation không thay turn/dice/movement timing của App.

## Validation

| Kiểm tra | Kết quả |
| --- | --- |
| Strict TypeScript | Đạt |
| Vitest | 86 tests / 8 files đạt; 83 regression có sẵn + 3 camera framing |
| Production build | Đạt; không chunk-size warning; main ~405 kB trước gzip |
| Design/data | 9 checks đạt |
| Gameplay browser | 9 viewport, 24 nhóm checks, không page/console errors |
| Production UI | 24 lần đổi người chơi, 28 rolls, 3 purchases, 6 events, 1 rent payments; không console errors |
| Camera prototype lịch sử | 7 viewport, full camera sequence, raycast/keyboard/portrait/idle đạt |
| Idle render | 0 sau khi camera settle |
| Lint | Repository chưa có lint config; không ghi lint passed |

Viewport gameplay: **568×320, 667×375, 844×390, 852×393, 896×414, 915×412, 932×430, 1024×768, 1440×900**. Canvas share = 100%, no page scroll, controls fit, primary target 48px, overview fit và tile-center hit tests đạt ở cả 9.

Browser checks gồm mua ba loại tài sản, utility rent riêng, jail fee/card, đủ nhóm/xây đều tới hai hotels, event→nearest-ga→resolve, bán nhóm trả nợ, multi-debtor đúng người nợ, bankruptcy/winner, extra roll, grouped assets/cards, toast expiry, stale context, keyboard errors/focus, long names/money, simulated safe-area paddings, actual canvas raycast, manual overview khi đang di chuyển, portrait với dialog đang mở, reduced motion và fallback mở detail.

Rare states dùng valid snapshots qua dev modules như trước, không ship QA hooks. Production chỉ thao tác UI, không inject store/snapshot. Browser RNG có seed nhưng renderer cũng dùng nguồn random này; kịch bản chơi tối thiểu 24 lượt và tiếp tục nếu chưa gặp rent/event, tối đa 64, vẫn assert đầy đủ các luồng. Đợt cuối đã gặp các luồng trong 24 lượt. Không cưỡng ép winner hoặc đổi luật cho test.

Evidence:
- [Gameplay browser report](task1-uiux-checks.json)
- [Production report](task1-production-checks.json)
- [Protected source proof](task1-engine-preservation.json)
- [Camera study regression](3d-viewport-checks.json)
- [Baseline layout](task1-uiux-baseline.json)

## Hình ảnh

- [Trước refactor](task1-uiux-before-mobile.png)
- [Gameplay mobile](task1-gameplay-mobile.png)
- [Màn nhỏ](task1-gameplay-small-mobile.png)
- [Tablet](task1-gameplay-tablet.png)
- [Desktop](task1-gameplay-desktop.png)
- [Camera theo movement](task1-follow-mobile.png)
- [Context card](task1-context-mobile.png)
- [Quản lý tài sản](task1-assets-mobile.png)
- [Chi tiết tài sản](task1-property-mobile.png)
- [Nhà tù](task1-jail-mobile.png)
- [Chiến thắng](task1-winner-mobile.png)
- [Production](task1-production-mobile.png)

Đã xem lại ảnh layout/context/management và sửa ảnh chụp để tránh bắt giữa animation của card/camera.

## Giới hạn còn lại

Chrome desktop mô phỏng mobile xác nhận layout/flow, chưa xác nhận Safari/Android/iPhone thật, notch/browser chrome thực tế, FPS, nhiệt và pin. Chữ nhỏ ở overview vẫn dùng full-name context/sheet để bổ sung; không yêu cầu đọc mọi tên trực tiếp trên tile xa camera. Modal dài có thể scroll nội dung; gameplay bình thường không page scroll.

Các hạn chế balance/thời lượng khi nhóm đất bị chia nhỏ, reload làm mất ván và chất lượng asset procedural giữ nguyên từ V2; nằm ngoài Task #1. Không thêm feature hoặc tự điều chỉnh economy.

Task #1 kết thúc tại UI/UX refactor và kiểm tra nêu trên.
