# Task #4 — Review và kế hoạch Visual Gameplay System V2

Ngày: 04/10/2026. Baseline source: commit `2019a79`; bằng chứng visual: `3d-visual-reference.md` và bộ ảnh Task #3.

Trạng thái: **Đã triển khai sau khi người dùng xác nhận.** Kết quả tại `task4-visual-gameplay-implementation-review.md`. Nội dung bên dưới giữ lại kế hoạch đã được duyệt; P0 → kiểm tra/sửa → P1 → kiểm tra/sửa → P2 → regression → visual review đã thực hiện trong cùng lượt.

## 1. Kết luận review

Task khả thi trên Three.js renderer hiện tại; chưa thấy blocker kỹ thuật. Trọng tâm là giúp người chơi phân biệt group, owner, vị trí, lượt, selection và destination. Không cần đổi framework, dựng lại bàn cờ hoặc tăng độ sáng/bão hòa toàn cảnh.

Audit Task #3 đã chỉ ra các vấn đề phù hợp trực tiếp với Task #4:

- Owner strip đặt theo trục world +Z, có thể đè lên group band ở cạnh trên.
- Ring hiện tại dùng màu teal chung; vị trí nhiều quân dựa vào index toàn bộ player, không dựa vào số người cùng ô.
- Selection trong context/detail chưa có cue 3D dùng chung. Context bị xóa khi mở detail, khiến việc thêm outline trực tiếp từ context dễ mất selection.
- Destination dùng line mảnh ở vị trí hiện tại trong các phase resolve, chưa biểu diễn điểm đến ngay khi movement được biết.
- Nhà và khách sạn có thể che tên, quân cờ và ring; số nhà 2/3/4 khó phân biệt ở overview.

Các vấn đề môi trường không liên quan trực tiếp đến thông tin gameplay được giữ ngoài phạm vi. Không sửa scene chỉ vì có thể làm đẹp hơn.

## 2. Phạm vi và những điểm cần diễn giải đúng

| Điểm | Quyết định triển khai |
| --- | --- |
| Bàn cờ hiện tại | Giữ classic 40 ô, thứ tự ô, property data, economy và rule đã hoàn thành; không quay lại specification 36 ô cũ |
| Level | Giữ Lv.0 không nhà, Lv.1–4 tương ứng 1–4 nhà, Lv.5 khách sạn; cải thiện silhouette/bố trí, không đổi số nhà thành một tòa nhà không còn phản ánh luật |
| Ví dụ special trong Task #4 | Chỉ áp dụng ngôn ngữ visual cho các loại ô thực có trên bàn classic; không bổ sung Travel/Travel Fund hoặc phục hồi luật cũ |
| Close property | Đồng bộ selected property với context/detail và world. Giữ overview/follow hiện có; không tự thêm camera mode thứ ba hoặc orbit |
| Group/Player palette | Giữ 8 group và 4 màu player; giải quyết va chạm bằng vị trí, hình dạng, viền và độ tương phản trước |
| Building ownership | Dùng owner flag thống nhất; bỏ việc dùng toàn bộ roof màu player làm dấu owner chính |
| Destination | Suy ra từ movement thật của engine; không đoán từ xúc xắc cũ trong ROLLING hoặc tự đọc lại luật card |
| Animation | State engine là nguồn thật; animation chỉ trình bày, không điều khiển STEP_MOVE hoặc kéo dài turn |
| Graphics preview | Gameplay `/` là nơi kiểm chính. Giữ tương thích `?graphics=1`; không refactor palette/renderer Pixi `?graphics=2` |
| UI V3 | Giữ bố cục, typography và màu UI; chỉ sửa tích hợp selection và dữ liệu visual cần thiết |

## 3. Ngôn ngữ visual sẽ dùng

| Thông tin | Biểu diễn | Quy tắc ưu tiên |
| --- | --- | --- |
| Group | Band màu hiện có trong atlas | Luôn giữ màu và hướng đúng theo cạnh bàn, không đổi theo owner/level |
| Owner | Một cờ 3D nhỏ mang màu player | Có trên LAND, RAILROAD, UTILITY đã sở hữu; không có trên ô chưa sở hữu |
| Development | 1–4 nhà hoặc khách sạn | Kiến trúc cream/teal/terracotta; đọc được số lượng và silhouette |
| Player position/identity | Quân cờ + ring màu player | Mọi quân có ring nhẹ; active ring rõ hơn |
| Current turn | Ring/halo active và một pulse hữu hạn | Đồng bộ HUD theo current player; không pulse vô hạn |
| Selected property | Outline mảnh, tĩnh, warm cream/subtle gold | Nhẹ hơn destination; chung property ID với UI |
| Destination | Target/corner brackets gold rõ ràng | Hiển thị trước bước di chuyển đầu tiên khi movement đã biết |
| Arrival | Marker nhấn ngắn rồi fade | Không giữ hiệu ứng của lượt trước |
| Special tile | Icon/marking và model phù hợp hiện có | Không dùng group band giả hoặc owner cue trên ô không sở hữu được |

Khi selected trùng destination, destination là cue nổi bật. Selection ID vẫn đúng, nhưng không chồng hai hiệu ứng gây nhiễu. CTA gold thuộc UI; target gold trong world phải nhận diện bằng hình dạng và vị trí.

## 4. Thiết kế tích hợp trước khi code

### Selection: một nguồn ID trong presentation

Đưa selection controller lên `App`, dùng chung cho `Board`, `ThreeBoard` và `GameOverlay`. Không để `context.id` và `panel.id` trở thành hai bản sao tự cập nhật riêng.

- Click ô, chọn property từ assets hoặc mở detail đều đi qua cùng một thao tác chọn property.
- Context → detail giữ ID; chỉ đổi cách hiển thị UI, không xóa selection ngay trước khi mở sheet.
- Close, đổi người chơi, bắt đầu lượt/match mới và chuyển phase không cho inspect phải có quy tắc reset rõ ràng.
- Với purchase/resolve bắt buộc, property đang xử lý suy ra từ game state. UI và renderer nhận cùng effective focus ID; không cho selection thủ công thay quyết định của engine.
- Selection tài sản để trả nợ là mục đích riêng: chỉ đồng bộ world nếu UI đang thực sự xem property đó, không thay debt target hoặc destination.
- Giữ read-only inspection guards và hành vi camera/timer hiện tại; không mở thao tác gameplay trái phase.

### Destination: dẫn xuất từ engine

Khi `phase === MOVING` và `game.movement` tồn tại, tính index bằng modulo dương của:

`player.position + movement.direction * movement.remaining` với độ dài `BOARD`.

Index này giữ nguyên khi STEP_MOVE cập nhật vị trí và remaining. Bao phủ đi qua Start, lùi và movement dài hơn một vòng. Trong ROLLING, kết quả mới chưa có: không lấy `game.dice` của lượt trước làm target. Marker xuất hiện ngay khi COMPLETE_ROLL tạo movement, trước STEP_MOVE kế tiếp; không thay timer engine để phục vụ animation.

Renderer được giữ thông tin arrival ngắn hạn cho mục đích fade, nhưng không lưu thêm logical movement. Xóa/đổi hiệu ứng khi actor thay đổi, có movement mới, reset match, teleport/jail, unmount hoặc event chain chuyển mục tiêu. Utility rent dice không tạo movement marker.

### Tile layout và formation

Tạo helper presentation cho local frame của mỗi cạnh/corner, dựa vào geometry hiện có; không đổi kích thước hoặc tọa độ bàn. Phân vùng group band, text, building, owner flag và pawn lane. Cờ và model quay theo cạnh thay vì luôn lệch về world +Z.

Formation theo occupancy thực tế: 1 ở giữa vùng quân; 2 cạnh nhau; 3 tam giác; 4 lưới 2×2. Thứ tự slot ổn định theo thứ tự player trong match/ID, không đảo theo current turn. Loại player bankrupt khỏi occupancy đang chơi. Khi người đến/rời ô, retarget từ vị trí visual hiện tại và animate nhẹ cả những quân cần đổi slot; không restart animation mỗi frame.

Ưu tiên giữ quân, flag và group band nhìn thấy. Điều chỉnh footprint, chiều cao và placement của model trước khi cân nhắc thay camera. World-space bounds chưa đủ chứng minh không che nhau: phải review screen-space ở cả bốn cạnh, góc và hai camera mode, đặc biệt khách sạn + 4 quân. Không phóng quân quá lớn để bù lỗi bố trí.

### Resource và render lifecycle

Giữ render-on-demand, DPR cap và renderer settings hiện tại. Reuse geometry/material; owner flags dùng pool hoặc instancing khi có lợi. Update các property thực sự đổi owner/level, tránh dựng lại toàn bộ houses chỉ vì một property đổi.

Ring tối đa theo số player; selection/destination/arrival có số mesh hữu hạn. Không thêm dynamic lights, postprocessing, shader phức tạp, particle system hoặc nhiều lớp transparent. Sau pulse/fade và camera/movement settle, scene trở về idle. Dispose đúng ownership của tài nguyên; không dispose shared geometry khi chỉ xóa một node.

## 5. Kế hoạch thực hiện theo phase

### A — Khóa baseline và chuẩn bị fixture

1. Ghi Git status, checksum source engine/rules/data/store và ảnh baseline cùng viewport/state.
2. Chạy typecheck, tests, build và các check hiện có để phân biệt lỗi baseline với regression. Ghi rõ lint script hiện chưa có.
3. Chuẩn bị fixture từ game state hợp lệ bằng harness hiện có, không thêm debug action làm thay đổi gameplay production.
4. Chốt semantic constants, tile layout helper và selection integration trước khi thêm hiệu ứng.

### P0 — Owner, player, selection và destination

1. Giữ group atlas, thay owner strip bằng cờ 3D cho toàn bộ property sở hữu được; đặt cờ nhất quán theo cạnh và ngoài vùng text/model/quân.
2. Tạo ring màu từng player, active rõ hơn và pulse turn-start một lần. Kiểm tra Mint trên nền xanh bằng viền/shadow/shape trước.
3. Áp dụng formation 1/2/3/4 theo occupancy thật; giữ chuyển vị trí ổn định, không che active pawn.
4. Tích hợp một selectedPropertyId, outline mềm trong world và context/detail/assets đồng bộ.
5. Thay line destination bằng target gold có độ dày nhìn thấy ở mobile. Dẫn xuất target từ movement, xử lý arrival/clear và event/jail đúng.
6. Kiểm tra cả bốn cạnh/corner, mọi màu player, overview/follow, selected khác/trùng destination, owner đổi/mất và formation có người đến/rời.

**Gate P0:** owner/group không lẫn, mọi quân và active player phân biệt được, không drift selection, destination đúng timing/index, không có stale cue. Sửa toàn bộ lỗi P0 trước khi đi P1.

### P1 — Development và khả năng đọc ở hai camera mode

1. Điều chỉnh các primitive hiện có thành bố trí/silhouette phát triển dễ đọc hơn, vẫn thể hiện đúng 1–4 nhà và khách sạn.
2. Chuyển roof khỏi full player tint sang architectural palette; owner vẫn do cờ quyết định ở mọi level. Phân biệt cờ owner với cờ trang trí của khách sạn nếu giữ chi tiết đó.
3. Giới hạn footprint/height và vị trí để tránh che pawn/ring/group/text; ưu tiên ca khách sạn đã được audit phát hiện che quân.
4. Overview ưu tiên vị trí, owner, group, development và destination. Follow ưu tiên chuyển động/arrival/inspection. Giữ hướng và framing camera; chỉ cân nhắc visibility assist nhẹ khi có ảnh chứng minh cần.
5. Review railroad, utilities, jail và các special hiện có để icon/model nhận diện rõ mà không tạo group/owner giả.
6. Kiểm tra mức 0–5, bốn cạnh và các tổ hợp high-level + owner flag + nhiều quân; giải quyết collision bằng placement/shape trước palette.

**Gate P1:** số nhà đúng với luật, cờ vẫn thấy ở level cao, không che active pawn nghiêm trọng, group/special nhận diện được trong overview/follow. Sửa lỗi trước khi đi P2.

### P2 — Movement, arrival và polish hữu hạn

1. Giữ tile-by-tile movement; chỉnh easing/bounce vừa phải, formation retarget ổn định. Teleport jail không giả thành đi bộ qua nhiều ô.
2. Đồng bộ destination với chuyển động camera hiện có; marker phải ở điểm đến, không chạy theo current pawn.
3. Arrival nhấn ngắn rồi fade, turn-start pulse hữu hạn và transition nhẹ; reduced-motion snap/tối giản đúng.
4. Chỉ thêm step ripple nếu thật sự cải thiện readability trong review; đây là tùy chọn, không mặc định thêm particle/effect.
5. Kiểm tra không tăng độ trễ thao tác, không animation loop khi idle và không cue của lượt cũ.

Sau P2 chạy toàn bộ regression và visual review; tiếp tục sửa nếu thông tin gameplay vẫn mơ hồ.

## 6. Files dự kiến

| File | Mục đích |
| --- | --- |
| `src/App.tsx` | Selection controller chung; truyền effective focus ID, giữ engine handlers/timers |
| `src/components/Board.tsx` | Context/inspection dùng shared selection; giữ camera mode và phase guards |
| `src/components/GameOverlay.tsx` | Detail/assets dùng shared selection callback, tránh panel/context giữ hai ID độc lập |
| `src/components/ThreeBoard.tsx` | Truyền selection vào scene qua update, không remount renderer khi selection đổi |
| `src/rendering/tabletopScene.ts` | Owner flags, rings, formation, markers, motion, update/disposal và render scheduling |
| `src/rendering/tabletopArt.ts` | Primitive cờ/marker và cải thiện nhà/hotel từ factory hiện có |
| `src/visual/tokens.ts` | Semantic visual tuning tham chiếu palette hiện có; không duplicate màu player/group |
| `src/rendering/gameplayVisuals.ts` — mới, dự kiến | Pure helpers cho destination, occupancy/slots và visual semantics |
| `src/rendering/tileVisualLayout.ts` — mới, dự kiến | Local frame và placement zones theo cạnh/corner |
| Tests mới trong cấu trúc test hiện có | Invariant destination/formation/layout thực sự cần kiểm; không test chỉ lặp lại implementation |
| `scripts/task4-visual-check.mjs` — mới, dự kiến | Browser fixtures, viewport/interaction checks, capture và resource observations |
| `src/components/GraphicsPreview.tsx`, graphics check scripts — nếu cần | Giữ preview Three tương thích với selection props mới; không mở rộng Pixi scope |
| `docs/task4-*.png`, `docs/task4-visual-checks.json` — mới | Bằng chứng before/after và kết quả browser check |
| `docs/task4-visual-gameplay-implementation-review.md` — mới | Báo cáo A–L sau triển khai và actual test results |

Danh sách là phạm vi dự kiến, không yêu cầu tạo helper hoặc sửa file nếu không cần. `cameraFraming.ts`, atlas, CSS và HUD chỉ đụng tới nếu có lỗi tích hợp/readability cụ thể, với diff nhỏ và bằng chứng; không redesign. Engine/rules/data/store là vùng bảo vệ. Giữ nguyên báo cáo và ảnh audit Task #3 để dùng làm baseline lịch sử.

## 7. Validation plan

### Automated checks

- `npm run typecheck`, `npm test`, `npm run build`.
- `npm run design:check`, `npm run game:check`, `npm run production:check`.
- `npm run graphics:check`, `npm run graphics:check:2d` để kiểm tra shared renderer và preview compatibility.
- `node scripts/task4-visual-check.mjs` sau khi tạo harness.
- **Lint:** repository chưa có lint script/tooling. Báo cáo unavailable; không khai kết quả pass hoặc thêm lint stack ngoài scope.
- So sánh checksum protected files trước/sau; nếu cần thay engine để chữa visual, xem lại hướng tích hợp trước, không âm thầm đổi luật.

Tests helper cần kiểm: modulo forward/backward/wrap/multiple laps; target ổn định qua STEP_MOVE; không target khi movement không tồn tại; slot ổn định và đủ cho occupancy 1–4; placement đúng cạnh, bounds và vùng band/text. Tests/browser phải bao phủ lifecycle và state transitions, không chỉ đếm mesh.

### Viewports và screenshot

Mobile landscape bắt buộc: **844×390, 852×393, 896×414, 915×412, 932×430**. Thêm guard 568×320 và 667×375, portrait fallback, tablet/desktop theo harness hiện có. Ghi CSS viewport, DPR và renderer DPR thực dùng. Browser emulation không được trình bày như kiểm tra hiệu năng Android/iPhone thật.

Capture và xem trực tiếp đủ các trạng thái:

| Mã | Trạng thái |
| --- | --- |
| A | Overview với 4 players |
| B | Follow active player |
| C | Property đã sở hữu: group band + owner flag + building |
| D | Property chưa sở hữu, không có owner flag |
| E | Selected world outline khớp property context/detail |
| F | Gold destination trước/suốt movement và lúc arrival |
| G | Ít nhất 3 quân cùng ô; kiểm riêng occupancy 1/2/3/4 |
| H | High-level building/hotel + flag + pawn vẫn đọc được |
| I | Special tiles, gồm loại sở hữu được và loại không sở hữu được |

Kiểm màu của cả 4 players; bốn cạnh/corner; selected khác/trùng destination; overview/follow. Occupancy 1 được dựng trong match 2–4 players với những người còn lại ở ô khác, không thêm chế độ một người. Dùng screenshot/projection để đánh giá che khuất, không chỉ dựa vào bounds 3D hoặc DOM labels.

### Gameplay và lifecycle regression

Start → roll → movement → resolve → buy → owner flag update → end turn → next player; cùng ô nhiều người; upgrade 1–4 nhà/hotel; rent/event/jail/utility; overview/follow và inspect từ board/assets/detail.

Thêm các ca: mua/bán/liquidate/bankruptcy làm đổi/mất flag; level thay đổi không để model cũ; player rời ô làm formation cập nhật; selection đổi/close/new turn/new match; movement event forward/backward/qua Start; jail teleport, failed jail roll, extra turn/doubles và utility rent roll không tạo target sai. Engine vẫn reject invalid actions; visual không mở đường bypass guards.

### Performance và resource checks

So draw calls/triangles/frame timing trước/sau với cùng fixture/viewport; ghi thay đổi hợp lý do flags/rings, không đặt kết luận chỉ từ một FPS snapshot. Kiểm render-on-demand về idle sau camera, movement và effect; không pulse vô hạn.

Lặp 10–20 chu kỳ selection/upgrade/ownership/reset và mount/unmount sau warm-up; theo dõi canvas/listeners/timers và `renderer.info.memory` để phát hiện tăng không giới hạn. Cache material/geometry và dispose resources đúng vòng đời. Không tuyên bố battery/thermal/thiết bị thật khi chỉ chạy browser emulation.

## 8. Điều kiện hoàn thành khi triển khai

P0 + P1 + P2 đạt gate; owner/group/current/selection/destination đọc rõ hơn baseline ở mobile; không che quân nghiêm trọng ở fixture bắt buộc; không stale effects hoặc drift UI/world; nhà/hotel vẫn đúng luật; camera và UI V3 không bị redesign; gameplay regression/typecheck/tests/build thành công; mọi check thất bại phải được sửa hoặc báo đúng limitation thực tế.

Báo cáo cuối theo A–L của task: implementation, ownership, players, selection/destination, buildings, overview/follow, motion, files, actual tests (gồm lint unavailable), screenshots, performance và vấn đề thực còn lại. Before/after phải dùng bằng chứng cùng điều kiện. Nếu người chơi vẫn khó phân biệt các channel chính, tiếp tục sửa trước khi tuyên bố hoàn thành.

## 9. Kết quả của lượt review này

Đã đọc Task #4, đối chiếu audit Task #3 và xác định điểm tích hợp trong source. Chỉ bổ sung tài liệu kế hoạch này; chưa sửa production, chưa chạy lại test/build cho một implementation chưa tồn tại, chưa commit/push.
