# Information Architecture

## Product boundaries

- Public: landing, catalog, program detail, branch, teacher, news, consultation.
- Platform: tenants, plans, licenses, deployments, migrations, operations, audit.
- LMS: dashboard và module nghiệp vụ theo vai trò.

Không space nào dùng navigation hoặc authorization context của space khác.

## LMS navigation hierarchy

```text
Tổng quan
Tuyển sinh: Khách hàng tiềm năng, Lịch tư vấn, Thi đầu vào, Ghi danh
Đào tạo: Ngành & chương trình, Khóa học, Lớp học, Lịch học, Phân công
Học tập: Học liệu, Thư viện, Đánh giá, Tiếng Anh, Lớp online
Học viên: Hồ sơ, Phụ huynh & ủy quyền, Tiến độ, Điểm danh, Kết quả
Trao đổi: Hội thoại, Thông báo
Tài chính: Hóa đơn & công nợ, Thanh toán, Thu chi, Ngân sách, Payroll, Đồng bộ
Nhân sự: Nhân viên, Giáo viên, Hợp đồng, Chấm công, Nghỉ phép, Đánh giá
Báo cáo
AI & kiểm duyệt
Cài đặt: Tổ chức, Chi nhánh, Người dùng & vai trò, Module, Theme, Tích hợp, Nhật ký
```

## Context hierarchy

1. Product space.
2. Organization/tenant.
3. Branch hoặc `all permitted branches`.
4. Role/persona context.
5. Module, object và tab.

Workspace/branch switcher luôn hiển thị context. Đổi branch cập nhật URL/data scope và xác nhận nếu form chưa lưu.

## URL principles

- URL phản ánh filter, page, sort, tab và object ID.
- Deep link và refresh khôi phục cùng view nếu còn quyền.
- Locale dùng preference/cookie; public SEO có thể dùng URL locale riêng nếu chiến lược SEO yêu cầu.
- Forbidden khác not-found; nội dung lỗi không tiết lộ dữ liệu ngoài scope.
