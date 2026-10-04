# Kế hoạch chuyển đổi Tỷ Phú Việt Nam sang bàn 40 ô

Ngày 04/10/2026. Người dùng yêu cầu **thực hiện bước đầu tiên và lập kế hoạch toàn bộ các bước**. Sau đó người dùng đã yêu cầu triển khai toàn bộ trong một đợt và thêm bước tham khảo/làm mới giao diện. Bản V2 đã được triển khai trong phạm vi đã chốt; đối chiếu bằng chứng ở [báo cáo V2](v2-implementation-review.md).

## Kết quả cần đạt

Một ván local 2–4 người với bàn 40 ô chủ đề Việt Nam: 22 đất, 4 ga, 2 tiện ích; luật thuê phân loại; nhóm màu, nhà/khách sạn; đổ đôi và nhà tù; 32 thẻ V2; camera 3D toàn bàn/focus/follow; UI mobile không cần scroll để chơi. Giữ kiến trúc UI → Action → Engine → State → UI, RNG inject và engine độc lập renderer.

Baseline ở [classic-vietnam-spec.md](classic-vietnam-spec.md), dữ liệu ở [classic-vietnam-v2.json](classic-vietnam-v2.json). Phạm vi này gần Classic nhưng chưa gồm các hệ thống mở rộng ở cuối tài liệu.

## Thứ tự và trạng thái

| Bước | Kết quả | Phụ thuộc | Trạng thái |
| --- | --- | --- | --- |
| 1 | Đặc tả 40 ô, địa danh, nhóm màu, bảng kinh tế, scope | — | Hoàn tất; manifest dùng trong runtime |
| 2 | Dữ liệu/types và engine mua/thuê cho ba loại tài sản | 1 | Đã triển khai |
| 3 | Lượt đổ đôi, nhà tù, xây/bán đều và ngân hàng công trình | 2 | Đã triển khai |
| 4 | Hai bộ thẻ V2, thanh lý/phá sản và chuỗi xử lý nghĩa vụ | 3 | Đã triển khai |
| 5 | Bàn 3D 40 ô và tích hợp camera với ván chơi thật | 2–4 | Đã triển khai |
| 6 | Hoàn thiện UI mobile, lựa chọn tài sản và hỗ trợ truy cập | 5 | Đã triển khai |
| 7 | Playtest, kiểm tra thiết bị, điều chỉnh kinh tế và review | 6 | Software QA đạt; kiểm tra thiết bị/người thật pending |
| 8 | Tham khảo, làm mới UI và review hình ảnh | 6–7 | Đã triển khai; xem interface review |

Không cam kết thời lượng ván hay FPS điện thoại khi chưa đo. Các quyết định art và balance có thể thay đổi sau khi có bằng chứng; phải cập nhật JSON, tài liệu và kiểm tra trong cùng thay đổi.

## Bước 1 — thiết kế dữ liệu và kinh tế

Đã chốt ở mức baseline:
- Thứ tự 40 ô 0-based và bốn góc 0/10/20/30.
- 22 địa danh giữ ID cũ; Phú Quốc rời danh sách đất V2.
- 4 ga Việt Nam; 2 tiện ích; 8 nhóm màu theo phân bố 2/3/3/3/3/3/3/2.
- 1.500 Tr ban đầu; 200 Tr Bắt đầu; thuế 200/100; phí ra tù 50.
- Bảng giá, chi phí xây, thuê 0–4 nhà/khách sạn cho từng đất.
- Tỉ lệ ô thường và góc cho bàn 3D.
- Những khác biệt Classic còn giữ và các feature chưa được đưa vào phạm vi.

Đầu ra: JSON + đặc tả + kế hoạch + script kiểm tra thiết kế. DoD: dữ liệu không thiếu/trùng/đứt tham chiếu, khớp thứ tự loại ô, bảng Markdown khớp JSON; ở checkpoint bước 1 chưa import vào runtime; V2 hiện đã dùng manifest này làm nguồn duy nhất.

## Bước 2 — dữ liệu và ba loại tài sản

Thay type tài sản hiện tại bằng discriminated union LAND / RAILROAD / UTILITY. Đất có group và bảng thuê theo công trình; ga có bảng thuê theo số ga; tiện ích có multiplier theo số tiện ích. Trạng thái ownership chung, công trình chỉ áp dụng cho đất. Không dùng propertyId truthiness để mặc định mọi tài sản là đất.

Đưa 40 ô và bảng giá vào dữ liệu runtime qua một lần chuyển đổi có kiểm tra, không để JSON docs và TypeScript thành hai nguồn luật độc lập lâu dài. Ngay khi đổi runtime, cập nhật mọi đường render đang dùng cùng dữ liệu: DOM fallback, Pixi và prototype Three.js phải nhận đủ 40 ô với layout tối thiểu hợp lệ. Không phát hành checkpoint engine 40 ô nhưng renderer vẫn giới hạn 36 ô. Đồ họa chi tiết/camera ván thật dành cho bước 5.

Sửa movement/wrap/Start, setup asset states, buy/skip, selector tên/giá/chủ và rent:
- Ga đếm đúng tài sản cùng chủ; không có level hay group màu.
- Tiện ích cần một phase/action đổ riêng để tính thuê. Không ghi đè ngữ cảnh lượt di chuyển, không tính đổ đôi từ xúc xắc thuê.
- Rent đất tra bảng; bonus nhóm chỉ áp dụng đất trống.
- V2 bỏ TRAVEL/TRAVEL_FUND/DETENTION; các action tương ứng không còn được chấp nhận trong ván V2.
- New game là ranh giới chuyển dữ liệu; không remap lặng lẽ ván cũ.

Files dự kiến: src/game/types/domain.ts, rules/config.ts, data/board.ts, properties.ts, groups.ts; engine/setup.ts, movement.ts, economy.ts, selectors.ts, actions.ts; components/boardLayout.ts, ClassicBoard.tsx; rendering/boardGeometry.ts, squareBoard.ts và các consumer BOARD trong renderer. Tên file có thể tách assets.ts để phản ánh ba loại, nhưng không rewrite toàn bộ engine.

Validation: wrap 39→0/0→39, Start nhận đúng một lần, không thưởng khi đi tù; buy/self-rent/insufficient money; thuê ga 1–4 và tiện ích 1–2 bằng RNG cố định; reject xây trên tài sản không phải đất; invariant 28 asset states; phase/actor invalid actions không mutate nguồn; toàn bộ renderer nhận được 40 index.

## Bước 3 — lượt, nhà tù và công trình

Tách rõ state luật với camera state: consecutive doubles, jail state/attempts, movement dice và rent dice. Thực hiện extra roll sau khi resolve đầy đủ nghĩa vụ; ba lần đôi đưa vào tù trước khi di chuyển kết quả lần ba. Ra tù bằng đôi không tạo extra roll. Đi tù kết thúc lượt, không thưởng Start, nhưng còn quyền thu thuê.

Thêm hành động trả phí/dùng thẻ/thử đôi ra tù; lượt thử thứ ba không đủ tiền phải đi qua debt handling trước khi tiếp tục. Đi vào ô Nhà tù bằng di chuyển thường chỉ là thăm tù.

Đất dùng mức 0–5; xây đủ nhóm, xây đều, bán đều; đổi bốn nhà thành một khách sạn; quản lý 32 nhà/12 khách sạn. Thiếu tồn kho phải reject ở engine. Đặc tả rõ bán khách sạn khi ngân hàng thiếu nhà: không tạo nhà ảo, cho phép bán toàn bộ công trình cần thiết của nhóm theo giá hoàn lại đã quy định. Trong scope hiện tại, xây vào OPTIONAL_ACTIONS; bán để trả nợ có action riêng cho debtor.

Files dự kiến: domain.ts, rules/config.ts, engine/turns.ts, actions.ts, selectors.ts, economy.ts, payments.ts; bổ sung helper xây/jail chỉ khi giảm duplication. UI engine errors phải mô tả lý do cụ thể.

Validation: đôi 1/2/3; reset sau đổi người; bị đi tù qua ô/thẻ; thử ra tù lần 1–3 và trả phí thiếu tiền; thăm tù; không extra roll từ dice thuê/ra tù; ownership/group/even-build/max-level guards; bảo toàn nhà/khách sạn qua mua/bán/phá sản.

## Bước 4 — sự kiện, thanh lý và phá sản

Soạn đủ 16 Cơ Hội + 16 Cuộc Sống bằng lời Việt Nam, ID V2 rõ ràng. Bỏ status Traffic/Coffee và bảo hiểm miễn thuê; đưa thẻ ra tù vào hai bộ. Tạo catalog cụ thể trước khi code, đối chiếu cơ chế với baseline và scope.

Hiệu ứng có schema riêng: move absolute, move nearest railroad/utility, move backward, money, collect/pay each, repair by houses/hotels, go to jail, get-out-of-jail. Thẻ có thể override thuê ga/tiện ích nhưng phải lưu ngữ cảnh effect riêng; không biến đổi giá cơ bản của tài sản. Đi đến ô vẫn resolve destination; tránh vòng resolve thẻ vô hạn và cộng Start hai lần. Thẻ ra tù đang giữ phải nằm ngoài draw/discard, được trả đúng bộ.

Debt/asset liquidation cần giá trị riêng: ga/tiện ích 50% giá mua; đất bán công trình theo giá hoàn lại và điều kiện nhóm trước, rồi thanh lý đất 50% giá mua. Không hoàn lại cả giá đầu tư bằng một phép tính chung nếu làm vỡ tồn kho/build-even. Không bán đất còn công trình; không bỏ qua các nghĩa vụ trả nhiều người. Thanh lý là phiên bản chuyển tiếp, không gọi là mortgage.

Nếu không thể trả nợ, thu tiền còn lại, thu hồi công trình, xử lý asset/cards, loại người chơi và chọn winner theo phạm vi V2. Chuyển tài sản cho chủ nợ đúng Classic được để trong phần mở rộng.

Files dự kiến: data/cards.ts, engine/events.ts, payments.ts, selectors.ts, actions.ts, turns.ts; scripts/playtest.mjs và tests/playtest.test.ts phải biết loại tài sản mới. Không thêm bot vào sản phẩm.

Validation: đủ 32 thẻ, bảo toàn deck/card-held, movement đến đúng ô và rent override chỉ cho sự kiện đó; go-to-jail không thưởng; repairs theo số nhà/hotel; nghĩa vụ nhiều debtor; thanh lý đang có group buildings; bankrupt trả lại stock/cards; last-player-standing không để người bị loại nhận lượt.

## Bước 5 — bàn 3D và camera ván thật

Hoàn thiện squareBoard thành mô hình tile có tâm, chiều rộng/chiều sâu, hướng cạnh và bounds thật; vị trí từ dữ liệu, không chia viewport thành cell lệch kích thước. Góc vuông lớn, ô thường chữ nhật đồng đều theo baseline. Đủ 40 mesh/label/picking target cùng thứ tự engine.

Thêm mô hình 4 ga, điện/nước, Nhà tù/Đi tù, nhà 1–4 và khách sạn; chủ sở hữu và công trình đồng bộ GameState. Atlas chữ vẫn hiện full name trong sheet khi không đọc được ở overview.

Tích hợp ThreeBoard vào ván chơi thật bằng adapter presentation đọc state và dispatch action hợp lệ. GraphicsPreview tiếp tục là fixture demo riêng; không dùng các timer/dice cố định của demo để điều khiển gameplay thật. Camera overview → active player focus → dice/movement follow → landing → overview; hỗ trợ bật/tắt theo nhân vật, reduced motion, không cho phép timer camera thực hiện END_TURN. Không tự thêm orbit camera bằng tay.

Giữ render on demand, pause hidden, DPR cap, instancing/material reuse, texture atlas, cleanup GPU và fallback DOM khi WebGL không khả dụng hoặc mất context. Loại runtime Pixi khỏi đường chơi chính chỉ sau khi Three/DOM ổn; có thể giữ art study cũ riêng để so sánh, không duy trì hai luật.

Files dự kiến: rendering/squareBoard.ts, tabletopScene.ts, tabletopArt.ts; components/ThreeBoard.tsx, Board.tsx, GraphicsPreview.tsx, App.tsx, styles.css; scripts/graphics-check.mjs. Các file Pixi chỉ thay khi cần chuyển route hoặc giảm bundle.

Validation: 40 world positions duy nhất, continuity và bounds góc; picking mesh đúng asset; full board fit không bị HUD đè; ownership/buildings đúng state; follow qua góc và wrap; teleport vào tù không tween đi qua Start; pause/resume/reduced motion; WebGL loss fallback; dispose/restart nhiều lần không tăng canvas/listener.

## Bước 6 — mobile UI và hỗ trợ truy cập

Sheet tài sản hiển thị đúng bảng thuê theo loại. Action xây, bán, phí tù, thử ra tù, dùng thẻ, thuê tiện ích theo đúng phase. HUD có trạng thái tù/đôi/tiền nhưng không tăng chiều cao quá mức.

Giữ yêu cầu người dùng: không bottom navigation cũ, không tiêu đề lớn chiếm bàn. Landscape ưu tiên; portrait fallback; gameplay không page scroll; sheet danh sách dài được cuộn bên trong; touch target chính tối thiểu 48px khi có thể. Full name khi chọn; group không chỉ truyền bằng màu. Khóa repeated input ở UI và reject ở engine.

Files dự kiến: components/GameOverlay.tsx, TurnControls.tsx, Dice.tsx, NewGame.tsx, Board.tsx, ThreeBoard.tsx; store/gameStore.ts, styles.css. Tiếp tục dùng native controls/modal focus, không chuyển mọi chữ và button vào canvas.

Validation: 568×320, 667×375, 740×360, 844×390, 932×430, 1024×768, 1440×900; portrait 390×844 và rotate khi đang mở sheet. Safe area, browser chrome, bàn phím nhập tên, focus/keyboard, screen reader labels, touch, double tap và simultaneous actions. Console không lỗi và không scroll trang.

## Bước 7 — validation, balance và review

Dùng Node.js 24 và scripts hiện có: npm run design:check, typecheck, test, build, playtest, graphics:check. Không báo lint passed khi repository chưa có lint config. Chỉ thêm lint nếu có quyết định cụ thể, không dùng việc thiếu lint làm blocker giả.

Engine regression gồm tất cả các checkpoint trên, immutable input, injected RNG, đúng phase và winner. Cập nhật fixtures từ 36→40 có chủ đích; không chỉ sửa số expected để làm test xanh.

Simulations seed cố định cho 2/3/4 người: ghi số lượt, tỷ lệ thắng, thời điểm mua/build, nghĩa vụ thuê, lỗi invariants. Đủ nhóm là điều kiện xây mới nên policy test phải phù hợp và không được coi timeout là đạt. Ghi kết quả chưa kết thúc hoặc stall để sửa balance; không ép winner bằng cắt lượt.

Browser E2E production build: setup → buy từng loại → rent → doubles/jail → xây/hotel → event → debt → bankruptcy → winner; kiểm tra camera trong game thật. Không coi việc demo chạy đẹp là gameplay đã đúng.

Physical-device review: ít nhất một Android tầm trung Chrome và một iPhone Safari; ghi model/OS/browser, overview/follow FPS, frame time khi đổ/di chuyển, memory/context recovery, nhiệt sau phiên chơi dài và readability. Browser emulation là bằng chứng layout, không thay thế phép đo thiết bị. Mốc performance mục tiêu: thao tác ổn định tối thiểu 30 FPS trên thiết bị được chọn; hướng tới 60 FPS ở máy đủ khả năng. Chưa đo thì giữ mục đó pending.

Human playtest: đọc chữ, decision time, phân biệt ga/tiện ích, thời lượng ván, độ hữu ích camera. Thay đổi kinh tế theo evidence và cập nhật design baseline cùng tests. Không thêm Quick Mode để che vấn đề game kéo dài.

Đầu ra: báo cáo validation V2, screenshots và log perf/device, changelog từ V1, giới hạn chưa kiểm chứng, bản review có thể chạy. Dừng sau báo cáo trong phạm vi công việc được giao; không tự push/deploy nếu chưa được yêu cầu cho đợt đó.

## Phần mở rộng nếu cần khớp đầy đủ Classic

Những phần sau chưa được triển khai và chưa tự đưa vào MVP:

| Hạng mục | Điều kiện và ảnh hưởng |
| --- | --- |
| Đấu giá | Đổi SKIP thành auction state; actor khác currentPlayer được bid/pass hợp lệ; tie/timeout cần luật rõ |
| Thế chấp | State mortgage, giá trị và phí chuộc; không thu thuê khi mortgaged; tương tác xây nhóm và debt |
| Giao dịch | Offer/accept atomic, nhiều loại asset/card/cash; bảo toàn tiền/quyền sở hữu và xác nhận người chơi |
| Phá sản Classic | Chuyển tài sản/thẻ cho chủ nợ hoặc đấu giá khi nợ bank; phụ thuộc mortgage/auction |
| Quyền thao tác ngoài lượt | Phase/actor quyền mua/bán/xây/bid trong game dùng chung một thiết bị |
| Đấu giá công trình cuối | Xử lý nhiều người yêu cầu cùng stock; phụ thuộc auction và quyền thao tác ngoài lượt |

Nếu mở rộng, phải soạn spec và test trước rồi mới gọi bản đó là khớp đầy đủ Classic. Lựa chọn bổ sung giao dịch đã được hỏi sau khi stress test phát hiện ván kéo dài; chưa tự triển khai khi chưa có câu trả lời mở rộng phạm vi. Không gộp âm thầm vào các bước 2–7.

## Rủi ro cần kiểm soát

- Đổi count thôi chưa đủ: renderer V1 có nhiều giới hạn 36 và demo có index/owner/level mẫu.
- 28 assets không đồng nghĩa 28 đất; selectors, repair, liquidation và UI phải xét kind.
- Engine currently uses one dice slot and current-player-only actions; utility/jail/debt cần ngữ cảnh và quyền chính xác.
- Snapshot V1 có index/level/card semantics khác; chỉ bắt đầu ván mới khi V2 sẵn sàng.
- 40 ô và góc lớn giảm diện tích chữ trên máy nhỏ; dùng overview để định hướng, sheet để đọc chi tiết.
- Full-color-set building có thể làm ván chậm hơn, nhất là khi chưa có trading; phải đo bằng playtest.

## Bước 8 — tham khảo và làm mới giao diện

Đã đối chiếu hình tham khảo người dùng với quy tắc responsive Three.js và tài liệu Game Accessibility Guidelines/W3C. Đã triển khai tông xanh ngọc/kem/vàng, mặt bàn chữ nhật đồng đều và góc lớn, sân vườn/pavilions, mô hình ga/tiện ích, HUD gọn, bảng thao tác ở cạnh bàn và sheet có tiến độ nhóm màu. Giữ full name trong chi tiết và native controls; không thêm tiêu đề lớn hoặc bottom navigation.

Xem [interface review](v2-interface-review.md) và ảnh/bằng chứng ở [implementation review](v2-implementation-review.md). Kết quả layout và browser emulation đã có; art thủ công/GPU thiết bị thật và phản hồi người chơi chưa được coi là kiểm chứng.
