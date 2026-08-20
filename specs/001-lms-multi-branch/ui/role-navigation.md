# Role Navigation

Navigation là giao của role permission, scope và effective module entitlement. Ẩn menu không thay backend authorization.

| Vai trò | Trang đầu | Navigation chính |
|---|---|---|
| Super admin | Tenant operations | Tenants, plans, licenses, deployments, migrations, audit |
| Organization admin | Organization dashboard | Module được license, access, settings, audit |
| Branch manager | Branch dashboard | Tuyển sinh, lớp, học viên, nhân sự, tài chính, báo cáo trong branch |
| Consultant | Admission work queue | Leads, lịch tư vấn, thi đầu vào, đề xuất lớp, ghi danh |
| Academic manager | Academic dashboard | Chương trình, lớp, lịch, phân công, học liệu, assessment |
| Teacher | Lịch dạy hôm nay | Lớp phụ trách, điểm danh, học liệu, đánh giá, phản hồi, trao đổi |
| Finance officer | Finance work queue | Hóa đơn, thanh toán, công nợ, thu chi, đối soát, payroll theo quyền |
| HR officer | HR work queue | Hồ sơ, hợp đồng, chấm công, nghỉ phép, đánh giá |
| Student | Học tập hôm nay | Lịch, lớp, học liệu, bài thi, tiến độ, học phí, trao đổi |
| Parent | Tổng quan học viên | Chọn học viên, lịch, điểm danh, tiến độ, học phí, trao đổi theo delegation |

## Rules

- Không render nhóm menu rỗng.
- Active state dựa trên typed route manifest.
- Submenu mở theo route active và giữ trạng thái trong phiên.
- Sidebar collapsed có icon + tooltip; icon mơ hồ luôn có nhãn.
- Locale/theme switcher luôn truy cập được nhưng không chiếm vị trí primary action.
