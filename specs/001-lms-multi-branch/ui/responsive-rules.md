# Responsive Rules

## Acceptance viewports

1440x900, 1280x800, 1024x768, 768x1024, 390x844 và 360x800.

## Layout behavior

- Desktop: sidebar expanded mặc định và có collapsed mode; content max width tùy loại trang.
- Laptop: sidebar có thể collapsed; toolbar wrap theo thứ tự ưu tiên.
- Tablet/mobile: sidebar thành sheet; form một cột; padding giảm; dialog dài thành sheet/full-screen khi phù hợp.
- Touch target tối thiểu 44x44px trên touch viewport.

## Tables and dense data

- Không ép 8-10 cột vào mobile. Dùng structured list hoặc horizontal scroll có sticky identity column và affordance rõ.
- Header/cell không cắt mất dữ liệu quyết định; tên dài wrap rồi ellipsis + tooltip/detail.
- Secondary action chuyển vào overflow khi thiếu chỗ.

## Navigation and fixed regions

- Sticky region không che content, focus target hoặc bàn phím ảo.
- Tabs cuộn ngang nhưng active tab luôn vào view.
- Assessment timer, capacity, badge và counter có stable dimension.

## Localization stress

Kiểm tra vi/en, tên organization 60 ký tự, tên người 50 ký tự, chương trình 100 ký tự và bản dịch nút dài. Không scale font theo viewport để chữa overflow.
