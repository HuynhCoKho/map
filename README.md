# Bản đồ mạng lưới ngoại hối cho du khách

Trang công khai: https://huynhcokho.github.io/map/

Bản đồ chỉ đọc, không cần đăng nhập, dành cho tra cứu điểm đổi ngoại tệ, kiều hối và ngân hàng thương mại. Giữ thương hiệu và ảnh nền gốc Huỳnh Cỏ Khô.

## Tính năng

- Bản đồ 3D/2D, 34 tỉnh/thành, xã/phường TP.HCM và Đồng Nai.
- Checkbox chọn nhiều loại; mặc định tất cả. Điểm chấm dứt mặc định ẩn, hiện bằng biển cấm đỏ khi bật lại.
- Tìm tên/địa chỉ, lọc tỉnh và trạng thái; tìm địa chỉ để đặt ghim tìm kiếm.
- Vị trí của tôi theo quyền trình duyệt; toàn màn hình; mật độ; chỉ đường Google Maps.
- Không có thêm/sửa/xóa, chọn tọa độ hồ sơ, kéo chỉnh đại lý hoặc bất kỳ giao diện quản trị nào.

## Dữ liệu và riêng tư

Dữ liệu điểm được tải trực tiếp từ endpoint công khai chỉ đọc của ứng dụng quản lý qua JSONP. Endpoint chỉ cho phép các trường id công khai, name, type, province, ward, address, lat, lng, status, expires. Không xuất tài khoản, mật khẩu/token, số điện thoại, người liên hệ, ghi chú, đơn vị chủ quản hoặc số giấy phép nội bộ. Không lưu bản sao dữ liệu điểm trong repository. Các thao tác quản trị vẫn yêu cầu đăng nhập trên ứng dụng quản lý riêng.

Dữ liệu trên trang tải lúc mở hoặc khi bấm Tải lại; bộ nhớ đệm nguồn tối đa 60 giây, các thao tác ghi trong ứng dụng quản lý xóa cache để lần tải kế tiếp lấy dữ liệu mới. Tọa độ thiết bị chỉ dùng trong trình duyệt, không gửi về ứng dụng quản lý. Tìm địa chỉ gửi truy vấn do người dùng nhập đến Photon/OpenStreetMap. Nút chỉ đường mở Google Maps với đích được chọn.

Chỉ công bố dữ liệu địa điểm kinh doanh được phép chia sẻ. Đây là công cụ tra cứu, không xác nhận tình trạng cấp phép thực tế của từng cơ sở. Kiểm tra thông tin trước khi đến.

## Nhúng vào trang khác

```html
<iframe src="https://huynhcokho.github.io/map/" title="Bản đồ dịch vụ ngoại hối"
  style="width:100%;height:800px;border:0" allow="geolocation; fullscreen"
  allowfullscreen loading="lazy"></iframe>
```

## Triển khai

GitHub Pages → Deploy from a branch → main → / (root). Không cần build hoặc npm. Có .nojekyll.

Kiểm tra JS: `node --check app.js`. Kiểm thử: `node tests/public.test.cjs`.

Nguồn bản đồ: MapLibre GL JS 5.6.1, OpenFreeMap/OpenMapTiles/OpenStreetMap. Nguồn địa giới và giấy phép xem assets/SOURCES.md và assets/SOURCE_LICENSE.txt. Ranh giới đã giản lược, chỉ dùng tham khảo. Internet cần cho nền bản đồ, tìm địa chỉ và nguồn điểm.
