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

## Table and row actions

- Mỗi chức năng ưu tiên một bảng chính cho một tập dữ liệu và một lifecycle. Không tạo bảng phụ chỉ để lặp lại các dòng đã có ở bảng chính.
- Nếu bảng phụ và bảng chính có cùng đối tượng hoặc cùng thao tác, bỏ bảng phụ và thêm cột `Thao tác` vào bảng chính. Cột này dùng icon + tooltip hoặc icon + text ngắn, có accessible name và ẩn/hiện theo permission.
- Cột `Thao tác` có thể gồm `Xem`, `Sửa`, `Xóa`, `Chấm`, `Công bố` hoặc command tương ứng lifecycle; không hiển thị command không hợp lệ với trạng thái dòng.
- `Sửa` luôn mở modal form có field label, validation, dirty-state guard, lỗi inline và footer `Hủy` → `Lưu`/`Lưu nháp`/`Xác nhận`. Modal không được chứa bảng lồng để thay thế một workflow khác.
- `Xóa` luôn mở confirmation/alert dialog. Dữ liệu đã publish, đã chốt, đã dùng để tính điểm/lương/tài chính hoặc cần audit phải dùng archive/void/adjustment; không được xóa vật lý.
- Khi thao tác cần nhập nhiều trường hoặc nội dung dài vượt quá modal, mở detail page theo route rõ ràng; không tạo bảng phụ tạm thời.

## Theme and locale

- Theme đổi tức thời, không reload.
- Locale giữ route/query/tab/scroll hợp lý và không mất form data.
- Authenticated preference lưu theo user và đồng bộ bootstrap cookie; anonymous preference lưu trên thiết bị.
- Resolve theo thứ tự: user preference, device preference, default (`vi`, `dark`). System chỉ ảnh hưởng màu.

## Loading and async

- Skeleton giữ kích thước gần nội dung thật; panel refresh không khóa toàn trang.
- Provider state phân biệt pending, confirmed, failed, needs review, unknown.
- Disable command khi submit và dùng idempotency cho side effect quan trọng.
