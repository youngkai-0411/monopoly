# Tỷ Phú Việt Nam — V2

Game local 2–4 người, ưu tiên điện thoại ngang. Bàn 3D 40 ô chủ đề Việt Nam, xây bằng React + TypeScript strict + Zustand + Three.js + Vite. Engine độc lập UI, RNG inject, action được kiểm tra theo phase và actor.

## Chạy project

Dùng Node.js 24 (Node.js 20 không phù hợp bộ test đang cài).

```powershell
cd E:\Projects\Monopoly
npm ci
npm run dev
```

Mở URL Vite in ra, chọn 2–4 người và vào bàn chơi. [Ván chơi](http://127.0.0.1:5173/) là bản chơi thật; [prototype camera](http://127.0.0.1:5173/?graphics=1) là fixture độc lập để xem cảnh. Study Pixi cũ vẫn ở `?graphics=2`, dùng cùng 40 ô nhưng không điều khiển ván chơi thật.

Để mở trên điện thoại cùng Wi-Fi:

```powershell
npm run dev -- --host 0.0.0.0
```

Dùng địa chỉ Network Vite in ra. Quay ngang màn hình. Tải lại trang bắt đầu ván mới; phiên chơi chỉ lưu trong memory.

## Phạm vi V2

- 40 ô: 22 đất / 8 nhóm màu, 4 ga Việt Nam, Điện lực + Cấp nước, 6 ô thẻ, 2 thuế, 4 góc.
- 1.500 Tr ban đầu; 200 Tr qua Bắt đầu. Giá/thuê lấy từ [manifest duy nhất](docs/classic-vietnam-v2.json).
- Ga thuê theo số ga sở hữu; tiện ích dùng xúc xắc thuê riêng.
- Đủ nhóm mới xây, xây/bán đều; 1–4 nhà rồi khách sạn; ngân hàng 32 nhà / 12 khách sạn.
- Đổ đôi thêm lượt; ba đôi liên tiếp vào tù. Trả phí, dùng thẻ hoặc thử đôi để ra tù; chỉ ghé thăm không bị giam.
- Đủ 16 Cơ Hội + 16 Cuộc Sống V2; thẻ ra tù giữ riêng, sự kiện di chuyển xử lý đúng ô đến.
- Bán công trình và thanh lý trước khi phá sản. Người cuối cùng còn lại thắng.
- Three.js là renderer chơi chính: overview, focus/follow, nhà/ga/tiện ích, quân cờ và xúc xắc 3D. Nếu WebGL không dùng được hoặc mất context, chuyển sang bàn DOM chơi được.
- Giao diện xanh ngọc/kem/vàng, canvas toàn vùng gameplay; HUD gọn, controls nổi và context/sheet tạm thời. Tài sản/Thẻ/Nhật ký tách khỏi primary panel; không tiêu đề lớn hoặc fixed sidebar.

Phiên bản gần Classic, không khẳng định khớp toàn bộ: chưa có giao dịch, đấu giá, thế chấp, chuyển tài sản cho chủ nợ; thanh lý không phải thế chấp. Không thêm online, bot, tài khoản hay Quick Mode.

## Kiểm tra

```powershell
npm run design:check
npm run check
npm run playtest
npm run game:check
npm run graphics:check
npm run graphics:check:2d
```

`check` gồm strict typecheck, tests và production build. Chưa có lint config; không có lệnh lint giả. `game:check` dùng Chrome cài sẵn và dev server đang chạy; kiểm tra viewport và UI các trạng thái hiếm qua snapshot engine hợp lệ, không ship hook QA. `graphics:check` kiểm tra camera study; đặt MONOPOLY_GRAPHICS_URL nếu cần test production preview. `graphics:check:2d` chỉ kiểm tra art study cũ.

Kiểm tra bản production bằng thao tác UI thật, không import store/snapshot:

```powershell
npm run build
npm exec vite preview -- --host 127.0.0.1 --port 4173
# Terminal khác, khi preview đã chạy:
npm run production:check
```

Đặt MONOPOLY_PRODUCTION_URL nếu preview dùng cổng khác. Kịch bản dùng browser RNG có seed, chơi ít nhất 24 lần đổi người tới khi gặp event/rent (tối đa 64), và xoay màn hình khi mở Nhật ký. Renderer cũng dùng nguồn browser random này; các tests engine có RNG riêng để lặp lại luật chính xác.

`playtest` chạy 30 seed cho 2/3/4 người với policy gom nhóm: không mua đất trong nhóm đối thủ đã sở hữu, ưu tiên đủ nhóm rồi xây đều với 200 Tr dự trữ. Đây là policy test, không phải bot trong sản phẩm hay mô hình mọi người chơi. Báo cáo stress mua tất cả được giữ riêng: một số ván kéo dài khi đất chia nhỏ và chưa có giao dịch. Không thay đổi điều kiện thắng hoặc ép winner để làm đẹp số liệu.

Nếu terminal không tìm thấy npm, có thể chạy bằng Node trực tiếp:

```powershell
node node_modules/typescript/bin/tsc -b --pretty false
node node_modules/vitest/vitest.mjs run
node node_modules/vite/bin/vite.js build
node scripts/playtest.mjs
node scripts/v2-browser-check.mjs
```

## Tài liệu

- [Đặc tả bàn và kinh tế V2](docs/classic-vietnam-spec.md)
- [Kế hoạch 8 bước và trạng thái](docs/classic-migration-plan.md)
- [Báo cáo triển khai/validation V2](docs/v2-implementation-review.md)
- [Task #1 — UIUX mới và validation](docs/task1-uiux-implementation-review.md)
- [Task #2 — Visual System V3 và validation](docs/task2-visual-system-implementation-review.md)
- [Màu sắc/font hiện tại](docs/visual-style-reference.md)
- [So sánh Visual V3 trước/sau](docs/task2-visual-comparison.html)
- [Tham khảo và làm mới giao diện](docs/v2-interface-review.md)
- [Playtest gom nhóm](docs/playtest-results.json)
- [Stress mua tất cả tài sản](docs/v2-balance-before.json)
- [Browser checks UIUX hiện tại](docs/task2-uiux-checks.json)
- [Production UI smoke hiện tại](docs/task2-production-checks.json)

Task #2 dùng Be Vietnam Pro self-host (500/700/800), tokens chung UI/atlas, SVG controls, player indicator kiểm soát màu, event/winner dễ đọc hơn. Kiểm tra và lưu evidence riêng:

```powershell
node scripts/task2-visual-check.mjs
node scripts/task2-polish-check.mjs
node scripts/task2-production-smoke.mjs
```

Dev server 5173 cho hai lệnh đầu, production preview 4173 cho lệnh cuối. 224 card cases, font chậm/lỗi và source preservation có trong báo cáo Task #2.

86 tests đã đạt; UIUX gameplay kiểm tra ở 9 viewport Chrome, production UI smoke, build và camera study đã chạy. Task #1 xác nhận 20 file engine/store/data/kinh tế giữ nguyên qua checksum. Android/iPhone thật, Safari, nhiệt/pin và thời lượng ván vẫn cần kiểm tra thiết bị/playtest người thật. Các tài liệu M1–M13, prototype V1 và review V2 trước Task #1 được giữ làm lịch sử.
