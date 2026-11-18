# Nguồn và xử lý dữ liệu bản đồ

Nguồn: https://github.com/thanglequoc/vietnamese-provinces-database

- GIS: dataset-generation-scripts/resources/gis/geojson_11Mar2026/ — tải 17/11/2026.
- 34 file province.geojson, toàn bộ 168 ward TP.HCM và 95 ward Đồng Nai.
- Danh mục: json/vn_only_simplified_json_generated_data_vn_units.json — tải 17/11/2026; tên xã/phường đối chiếu theo tỉnh và tên chuẩn hóa. Cả 263 ward đã ghép được mã danh mục.
- Source matinh dùng hệ mã GIS riêng (ví dụ 29 cho HCM), không dùng nó thay mã hành chính chính thức. Thuộc tính code được ghép từ danh mục JSON.
- Giản lược Shapely preserve_topology: cấp tỉnh 0.002 độ; xã/phường 0.00035 độ. Không phải độ chính xác khảo sát. Một hình học Xã Dầu Tiếng không hợp lệ từ nguồn đã sửa bằng make_valid.
- Giữ các phần đảo theo dữ liệu nguồn; không bổ sung đường biên suy đoán. Không bảo đảm đầy đủ thể hiện biển, đảo hoặc tuyên bố chủ quyền; cần đối chiếu bản đồ chính thức cho sử dụng cơ quan.
- SOURCE_LICENSE.txt sao chép nguyên văn giấy phép repository. Nguồn GIS và ngày snapshot phải được giữ khi phân phối bản này.

Nền: https://openfreemap.org/quick_start/ — Liberty, dữ liệu OpenStreetMap/OpenMapTiles và các nguồn nền đi kèm. Giữ attribution của style. Tham khảo API MapLibre: https://maplibre.org/maplibre-gl-js/docs/ . Không có API key.
