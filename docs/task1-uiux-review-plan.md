# Task #1 — Review và kế hoạch tối ưu UI/UX

Ngày 04/10/2026. Trạng thái: **A–E đã triển khai và software validation đạt** sau khi người dùng yêu cầu tiến hành toàn bộ kế hoạch. Phần dưới giữ nội dung review/kế hoạch làm baseline. Xem [báo cáo hoàn thành](task1-uiux-implementation-review.md) và [task gốc](../Tasks/Task%231-Update%20UIUX.txt).

Mục tiêu: bàn cờ là game world chính; hành động xuất hiện đúng lúc; thông tin chi tiết chỉ chiếm chỗ tạm thời. Giữ board isometric, palette, models, tokens và tất cả luật/gameplay V2.

## 1. Kết quả review hiện tại

Đã đọc App, Board, TurnControls, Dice, GameOverlay, ThreeBoard, ClassicBoard, TabletopScene, atlas labels, responsive CSS, store/action guards và scripts QA. Đã mở một ván mới trong Chrome headless riêng để đo layout, không thao tác vào ván trong tab của người dùng.

| Phát hiện | Bằng chứng | Hướng xử lý |
| --- | --- | --- |
| Canvas bị kẹp giữa hai cột | `styles.css`: inset trái 146px, phải 188px; màn nhỏ là 110px/146px | Canvas phủ vùng gameplay; controls nổi gọn |
| Left sidebar luôn hiện dù không có quyết định | `Board.tsx`: vị trí, landmark, vòng, chi tiết và hai nút camera | Bỏ sidebar; thông tin theo selection/landing; vòng thành metadata nhỏ |
| Panel phải ôm nhiều nhiệm vụ | `TurnControls` + `.play-log`: người chơi, trạng thái, dice, CTA, tài sản, nhật ký, log | Panel chỉ giữ thông tin/hành động của phase; tách navigation/toast |
| CTA không phản ánh đủ trạng thái | Ngoài ROLLING/OPTIONAL_ACTIONS vẫn có nút “ĐỔ XÚC XẮC” bị disable | Khi MOVING hiển thị kết quả + trạng thái; khi decision chỉ surface quyết định có CTA |
| Tương tác phụ có thể che movement | Tài sản/Nhật ký và tile selection không có guard UI cho busy phases | Đóng/thu gọn context khi roll; ngăn mở sheet phụ lúc movement/resolve |
| Camera chưa tính vùng UI che | Frustum theo aspect, follow zoom cố định 3,2; target luôn tâm quân cờ | Fit theo projected bounds và vị trí overlay; giữ quân/đích ngoài vùng che |
| Tự về overview khá sớm | `Board.tsx` đặt overview sau 850ms ở các phase còn lại | Giữ đích qua decision; chỉ trở về overview theo flow presentation đã thống nhất |
| Destination chưa có highlight riêng | Renderer có ownership bands và nhà; chưa có vòng/viền đích riêng | Highlight tạm thời từ state hiện có, không đổi vị trí/lượt |
| Management sheet chưa phân nhóm | Assets hiện là danh sách phẳng | Gom theo nhóm màu, ghi tiến độ sở hữu; ga/tiện ích có phần riêng |
| Safe area đã có một phần | Root padding có đủ bốn inset, viewport-fit=cover; dialog mới dùng inset-bottom | Tái sử dụng root; kiểm tra lại controls nổi và sheet ở cả bốn cạnh |
| Test layout còn gắn với thiết kế cũ | `v2-browser-check` yêu cầu controls nằm ngoài canvas | Thay assertion bằng occlusion/hit testing, không bỏ kiểm tra board fit |

**Đo baseline mới:** canvas chiếm 59,7% vùng gameplay tại 844×390; các viewport task còn lại là 60,0–63,5%. Tại 568×320 là 53,6%. Cả 8 viewport đã đo không page scroll và không page errors. Đây là tỷ lệ diện tích vùng canvas, không phải tỷ lệ diện tích các ô bàn cờ trên ảnh.

Bằng chứng: [baseline JSON](task1-uiux-baseline.json), [ảnh trước refactor](task1-uiux-before-mobile.png). Chrome mô phỏng mobile, chưa phải Android/iPhone thật.

## 2. Các điểm cần diễn giải đúng

- **85–90%:** dùng làm mục tiêu diện tích game world khả dụng ở trạng thái bình thường. Canvas có thể phủ toàn vùng dưới HUD; overlay vẫn nhỏ. Không đánh đồng canvas rộng hơn với board lớn hơn: camera hiện bị giới hạn chiều cao. Phải đo projected board bounds và so ảnh trước/sau, tránh zoom cắt góc hoặc che token/ô cần tương tác.
- **Wireframe không phải nguồn luật:** giá/thuê/cấp trong ví dụ chỉ minh họa. Lấy dữ liệu và selectors V2 hiện có; không hard-code “Rent 20 Tr”. Tiện ích chưa đổ thuê phải ghi công thức, không hiển thị thuê 0 Tr gây hiểu nhầm.
- **Landmark 81:** hiện là chuỗi tên trong static metadata, không phải raw ID. Task muốn tránh cách hiển thị này; không tự sửa property data sang Chợ Bến Thành. Ở lớp presentation có thể ẩn dòng này, cùng metadata chưa được chấp nhận/không có tên hiển thị; giữ tên tài sản đầy đủ và không render raw ID. Những landmark phù hợp khác tiếp tục lấy từ PropertyDefinition.
- **“Thẻ”:** chỉ mở sheet xem thẻ ra tù đang giữ từ `heldCards` và mô tả sẵn có. Dùng thẻ tiếp tục theo phase/action đã có; không thêm bộ sưu tập, hiệu ứng hay cách dùng mới.
- **OPTIONAL_ACTIONS:** nếu engine còn `extraRoll`, CTA phải tiếp tục là “Đổ thêm”, không đổi thành kết thúc lượt thông thường. Dùng `END_TURN` hiện có, không đổi turn system.
- **Không thêm feature:** trading/auction và thay đổi balance không thuộc Task #1. Task này không giải quyết hạn chế thời lượng ván đã ghi ở review V2.

## 3. Layout đề xuất

HUD gọn ở trên; active player có border/turn indicator rõ, inactive nhẹ hơn. Canvas phủ toàn vùng dưới HUD, bỏ khung nhỏ và cột trái/phải cố định.

Camera controls ◎ / ⛶ nổi ở góc trên phải, mỗi nút 48px, có accessible name và trạng thái selected. Panel hành động gọn ở dưới phải; chuyển sang dice/result/status nhỏ khi rolling/moving. Tài sản / Thẻ / Nhật ký là nhóm controls nổi dưới trái, tách khỏi primary panel. Settings tiếp tục ở HUD, không cần thêm nút More trùng chức năng.

Property context chỉ xuất hiện khi chọn/đáp xuống; ưu tiên surface gọn hoặc bottom sheet trên màn nhỏ. Khi cần mua/trả thuê/đổ thuê thì surface quyết định thay thế context thông thường. Không mở card, full detail và decision đồng thời.

Canvas có thể nằm sau UI nhưng camera phải bố trí token/đích và các tile tương tác ngoài vùng che. Ở màn 568×320, giảm metadata/trang trí UI trước; không co CTA xuống chữ 9px hay touch target dưới 44px.

## 4. Kế hoạch A → E

| Phase | Việc làm theo thứ tự | Tiêu chí chốt |
| --- | --- | --- |
| **A — Layout** | Bỏ `.play-location`; canvas toàn vùng; thu gọn TurnControls; camera icon controls; tách secondary actions; fit camera sơ bộ ngay khi đổi layout | Canvas đạt ít nhất khoảng 85% vùng gameplay khi không có decision; board nhìn lớn hơn qua projected bounds/ảnh; overview đủ bốn góc; controls không che ô cần bấm |
| **B — Context UI** | Context selection/landing; reuse property sheet; phân nhóm assets; sheet thẻ đang giữ; toast log 2–3s | Đóng/mở đúng context, full name/owner/rent/level lấy từ state; toast chỉ xuất hiện sau thay đổi đã commit; nhật ký giữ nguyên lịch sử engine |
| **C — GamePhase UX** | Thể hiện waiting/rolling/moving/resolving/optional; kiểm tra thêm jail/rent/utility/event/debt/winner | Một CTA có ưu tiên rõ trên surface đang hoạt động; không có Roll/End/Buy/Upgrade sai phase; không mất extra roll hay rent dice riêng |
| **D — Camera & Motion** | Hoàn thiện follow với overlay bounds; giữ đích khi resolve; highlight; giảm noise phụ; manual overview/follow và reduced motion | Token/đích không bị panel che; chuyển góc mượt; không làm layout nhảy; không thay engine timing/RNG/position; idle RAF vẫn dừng |
| **E — Responsive & QA** | Typography/full names; touch/safe areas; nội dung sheet scroll riêng; các viewport task; desktop/tablet; fallback; regression | Typecheck/tests/build và UI checks đạt; ảnh trước/sau; engine/data không có thay đổi; báo cáo rồi dừng |

Sau từng phase: chạy kiểm tra vừa đủ cho phần đã đổi, review ảnh và sửa lỗi trước khi sang phase kế tiếp. Camera framing tối thiểu thuộc A để layout mới dùng được; motion/focus chi tiết thuộc D.

## 5. Hợp đồng hiển thị theo phase

| Phase | Surface và hành động |
| --- | --- |
| GAME_START / TURN_START / TURN_END | Chỉ chỉ báo chuyển lượt gọn, không CTA gameplay |
| WAITING_FOR_ROLL | Tên người chơi + Dice + một CTA “Đổ xúc xắc” |
| ROLLING | Dice animation + trạng thái; không CTA thay đổi game; ngăn mở sheet gây che board |
| MOVING | Tổng dice + “Đang di chuyển”; thu gọn panel/navigation; camera follow |
| RESOLVING_TILE | Highlight đích + chỉ báo chờ engine resolve; chưa cho mua/kết thúc lượt |
| PROPERTY_DECISION | Context mua ngắn: tên/giá/thuê, Mua là primary, Bỏ qua secondary; full detail nếu cần |
| OPTIONAL_ACTIONS | “Kết thúc lượt” hoặc “Đổ thêm” đúng state; quản lý tài sản theo selectors hiện có |
| JAIL_DECISION | Reuse các lựa chọn thử đôi/trả phí/dùng thẻ; một hành động nổi bật, các lựa chọn khác secondary |
| UTILITY_ROLL / RENT | Surface riêng; xúc xắc thuê lấy từ rentDice, CTA đổ thuê/trả thuê |
| EVENT | Reuse card + xác nhận; không để Roll/End cạnh tranh |
| LIQUIDATION | Blocking debt surface, đúng debtor; bán/thanh lý theo guard; không che lỗi bằng toast phía sau dialog |
| BANKRUPTCY / GAME_OVER | Reuse blocking notice/winner; không còn CTA của lượt thường |

Ưu tiên surface: mandatory phase > panel người dùng mở > context thụ động > activity toast. Tap một ô của người khác chỉ xem; tap ô không sở hữu không tạo quyền mua ngoài PROPERTY_DECISION. Thông tin/action gắn với playerId hiện tại để không dùng context của lượt trước.

## 6. Files dự kiến

| Files hiện có | Phạm vi sửa |
| --- | --- |
| `src/App.tsx` | Composition HUD/navigation/panel; active indicator; giữ auto-advance timers/game actions |
| `src/components/Board.tsx` | Bỏ sidebar; contextual selection; camera mode policy; overlay layout |
| `src/components/TurnControls.tsx`, `Dice.tsx` | Panel phase-sensitive, dice/result hierarchy; bỏ action phụ |
| `src/components/GameOverlay.tsx` | Reuse Sheet; compact purchase/detail; assets grouping/cards; sticky title/close và CTA nếu sheet dài |
| `src/components/ThreeBoard.tsx` | Presentation framing/selection guards; truyền overlay bounds; giữ raycast/keyboard/cleanup |
| `src/rendering/tabletopScene.ts` | Camera fitting/target offset và destination highlight; không sửa models/world/logic |
| `src/styles.css` | Scope gameplay layout mới; safe area/touch/responsive/contrast; dọn CSS sidebar bị thay thế |
| `src/components/ClassicBoard.tsx` | Đồng bộ fallback controls với layout mới, không trả về sidebar/center panel cũ |
| `scripts/v2-browser-check.mjs`, `scripts/production-smoke.mjs` | Adapt selectors, thêm target viewport/phase/occlusion checks, giữ regression workflows |
| `scripts/graphics-check.mjs` | Chỉ cập nhật nếu shared camera API ảnh hưởng prototype; vẫn giữ demo độc lập |

Components mới dự kiến khi giúp tách trách nhiệm: `PropertyContextCard.tsx`, `SecondaryActions.tsx`, `ActivityToast.tsx`; camera controls có thể giữ nhỏ trong Board. Không tạo thêm global state machine hay event bus. Sheet/Dice/TurnControls/ThreeBoard và các selectors được reuse.

Engine, store semantics, `src/game/data/*`, rules và manifest kinh tế giữ nguyên. Không sửa `tabletopArt.ts` chỉ để đổi art; atlas đã dùng full property name. Nếu cần tách type props khỏi PixiBoard khi bổ sung navigation, chỉ tách type presentation chung, không refactor renderer không liên quan.

## 7. Validation và Definition of Done

**Baseline của lượt review:** 8 viewport mới đo, không page scroll, không page errors. 83 tests/build của V2 là kết quả từ đợt trước; lượt này chưa chạy lại và chưa có refactor UI để xác nhận.

Khi triển khai:

1. Chạy Node 24: `npm run typecheck`, `npm test`, `npm run build`, `npm run design:check`. Repo chưa có lint config; không ghi lint passed.
2. Browser: 844×390, 852×393, 896×414, 915×412, 932×430; thêm 568×320, 667×375, 1024×768 và 1440×900. Kiểm tra 2/3/4 người, tên dài, tiền lớn, jail/bankrupt, portrait↔landscape khi sheet đang mở.
3. Đo canvas share, projected board size và no-page-scroll. Overlay được phép nằm trong canvas; kiểm tra vị trí token/đích, tile hit targets và các điểm bị che thực tế, thay assertion `controlsOutsideCanvas` cũ.
4. Luồng thật: roll→camera→movement→mua/bỏ qua→thuê→đổi lượt. Thêm phase fixtures cho utility dice, jail card, upgrade, multi-debtor liquidation, event chain, bankruptcy/winner; không thêm test hook vào sản phẩm.
5. Rapid taps, đang di chuyển thì tap tài sản/tile, đổi player khi context cũ mở, stale toast, keyboard focus/Escape, dialog errors, manual camera trong follow, reduced motion và context-loss fallback.
6. Bảo toàn công trình/thẻ/ownership/rents; existing engine tests vẫn đạt. Review diff xác nhận không thay engine, economy, board/property data hay turn/dice/movement logic.
7. Kiểm tra safe area bằng emulation/controlled CSS inset và thiết bị thật nếu có; Chrome emulation không xác nhận Safari notch/browser chrome hoặc FPS/nhiệt/pin. Giữ DPR cap, idle pause và cleanup; không thêm animation vô hạn.
8. Chạy production smoke sau build; lưu screenshots waiting/moving/context/management cho mobile và ảnh tablet/desktop. Báo cáo files/components, engine unchanged, viewport/check results và UX còn lại rồi dừng Task #1.

Không có blocker nghiêm trọng cho kế hoạch. Điểm dễ gây regression nhất là camera occlusion, ưu tiên mandatory surfaces và fallback; triển khai nhỏ theo A–E để kiểm chứng từng phần.
