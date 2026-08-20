# Content Guidelines

## Voice

Ngắn, trực tiếp, trung tính và định hướng hành động. Portal vận hành không dùng khẩu hiệu marketing. Xác nhận phải nêu đối tượng và hậu quả.

## Vietnamese defaults

- Thuật ngữ chuẩn: Học viên, Phụ huynh, Ghi danh, Lớp học, Công nợ, Khoản thu/chi, Kỳ lương, Chi nhánh.
- Ngày hiển thị theo locale Việt Nam; API vẫn dùng ISO 8601.
- Tiền theo currency cấu hình, không tự giả định VND trong domain contract.

## English equivalents

Duy trì glossary: Student, Parent/Guardian, Enrollment, Class, Receivable, Income/Expense, Payroll Period, Branch. Không dịch tên riêng, mã lớp hoặc mã chứng từ.

## Status labels

Mỗi domain state có một label chuẩn ở mỗi locale. Không trộn `Hoàn tất`, `Thành công`, `Đã duyệt` cho cùng state. Badge có text.

## Error pattern

- Tiêu đề: điều gì không hoàn thành.
- Nội dung: nguyên nhân có thể công bố và bước tiếp theo.
- Kỹ thuật: correlation ID khi cần hỗ trợ.
- Không lộ stack hoặc provider secret.

## i18n contract

- Message key theo domain và intent, không theo nguyên văn câu.
- Plural, number, currency, date/time dùng formatter locale.
- Không nối fragment hoặc CSS uppercase text có ngữ nghĩa.
- CMS public có locale, fallback và publication state riêng; không tự machine-translate khi chưa duyệt.
