# V2 — tham khảo và làm mới giao diện

Ngày 04/10/2026. Bước 8 bổ sung theo yêu cầu người dùng, đã triển khai trong ván chơi thật.

## Hướng tham khảo và lựa chọn

Ảnh Monopoly người dùng gửi là mốc art: bàn vuông nổi trên một cảnh diorama, màu sáng, nhân vật và công trình có thể nhìn thấy ở góc isometric. V2 dùng hình khối procedural để giữ chi phí tải thấp và có thể sửa ngay trong repository; không tuyên bố đây là bộ art production khớp hoàn toàn ảnh tham khảo.

Tham khảo [Three.js Responsive Design](https://threejs.org/manual/pages/responsive.html): resize theo vùng canvas và kiểm soát độ phân giải. Giữ DPR tối đa 1,5, render khi có thay đổi và dừng khi hidden. Nguồn này hỗ trợ lựa chọn kỹ thuật, không là bằng chứng FPS trên điện thoại.

Tham khảo [Game Accessibility Guidelines về độ tương phản](https://gameaccessibilityguidelines.com/provide-high-contrast-between-text-ui-and-background/) và [W3C về thiết kế dễ tiếp cận](https://www.w3.org/WAI/tips/designing/): chữ/controls tách khỏi nền cảnh, thông tin không truyền chỉ bằng màu, dùng button/modal native. Chưa coi đây là chứng nhận tuân thủ toàn bộ WCAG.

## Đã thay đổi

- Tông xanh ngọc cho cảnh, kem cho HUD/sheet và vàng cho hành động chính.
- Bốn góc vuông lớn; 36 ô thường chữ nhật cùng diện tích, xoay theo cạnh. Dải nhóm màu hướng về trong bàn.
- Đảo bàn nổi, sân xanh, cây/pavilions, ga có mái, tháp nước, nhà điện, Nhà tù, nhà 1–4 và khách sạn.
- HUD người chơi gọn ở trên; bảng vị trí/camera bên trái và xúc xắc/actions bên phải. Vùng canvas được dành riêng để các controls không đè lên ô.
- Không đặt title lớn hoặc toolbar dưới màn hình.
- Sheet có tên đầy đủ, loại tài sản, bảng thuê, chi phí xây, số nhà/khách sạn trong ngân hàng và người sở hữu từng ô trong nhóm.
- Badge nhóm dùng chữ tối trên nền sáng, màu thể hiện qua viền thay vì chữ trắng trên nền vàng.
- Primary action, camera và asset/history controls 48px; input tên có bàn phím/text selection phù hợp.
- Camera theo lượt thật: zoom khi đổ/di chuyển, theo từng bước qua góc, giữ góc nhìn, lùi về overview; người chơi có thể chuyển view.
- Reduced motion tắt flip/tumble và snap camera. WebGL lỗi chuyển sang bàn DOM.

## Bằng chứng

- [Màn chơi mobile](v2-gameplay-mobile.png)
- [Màn chơi nhỏ](v2-gameplay-small-mobile.png)
- [Camera theo quân](v2-follow-mobile.png)
- [Sheet tài sản](v2-property-mobile.png)
- [Nhà tù](v2-jail-mobile.png)
- [Chiến thắng](v2-winner-mobile.png)
- [Kết quả browser](v2-browser-checks.json)
- [Màn production sau 24 lượt](v2-production-mobile.png)
- [Production UI smoke](v2-production-checks.json)

7 viewport từ 568×320 đến 1440×900 không page scroll, đủ 40 ô và controls không chồng vùng canvas. Thuộc tính fullBoardFits xác nhận phần bàn nằm trong frustum ở overview. Chữ nhỏ trên mặt bàn ở overview được bổ sung bằng sheet full name khi chọn; không khẳng định chữ trên từng ô đều đọc được như sheet ở máy nhỏ.

## Cần kiểm chứng tiếp

Điện thoại thật: Safari/Chrome, safe area/browser chrome, keyboard, nhiệt/pin, FPS/frame time, cảm giác camera và đọc chữ ngoài trời. Người thật: độ rõ ưu tiên hành động, thao tác đổi người trên một máy và thời lượng ván. Đây là phần validation còn pending, không phải lỗi được kết luận đã sửa qua emulation.
