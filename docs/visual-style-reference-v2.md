# Màu sắc và typography — Tỷ Phú Việt Nam

Cập nhật: 04/10/2026. Phạm vi: giao diện gameplay V2 sau Task #1 và bàn cờ Three.js đang dùng ở trang chính. Đây là bản ghi lại implementation hiện tại, chưa phải bảng token thiết kế đã được chuẩn hóa. Các prototype cũ `?graphics=1`, `?graphics=2` và theme tối cũ không được dùng làm bảng màu chính.

## 1. Định hướng thị giác hiện tại

Nền xanh ngọc nhạt, bảng thông tin màu kem, chữ xanh đậm và nút hành động vàng. Bàn cờ dùng cảnh low-poly với cỏ xanh, đá/beige, gỗ nâu và mái đình xanh ngọc. Màu nhóm đất và màu người chơi là hai hệ màu riêng.

## 2. Màu giao diện

| Vai trò | HEX hiện tại | Vị trí sử dụng |
| --- | --- | --- |
| Nền chính | `#B4DED7` | Root gameplay, nền renderer 3D |
| Nền bảng/card | `#FFF9E9` | HUD đang tới lượt, dialog, header bottom sheet |
| Nền phụ | `#EDF2E4` | Danh sách tài sản, cấp thuê, thẻ đang giữ |
| Nền nút phụ | `#EAF0DF` | Đóng, bỏ qua và thao tác phụ |
| Nền ô nhập | `#FFFDF5` | Tên người chơi |
| Nền HUD chưa tới lượt | `#E6EEDC` ở khoảng 70% opacity | Player chip không active |
| Viền chung | `#A9C5B5` | Biến CSS `--line` |
| Viền bảng thao tác | `#B5C8AD` | Action panel, property context |
| Viền dialog | `#C4D2BA` | Bottom sheet / modal |
| Viền nút phụ | `#B5C4AA` | Nút phụ và chọn số người chơi |
| Vàng nhấn chung | `#EDB944` | Biến CSS `--gold`, focus outline |
| Nút chính | `#FFDB7D` → `#EDB435` | Gradient `.primary-button` |
| Nút đổ xúc xắc | `#FFD96F` → `#F0B938` | Gradient `.roll-button` |
| Camera được chọn | `#285D59` | Nền nút camera active |
| Nền lựa chọn active | `#FFF0BD` | Chọn số người chơi |
| Nền báo lỗi trong sheet | `#FFE5D0` | `.sheet-error`, viền `#DBAD8B` |
| Nền toast lỗi | `#702F39` | `.error-toast`, viền `#F18E9F` |
| Nền chiến thắng | `#FFF0AD` → `#E1ECD1` | Radial gradient `.winner-dialog` |

Các bảng nổi dùng màu kem với alpha: camera/toast khoảng 93%, action panel 94%, nút điều hướng 91%, property context 96%. Khi bàn cờ đang bận, action panel dùng khoảng 80%. Backdrop dialog là `#183E49` ở khoảng 46% opacity. Vì vậy màu nhìn thấy còn phụ thuộc cảnh phía dưới.

## 3. Màu chữ

| Vai trò | HEX hiện tại | Ví dụ |
| --- | --- | --- |
| Chữ chính | `#254B4C` | Tên người chơi, tiêu đề sheet, số tiền |
| Chữ nội dung phụ | `#48675E` | Mô tả tài sản, metadata, nội dung sự kiện |
| Chữ trên nút/icon phụ | `#315C55` / `#335E54` | Camera, điều hướng, nút phụ |
| Chữ tiền trong HUD | `#416B64` | Số dư người chơi |
| Chữ trạng thái | `#426B5C` | Nhãn phase |
| Chữ nhãn nhỏ | `#4C7165` / `#486B63` | Nhãn lượt, nhãn tổng xúc xắc |
| Chữ nút chính | `#382800` | Mua tài sản, xác nhận |
| Chữ nút đổ xúc xắc | `#3B2A00` | Roll |
| Chữ camera active | `#FFF9E9` | Icon trên nền xanh đậm |
| Chữ hành động nguy hiểm | `#A34535` | `.danger` |
| Chữ lỗi trong sheet | `#973F31` | `.sheet-error` |
| Chữ toast lỗi | `#FFFFFF` | `.error-toast` |
| Chữ tên ô trên bàn cờ | `#243F42` | Texture tên địa danh |
| Chữ giá trên bàn cờ | `#557167` | Texture giá tài sản |

Các biến thể còn dùng: mô tả setup `#45685C`, ngày/nhãn log `#648071`, chỉ báo tới lượt `#B17A22`, nút xem chi tiết `#265D55`.

## 4. Font và cỡ chữ

UI dùng `font-family: "Segoe UI", Arial, sans-serif`. Dự án chưa khai báo `@font-face`, chưa tải webfont hoặc chứa file font riêng. Trình duyệt chọn font có sẵn theo thứ tự trên nên font thực tế có thể khác giữa Windows, Android và iPhone. Emoji cũng phụ thuộc hệ điều hành.

| Thành phần | Font / cỡ hiện tại | Độ đậm |
| --- | --- | --- |
| Tiêu đề màn hình tạo ván | Font UI, 34px; landscape nhỏ 28px/24px | 700 |
| Tiêu đề bottom sheet | Font UI, 20px | 700 |
| Tên tài sản trong sheet | Font UI, 18px | 700 |
| Tên tài sản trong context card | Font UI, 17px; chiều cao nhỏ 14px | 700 |
| Tên người đang tới lượt | Font UI, 16px; landscape ≤740px rộng: 14px | 700 |
| Tên người chơi trong HUD | Font UI, 12px; một số viewport thấp 11px | 700 |
| Tiền trong HUD | Font UI, 11px | 400 |
| Nội dung phụ, log | Font UI, thường 11–13px | Thường 400 |
| Nội dung thẻ sự kiện | Font UI, 14px | 400 |
| Nút chính/phụ | Font UI, 13px | 700 |
| Nút đổ xúc xắc | Font UI, 12px; landscape ≤740px rộng: 11px | 800 |
| Nút xem chi tiết context | Font UI, 12px | 600 |
| Tổng xúc xắc | Font UI, 24px | 700 |
| Giá mua trong sheet | Font UI, 28px | 700 |
| Số tiền nổi bật | Font UI, 36px | 800 |
| Tiêu đề thẻ sự kiện | Font UI, 24px | 700 |
| Tên người chiến thắng | Font UI, 26px; chiều cao ≤340px: 22px | 700 |
| Tên ô bàn cờ 3D | Arial, 19px trong texture | Bold |
| Giá ô bàn cờ 3D | Arial, 15px trong texture | Normal |

Tên ô và giá được vẽ vào atlas Canvas với cell 128×128. Cỡ chữ texture không phải kích thước CSS trên màn hình: mức zoom và góc camera quyết định kích thước nhìn thấy.

## 5. Màu 8 nhóm đất

| Nhóm | Màu | HEX |
| --- | --- | --- |
| Miền Tây | Nâu | `#8B5A2B` |
| Phương Nam | Xanh da trời nhạt | `#87CEEB` |
| Cao Nguyên | Hồng | `#D95AA5` |
| Duyên Hải | Cam | `#F59E0B` |
| Di Sản | Đỏ | `#DC2626` |
| Miền Trung Bắc | Vàng | `#FACC15` |
| Miền Bắc | Xanh lá | `#16A34A` |
| Đô Thị | Xanh dương đậm | `#1D4ED8` |

## 6. Màu người chơi

| Người chơi | Màu quân cờ / sở hữu |
| --- | --- |
| 1 | Hồng đỏ `#EE6B73` |
| 2 | Xanh dương `#59BAFA` |
| 3 | Xanh lá mint `#73D7A0` |
| 4 | Vàng `#FFD46A` |

HUD hiện dùng emoji 🔴 🔵 🟢 🟡; màu emoji không được điều khiển bằng các HEX này. HEX áp dụng cho vật liệu quân cờ và đánh dấu sở hữu.

## 7. Bảng màu chính của cảnh 3D

| Thành phần | HEX |
| --- | --- |
| Mặt ô tài sản | `#FFF6DF` |
| Ô xuất phát | `#D8EDCB` |
| Ô Cuộc Sống | `#FBE0EB` |
| Các ô đặc biệt còn lại | `#E1EBEB` |
| Viền in ô | `#C4C6AC` |
| Thân ô | `#F0E9CF` |
| Cỏ trung tâm / cỏ viền đảo | `#8BC678` / `#8AB978` |
| Đá nền / đá tầng trên | `#BEAA86` / `#D5C9AB` |
| Viền bàn / lối đi | `#FFF3CD` / `#E6CF99` |
| Nước đài phun / giọt nước | `#72BCC7` / `#97D5DD` |
| Lá cây | `#50A76D` / `#7AC783` |
| Mái đình | `#3F9293` / `#55AAAA` |
| Tường nhà / mái khách sạn | `#FFE6B3` / `#CC5B4C` |
| Xúc xắc / chấm xúc xắc | `#FFF8E0` / `#335164` |
| Vòng quân cờ active / viền ô đích | `#F9BD3F` / `#D49422` |

Đây là màu gốc trong atlas/vật liệu. Các vật liệu 3D có chiếu sáng có thể trông sáng hoặc tối hơn HEX gốc. Mái nhà hiện dùng màu người chơi sở hữu; mái khách sạn dùng `#CC5B4C`. Group strip trên ô vẫn dùng màu nhóm đất.

## 8. Những điểm chưa đồng nhất hiện có

- Tiêu đề sự kiện và tên người chiến thắng còn dùng vàng nhạt `#FFE094`; mô tả chiến thắng còn dùng xanh nhạt `#B6D5DC`. Các màu này ít tương phản trên nền kem hiện tại.
- Lỗi nhập tên còn dùng hồng nhạt `#FF9F9F`, trong khi lỗi trong sheet dùng đỏ đậm `#973F31`.
- UI dùng Segoe UI/Arial theo fallback; atlas bàn cờ cố định Arial.
- Màu phụ, viền và gradient có nhiều biến thể gần nhau, còn khai báo trực tiếp ở CSS/renderer. Chỉ một phần được gom thành biến CSS (`--line`, `--panel`, `--gold`).

Lần tổng hợp này chỉ ghi nhận hiện trạng; không thay đổi giao diện hoặc luật chơi.

## Nguồn và đối chiếu

- [CSS giao diện](../src/styles.css)
- [Màu người chơi](../src/components/format.ts)
- [Manifest nhóm đất](classic-vietnam-v2.json)
- [Atlas và mô hình 3D](../src/rendering/tabletopArt.ts)
- [Cảnh và vật liệu bàn cờ](../src/rendering/tabletopScene.ts)

Đã đối chiếu computed style bằng Chrome tại viewport 844×390 cho setup, HUD, nút chính, Roll, panel và camera. Màu sự kiện/chiến thắng được đối chiếu bằng DOM probe mang đúng class CSS trong phiên kiểm tra riêng. Các giá trị nhóm đất và vật liệu lấy trực tiếp từ source. Không chỉnh engine hoặc stylesheet.
