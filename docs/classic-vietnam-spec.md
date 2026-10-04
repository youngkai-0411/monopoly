# Tỷ Phú Việt Nam V2 — thiết kế bàn 40 ô và kinh tế

Ngày: 04/10/2026. Trạng thái: **V2 đã triển khai và kích hoạt trong game; xem báo cáo validation**.

Nguồn dữ liệu duy nhất của bản thiết kế là [classic-vietnam-v2.json](classic-vietnam-v2.json). Các bảng bên dưới trình bày dữ liệu đó để review. Kế hoạch triển khai ở [classic-migration-plan.md](classic-migration-plan.md).

## Phạm vi và nguồn tham chiếu

Mục tiêu: cấu trúc Monopoly Classic, tên và cảnh quan Việt Nam, chơi local 2–4 người, ưu tiên điện thoại ngang. Dùng [hướng dẫn Hasbro C1009](https://instructions.hasbro.com/api/download/C1009_en-nz_monopoly-classic-game.pdf) làm mốc cố định để tránh trộn luật giữa các phiên bản.

Cấu trúc 40 ô gồm 22 đất + 4 ga + 2 tiện ích + 3 Cơ Hội + 3 Cuộc Sống + 2 thuế + 4 góc. Tổng cộng 28 tài sản sở hữu được và 12 ô không sở hữu được. Hai nhóm có 2 đất, sáu nhóm có 3 đất.

Đây là bản **lấy cảm hứng từ Classic**, không tuyên bố khớp toàn bộ luật Classic: đấu giá, thế chấp, giao dịch và chuyển giao tài sản cho chủ nợ chưa thuộc phạm vi hiện tại. Không tự thêm online, tài khoản, bot, Quick Mode, shop hay kỹ năng nhân vật.

## Quyết định dữ liệu

- Giữ ID và landmark của 22 địa danh còn lại.
- Đưa Phú Quốc ra khỏi danh sách đất V2 để Miền Tây còn 2 ô. Đây là lựa chọn bố cục, không đánh giá giá trị địa danh; dữ liệu V1 vẫn còn trong repository.
- Thêm Ga Sài Gòn, Ga Nha Trang, Ga Đà Nẵng và Ga Hà Nội. Ga và đất cùng thành phố là hai tài sản độc lập, có ID và cách tính thuê riêng.
- Điện lực và Cấp nước thuộc nhóm tiện ích, không thuộc nhóm màu đất.
- Thay Tạm Giữ bằng Nhà tù/Thăm tù; thêm Đi tù riêng. Bỏ Du lịch và Quỹ du lịch.
- Giữ tên hai bộ thẻ Cơ Hội/Cuộc Sống; cơ chế và nội dung V2 được soạn ở bước 4.
- Các chỉ số trong tài liệu và JSON là **0-based**. UI có thể hiện số ô 1–40, không chuyển số UI thành index một cách ngầm định.

## Thứ tự vòng bàn

Bắt đầu ở góc dưới phải, đi theo cạnh dưới → trái → trên → phải. Bốn góc ở 0, 10, 20, 30. Ô cuối 39 nối về 0. Cột cuối là giá mua đối với tài sản, mức nộp đối với thuế; đơn vị Tr.

| Index | Tên ô | Loại | Màu nhóm | Giá / Thuế |
| --- | --- | --- | --- | --- |
| 0 | Bắt đầu | Bắt đầu | — | — |
| 1 | Cà Mau | Đất | Nâu | 60 |
| 2 | Cuộc Sống | Rút Cuộc Sống | — | — |
| 3 | Cần Thơ | Đất | Nâu | 60 |
| 4 | Thuế thu nhập | Thuế | — | 200 |
| 5 | Ga Sài Gòn | Ga | — | 200 |
| 6 | Bình Thuận | Đất | Xanh nhạt | 100 |
| 7 | Cơ Hội | Rút Cơ Hội | — | — |
| 8 | Vũng Tàu | Đất | Xanh nhạt | 100 |
| 9 | Hồ Chí Minh | Đất | Xanh nhạt | 120 |
| 10 | Nhà tù / Thăm tù | Nhà tù / Thăm tù | — | — |
| 11 | Buôn Ma Thuột | Đất | Hồng | 140 |
| 12 | Công ty Điện lực | Tiện ích | — | 150 |
| 13 | Gia Lai | Đất | Hồng | 140 |
| 14 | Đà Lạt | Đất | Hồng | 160 |
| 15 | Ga Nha Trang | Ga | — | 200 |
| 16 | Nha Trang | Đất | Cam | 180 |
| 17 | Cuộc Sống | Rút Cuộc Sống | — | — |
| 18 | Quy Nhơn | Đất | Cam | 180 |
| 19 | Quảng Ngãi | Đất | Cam | 200 |
| 20 | Nghỉ ngơi | Nghỉ ngơi | — | — |
| 21 | Đà Nẵng | Đất | Đỏ | 220 |
| 22 | Cơ Hội | Rút Cơ Hội | — | — |
| 23 | Hội An | Đất | Đỏ | 220 |
| 24 | Huế | Đất | Đỏ | 240 |
| 25 | Ga Đà Nẵng | Ga | — | 200 |
| 26 | Quảng Bình | Đất | Vàng | 260 |
| 27 | Hà Tĩnh | Đất | Vàng | 260 |
| 28 | Công ty Cấp nước | Tiện ích | — | 150 |
| 29 | Nghệ An | Đất | Vàng | 280 |
| 30 | Đi tù | Đi tù | — | — |
| 31 | Thanh Hóa | Đất | Xanh lá | 300 |
| 32 | Ninh Bình | Đất | Xanh lá | 300 |
| 33 | Cuộc Sống | Rút Cuộc Sống | — | — |
| 34 | Lào Cai | Đất | Xanh lá | 320 |
| 35 | Ga Hà Nội | Ga | — | 200 |
| 36 | Cơ Hội | Rút Cơ Hội | — | — |
| 37 | Hải Phòng | Đất | Xanh đậm | 350 |
| 38 | Thuế xa xỉ | Thuế | — | 100 |
| 39 | Hà Nội | Đất | Xanh đậm | 400 |

## Nhóm màu

| Nhóm | Màu | Các đất |
| --- | --- | --- |
| Miền Tây | Nâu (#8B5A2B) | Cà Mau, Cần Thơ |
| Phương Nam | Xanh nhạt (#87CEEB) | Bình Thuận, Vũng Tàu, Hồ Chí Minh |
| Cao Nguyên | Hồng (#D95AA5) | Buôn Ma Thuột, Gia Lai, Đà Lạt |
| Duyên Hải | Cam (#F59E0B) | Nha Trang, Quy Nhơn, Quảng Ngãi |
| Di Sản | Đỏ (#DC2626) | Đà Nẵng, Hội An, Huế |
| Miền Trung Bắc | Vàng (#FACC15) | Quảng Bình, Hà Tĩnh, Nghệ An |
| Miền Bắc | Xanh lá (#16A34A) | Thanh Hóa, Ninh Bình, Lào Cai |
| Đô Thị | Xanh đậm (#1D4ED8) | Hải Phòng, Hà Nội |

Màu là nhận diện nhóm, không là nguồn thông tin duy nhất: sheet và phần chọn ô cần hiện tên nhóm. Không dùng độ tương phản của mã màu để quyết định màu chữ mặc định.

## Bảng kinh tế khởi điểm

Toàn bộ số tiền là số nguyên, đơn vị Tr. Quy ước 1 đơn vị tiền tham chiếu = 1 Tr trong game, không phải mô phỏng giá thị trường Việt Nam.

| Khoản | V2 |
| --- | --- |
| Tiền khởi đầu | 1.500 Tr/người |
| Qua hoặc đến Bắt đầu bằng di chuyển hợp lệ | 200 Tr, không cộng hai lần |
| Thuế thu nhập / Thuế xa xỉ | 200 / 100 Tr |
| Phí ra tù | 50 Tr |
| Giá một ga / một tiện ích | 200 / 150 Tr |
| Thuê ga khi cùng chủ có 1 / 2 / 3 / 4 ga | 25 / 50 / 100 / 200 Tr |
| Thuê tiện ích khi chủ có 1 / 2 tiện ích | 4× / 10× một lần đổ mới dành riêng tính thuê |
| Thuê đất trống đủ nhóm | 2× thuê đất trống |
| Ngân hàng công trình | 32 nhà, 12 khách sạn |
| Bán lại công trình | 50% giá xây, có kiểm tra xây/bán đều |

Đổ xúc xắc tính thuê tiện ích không di chuyển quân, không tạo lượt đổ đôi và không nhận tiền Bắt đầu. Chỉ engine được thực hiện phép đổ này, qua RNG được inject.

### Thuê đất theo mức công trình

Các mức là 0 = đất trống; 1–4 = số nhà; 5 = khách sạn. Giá mỗi lần xây nhà và giá đổi 4 nhà thành khách sạn bằng cột chi phí xây. Khách sạn không là công trình đặt thêm bên cạnh 4 nhà.

Bảng đầy đủ dưới đây là **baseline số liệu do project chọn cho V2**, dùng thang kinh tế kiểu Classic. Hướng dẫn tham chiếu không cung cấp trọn 22 thẻ đất; không coi bảng này là bản sao đã kiểm chứng của toàn bộ thẻ Hasbro. Playtest gom nhóm đạt 30/30 seed kết thúc; stress mua mọi tài sản chỉ kết thúc 19/30 trong giới hạn mô phỏng. Chưa có kết luận về thời lượng ván người thật. Giá/thuê vẫn giữ baseline; bộ thẻ không bị chỉnh để ép winner. Tiền thuê được tra bảng theo từng đất; bỏ công thức multiplier chung 1/3/5/8 của V1.

| Đất | Giá mua | Chi phí xây | Trống | 1 nhà | 2 nhà | 3 nhà | 4 nhà | Khách sạn |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Cà Mau | 60 | 50 | 2 | 10 | 30 | 90 | 160 | 250 |
| Cần Thơ | 60 | 50 | 4 | 20 | 60 | 180 | 320 | 450 |
| Bình Thuận | 100 | 50 | 6 | 30 | 90 | 270 | 400 | 550 |
| Vũng Tàu | 100 | 50 | 6 | 30 | 90 | 270 | 400 | 550 |
| Hồ Chí Minh | 120 | 50 | 8 | 40 | 100 | 300 | 450 | 600 |
| Buôn Ma Thuột | 140 | 100 | 10 | 50 | 150 | 450 | 625 | 750 |
| Gia Lai | 140 | 100 | 10 | 50 | 150 | 450 | 625 | 750 |
| Đà Lạt | 160 | 100 | 12 | 60 | 180 | 500 | 700 | 900 |
| Nha Trang | 180 | 100 | 14 | 70 | 200 | 550 | 750 | 950 |
| Quy Nhơn | 180 | 100 | 14 | 70 | 200 | 550 | 750 | 950 |
| Quảng Ngãi | 200 | 100 | 16 | 80 | 220 | 600 | 800 | 1000 |
| Đà Nẵng | 220 | 150 | 18 | 90 | 250 | 700 | 875 | 1050 |
| Hội An | 220 | 150 | 18 | 90 | 250 | 700 | 875 | 1050 |
| Huế | 240 | 150 | 20 | 100 | 300 | 750 | 925 | 1100 |
| Quảng Bình | 260 | 150 | 22 | 110 | 330 | 800 | 975 | 1150 |
| Hà Tĩnh | 260 | 150 | 22 | 110 | 330 | 800 | 975 | 1150 |
| Nghệ An | 280 | 150 | 24 | 120 | 360 | 850 | 1025 | 1200 |
| Thanh Hóa | 300 | 200 | 26 | 130 | 390 | 900 | 1100 | 1275 |
| Ninh Bình | 300 | 200 | 26 | 130 | 390 | 900 | 1100 | 1275 |
| Lào Cai | 320 | 200 | 28 | 150 | 450 | 1000 | 1200 | 1400 |
| Hải Phòng | 350 | 200 | 35 | 175 | 500 | 1100 | 1300 | 1500 |
| Hà Nội | 400 | 200 | 50 | 200 | 600 | 1400 | 1700 | 2000 |

Quyền xây: đủ nhóm màu, đủ tiền, tuân thủ xây đều và còn công trình trong ngân hàng. Không xây trên ga/tiện ích. Bán công trình cũng phải giữ cân bằng nhóm. Khi thiếu nhà để hạ khách sạn, engine cần xử lý bán cả cụm công trình theo đặc tả bước 3; không tạo công trình vượt tồn kho.

## Hình học và camera

Mỗi cạnh gồm 9 ô thường nằm giữa hai góc. Các ô thường có cùng kích thước 1 × 1,6 world units, xoay theo cạnh; góc vuông 1,6 × 1,6. Tổng cạnh 9 × 1 + 2 × 1,6 = 12,2. Có 11 vị trí trên mỗi cạnh nếu đếm cả hai góc, **không phải lưới 11×11 gồm ô bằng nhau**.

Đây là tỉ lệ hình học đề xuất cho đồ họa V2. Bốn góc phải là ô đặc biệt; không để một tài sản rơi vào góc như Thanh Hóa trong prototype V1. Camera overview fit toàn bộ mép bàn và công trình; follow giữ góc nhìn, pan/zoom mềm khi quân di chuyển. Thời lượng camera là lớp trình bày, không điều khiển luật hay lượt.

## Điểm khác Classic được giữ rõ ràng

Trong phạm vi gần Classic hiện tại: bỏ qua mua chưa mở đấu giá; giữ thanh lý kiểu V1 nhưng cập nhật giá trị cho ba loại tài sản và công trình; xây trong lượt/pha hợp lệ thay vì mọi lúc; thuê được engine nhắc tự động; bộ bài draw/discard có xáo lại. Khi ngân hàng hết công trình, chặn mua; đấu giá công trình cuối cùng thuộc phần mở rộng.

Các thay đổi trên phải được ghi trong màn hình luật khi V2 được tích hợp. Thanh lý không thể gọi là thế chấp; xử lý tài sản lúc phá sản chưa thể gọi là cơ chế chuyển giao Classic.

Đã bỏ Traffic/Coffee/Insurance trong V2; đủ 32 thẻ thay thế đã triển khai trong data/cards.ts. Có thẻ ra tù của mỗi bộ, di chuyển đến ga/tiện ích/đất cụ thể, sửa chữa theo công trình. Những thẻ này phải xử lý đúng điểm đến và ngữ cảnh thuê. Không tái dùng nguyên ID thẻ V1 khi ý nghĩa đã đổi.

## Tương thích và điều kiện hoàn tất bước 1

Bước 1 đã hoàn tất ở mức thiết kế. Sau khi người dùng yêu cầu triển khai toàn bộ, game và các prototype đã chuyển sang 40 ô. JSON trong docs được các module dữ liệu/rules runtime import trực tiếp, không sao chép bảng kinh tế sang JSX. Phiên chơi V1 không tự chuyển index/owner/level/card sang V2; phải bắt đầu ván mới.

Kiểm tra bằng `npm run design:check`: đủ 40 ô, thứ tự loại ô đúng mốc tham chiếu, 28 tài sản duy nhất, phân bố 22/4/2, 8 nhóm đúng số lượng, vị trí góc/ga/tiện ích/thẻ/thuế, bảng giá/thuê hợp lệ, hình học khép kín và các bảng tài liệu không lệch JSON. Kiểm tra này không chứng minh engine V2 đã chạy hay kinh tế đã cân bằng.
