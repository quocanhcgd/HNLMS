# Design Direction

## Mục tiêu

Giao diện mang tính vận hành giáo dục: yên tĩnh, rõ ràng, mật độ vừa đến cao và tối ưu thao tác lặp lại. Bảng, lịch, timeline, form và danh sách việc cần xử lý là trọng tâm. Trang quản trị không dùng bố cục marketing, hero lớn hoặc card trang trí.

## Tính cách thị giác

- Hiện đại, nghiêm túc, tin cậy; tránh hiệu ứng gây phân tán.
- Border nhẹ, elevation tiết chế, radius tối đa 8px cho card/control thông thường.
- Màu thương hiệu dành cho hành động chính, active và focus; trạng thái dùng success/warning/danger/info.
- Không dùng gradient, orb, bokeh hoặc minh họa trang trí.
- Không đặt card trong card. Section dùng layout phẳng; card chỉ cho item lặp, KPI hoặc tool có ranh giới thật.

## Theme

- Mặc định là dark. Không dùng đen tuyệt đối; phân cấp surface bằng độ sáng và border.
- Light dùng nền trung tính sáng với độ tương phản tương đương dark.
- System theo OS và cập nhật khi OS đổi mà không ghi đè preference `system`.
- Áp dụng theme trước paint đầu tiên để tránh flash sai theme.
- Logo và media có biến thể hoặc nền bảo đảm đọc được ở cả light/dark.

## Đa ngôn ngữ

- Mặc định tiếng Việt; chuyển English tại account menu trên authenticated space và header/menu mobile trên public space.
- Không dùng cờ quốc gia; hiển thị `Tiếng Việt` và `English`.
- Không ghép câu từ fragment dịch. Message có ngữ cảnh và tham số có tên.
- Layout chịu text expansion tối thiểu 30% và tên riêng dài.

## Ba product space

### Public landing

Thương hiệu là tín hiệu đầu viewport, dùng ảnh thật rõ chủ thể. Header có catalog, chi nhánh, tin tức, liên hệ, locale/theme và CTA tư vấn. Hero không nằm trong card.

### License control plane

Mật độ cao, ưu tiên tenant, database, license, quota, migration và sự cố. Không dùng navigation LMS. Trạng thái có icon + text, không chỉ màu.

### LMS application

Shell ổn định gồm sidebar, header, breadcrumb, page header và content. Navigation phụ thuộc permission + entitlement. Mỗi vai trò có home riêng nhưng dùng cùng primitive và pattern.

