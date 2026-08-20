# Screen Specifications

## Global list page

Breadcrumb; page title + status/count; một primary action; search/filter/date/branch; column settings/export; data table; pagination. Filter, sort, page và tab nằm trên URL. Mobile đưa filter vào sheet và chỉ giữ search + primary action ở toolbar.

## Global detail page

Breadcrumb; identity + status; primary action + overflow; alert quan trọng; summary facts; tabs theo quyền. Tab đề xuất: Tổng quan, Hoạt động, Tài liệu, Tài chính, Trao đổi, Nhật ký. Không render tab không có quyền.

## Public landing

- Header: logo, chương trình, chi nhánh, đội ngũ, tin tức, liên hệ, locale/theme, CTA tư vấn.
- Hero: tên tổ chức/chương trình, value proposition ngắn, ảnh thật, CTA tư vấn và xem chương trình; để lộ section kế tiếp.
- Bands: chương trình, chi nhánh, lộ trình, giáo viên, kết quả học viên, tin tức, consultation CTA, footer.
- Draft không xuất hiện. Mobile CTA dễ tiếp cận, menu dùng sheet.

## Branch dashboard

Scope/time filter; timestamp; KPI lead mới, conversion, lớp hoạt động, công nợ; work queue; lớp sắp khai giảng/gần đầy; lịch hôm nay; cảnh báo xung đột và quá hạn. KPI liên kết dữ liệu nguồn.

## Lead pipeline and detail

Table/Kanban segmented control; trạng thái Mới, Đã liên hệ, Đang tư vấn, Chờ thi, Đề xuất lớp, Đã ghi danh, Không phù hợp. Row/card có tên, nhu cầu, nguồn, branch, owner, last contact, next action. Detail có duplicate warning, assignment, timeline, placement và conversion preview. Drag/drop có thao tác bàn phím/menu thay thế.

## Class detail

Identity gồm class, program, branch, modality, teacher, capacity dạng số và status. Tabs: Tổng quan, Học viên, Lịch, Học liệu, Điểm danh, Đánh giá, Tài chính, Trao đổi. Conflict chỉ rõ resource và thời gian, focus tới trường lỗi.

## Student profile

Identity và privacy marker; enrollment hiện tại; lịch sắp tới; tiến độ; điểm danh; kết quả; công nợ; parent links; timeline. Trường nhạy cảm không tồn tại trong client payload ngoài scope.

## Parent dashboard

Student switcher rõ khi có nhiều học viên; mọi widget ghi context học viên. Hiển thị lịch, điểm danh, tiến độ, học phí, nhận xét và conversation theo delegation. Module không có quyền không render; deep link trả forbidden an toàn.

## Assessment attempt

Sticky header có tên, countdown, save/connectivity state; question navigator; mark for review; autosave; retry-safe submit; confirm submit. Mobile navigator dùng sheet. Timer/state có stable dimension. Kết quả tách total/topic/skill.

## Invoice/payment detail

Hiển thị tổng, giảm, đã trả, còn nợ, hạn và trạng thái bằng text + icon. Timeline transaction/refund/adjustment immutable. `pending` không trình bày như success. Payment, refund, finalize và sync có confirmation/audit context.

## Theme settings

Preset list; live preview trong shell thật; light/dark/system segmented control; locale preview vi/en; contrast/token validation; publish/rollback history. Preview không ghi đè preference cá nhân đến khi xác nhận.
