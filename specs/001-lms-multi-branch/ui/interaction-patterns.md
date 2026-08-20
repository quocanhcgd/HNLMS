# Interaction Patterns

## Commands

- Mỗi trang tối đa một primary action; secondary dùng outline/ghost, action phụ vào overflow.
- Icon button dùng Lucide, tooltip và accessible name.
- Destructive action dùng alert dialog nêu đối tượng, hậu quả và khả năng khôi phục.

## Forms

- Label luôn hiển thị; placeholder chỉ là ví dụ. Validation cạnh trường và có summary khi submit lỗi.
- Form dài chia section/step, không đặt trong modal.
- Dirty-state guard khi rời trang, đổi workspace/branch hoặc locale nếu có nguy cơ mất draft.
- Footer theo thứ tự Hủy, Lưu nháp, Lưu/Xác nhận. Enter không vô tình submit form nhiều bước.

## Data operations

- Search có debounce và clear; filter tạo chip; reset rõ ràng.
- Bulk action chỉ hiện khi có selection và ghi số item.
- Optimistic update chỉ dùng khi rollback rõ; payment, payroll, grading và permission không giả báo thành công.
- Toast cho kết quả ngắn; lỗi cần xử lý dùng inline/banner và correlation ID.

## Theme and locale

- Theme đổi tức thời, không reload.
- Locale giữ route/query/tab/scroll hợp lý và không mất form data.
- Authenticated preference lưu theo user và đồng bộ bootstrap cookie; anonymous preference lưu trên thiết bị.
- Resolve theo thứ tự: user preference, device preference, default (`vi`, `dark`). System chỉ ảnh hưởng màu.

## Loading and async

- Skeleton giữ kích thước gần nội dung thật; panel refresh không khóa toàn trang.
- Provider state phân biệt pending, confirmed, failed, needs review, unknown.
- Disable command khi submit và dùng idempotency cho side effect quan trọng.
