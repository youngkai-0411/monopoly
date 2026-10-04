# Tỷ Phú Việt Nam V2 — implementation và validation

Ngày 04/10/2026 (Asia/Bangkok). Người dùng đã cho phép triển khai các bước 2–7 cùng một đợt và thêm bước tham khảo/làm mới UI. Bản V2 local đã triển khai, chưa push/deploy trong đợt này.

## Kết quả

Game thật tại / dùng Three.js, 40 ô và engine V2. Prototype camera tại ?graphics=1 và study Pixi tại ?graphics=2 là fixtures riêng. Không dùng timer/dice mẫu của prototype trong store thật.

| Phần | Đã triển khai |
| --- | --- |
| Dữ liệu | 22 đất, 4 ga, 2 tiện ích, 8 nhóm màu, bốn góc 0/10/20/30, 6 ô thẻ, 2 thuế |
| Kinh tế | 1.500 Tr bắt đầu; giá/thuê theo manifest; ga đếm ownership; utility roll riêng |
| Lượt | Đổ đôi thêm lượt, ba đôi vào tù, phân biệt Jail/Visiting, phí/thẻ/thử đôi và resume sau debt |
| Xây/bán | Full set, xây/bán đều, mức 0–5, trao đổi nhà/hotel, stock 32/12, bán cả nhóm khi thiếu nhà để hạ hotel |
| Thẻ | 16+16 V2, hai jail cards, absolute/nearest/backwards movement, rent override theo ngữ cảnh, sửa chữa, multi-player payments |
| Debt/winner | Bán công trình trước đất, thanh lý, trả phần tiền có thể, bankruptcy, bảo toàn cards/stock, loại khỏi lượt và last survivor |
| Presentation | Bàn 3D conventional, mesh/atlas, công trình theo state, camera theo movement thật, context-loss DOM fallback |
| Mobile UI | Jade/cream/gold, HUD nhỏ, controls cạnh bàn, full name/type/rent/group-progress sheets, portrait, reduced motion, keyboard/native dialogs |

Không thêm auction/mortgage/trading hoặc feature ngoài kế hoạch. Lựa chọn mở rộng trading đã được hỏi sau khi stress test phát hiện kéo dài; khi chưa có trả lời thì giữ phạm vi ban đầu.

## Kiến trúc

UI → Zustand action → reduceGame → cloned state → UI. Engine không import React/Three/Pixi. Helpers chỉ mutate bản clone do reducer tạo; invalid phase/actor/action bị reject trước commit. RNG inject cho movement dice, utility rent dice và deck shuffle. Các trạng thái prison, extra roll, debt-resume và building bank ở engine; camera state chỉ thuộc presentation.

[Manifest](classic-vietnam-v2.json) là nguồn board/group/economy duy nhất; runtime adapters tạo typed discriminated unions. Display metadata giữ các landmark cũ. Rules không đặt trong JSX. Không thêm bot hoặc test hook vào production.

Three.js được lazy-load khi vào ván; vendor core/render split riêng. DPR cap 1,5; instancing cho static/dynamic repeated geometry; atlas labels; blob shadows thay shadow maps; RAF chỉ hoạt động khi cần; cleanup resources và context recovery. Draw-call counts là phép đo scene trên desktop, không quy đổi thành FPS điện thoại.

## Validation phần mềm

- Strict TypeScript: đạt.
- Tests: **83 đạt / 7 files**, gồm phase/actor/immutable guards, 40-tile wrap, ba loại tài sản, utility dice tách biệt, doubles/jail, debt resume, full/even building, stock exchange/selling shortage, đủ 32 card effects, chained events, multi-debtor payments, bankruptcy và winner.
- Design: **9 checks** về cấu trúc, bảng kinh tế, tham chiếu và tài liệu/runtime manifest.
- Production build: đạt; tách Three core/render tránh chunk >500 kB mà không tăng warning threshold.
- Browser ván thật: **7 viewports**, 14 nhóm checks; real setup/roll và camera, mua cả ba loại, utility rent, jail fee, xây đều tới hai khách sạn, nearest-ga event, bán group trả nợ, bankruptcy/winner, portrait, reduced motion, zero idle render, WebGL→DOM.
- Browser trạng thái hiếm dùng valid engine snapshots qua dev module của Vite. Không tuyên bố tất cả các kịch bản đó được chơi từ đầu bằng UI trên production.
- Prototype camera: 7 viewport, full board fit, HUD không che ô, raycast/keyboard, full camera sequence, next player, portrait/reduced motion/idle.
- Study Pixi lịch sử: 40 ô, movement và context fallback.
- Không có lint config trong repository; không ghi lint passed.

Evidence: [browser report](v2-browser-checks.json), [camera report](3d-viewport-checks.json), [design checks](classic-design-checks.json), [screenshots/interface review](v2-interface-review.md).

[Production UI smoke](v2-production-checks.json) chạy trên bundle build tại cổng 4173: 24 lần đổi người chơi được quan sát qua HUD, mua tài sản, event, thuê, camera follow và xoay màn hình khi dialog Nhật ký đang mở. Chỉ thao tác UI, browser RNG có seed để lặp lại, không import dev store hoặc inject game snapshot. Không có console errors; bản production vẫn fit viewport và hồi phục từ portrait.

## Playtest và giới hạn cân bằng

Giữ nguyên giá đất, rent tables, vốn đầu, GO và bộ thẻ baseline. Thử điều chỉnh năm khoản tiền của Cuộc Sống không giải quyết nguyên nhân chính, nên đã trả về baseline; không dùng thay đổi đó trong bản cuối.

| Policy | 2 người | 3 người | 4 người |
| --- | --- | --- | --- |
| Gom nhóm, không mua ô trong nhóm đối thủ đã bắt đầu | 10/10 kết thúc | 10/10 kết thúc | 10/10 kết thúc |
| Mua mọi tài sản khi có tiền, có thể chia nhỏ các nhóm | 8/10 kết thúc | 7/10 kết thúc | 4/10 kết thúc |

Policy gom nhóm là chiến lược test phù hợp điều kiện full-set-building, **không dự đoán mọi người chơi**. Cả hai policies dùng action hợp lệ, random seed cố định và luật thắng thông thường. Không ép winner/cắt lượt/Quick Mode.

[30 ván gom nhóm](playtest-results.json): median số lần đổ là 141,5 / 157 / 239,5 tương ứng 2/3/4 người; max 249 / 274 / 287. Cards, tiền, owners, jail positions và house/hotel stock được kiểm tra invariant trong suốt simulation.

[Stress mua tất cả](v2-balance-before.json): 11/30 ván chưa kết thúc sau 100.000 actions. Ghi là **chưa hoàn tất**, không ghi đạt điều kiện winner. Phân tích một seed kéo dài cho thấy nhiều nhóm chia nhỏ, ít nhà được xây và GO tiếp tục cấp tiền; đây là hạn chế thiết kế khi trading bị loại khỏi scope, không phải engine bị mắc ở một phase.

UI đã thêm người sở hữu từng đất trong nhóm để hỗ trợ quyết định mua/xây. Chưa khẳng định game luôn kết thúc nhanh, đạt 20–35 phút hay đã cân bằng cho mọi chiến thuật. Mở trading/auction cần scope riêng nếu muốn giảm tình trạng này.

## Phần còn pending

- Android và iPhone thật (Safari, FPS/frame time, nhiệt/pin, browser chrome/safe area/keyboard).
- Human playtest: thời lượng, cạnh tranh chặn nhóm, cảm giác camera và chữ ở overview.
- Scope quyết định bổ sung trading nếu người dùng muốn giải quyết ván chia nhỏ nhóm.
- Art hiện vẫn là low-poly procedural; chưa có bộ asset artist tạo riêng.

Phần mềm V2 chạy được và các checks nêu trên đạt. Không đánh dấu các phép đo thiết bị/người thật là đã hoàn tất.
