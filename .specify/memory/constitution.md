<!--
Sync Impact Report
- Version change: 1.0.0 -> 1.1.0
- Modified principles:
  - Placeholder Principle 1 -> I. Phân quyền và cô lập dữ liệu theo phạm vi
  - Placeholder Principle 2 -> II. Module hóa và kiểm soát license
  - Placeholder Principle 3 -> III. Tính đúng đắn, bất biến và khả năng đối soát
  - Placeholder Principle 4 -> IV. AI minh bạch và có con người giám sát
  - Placeholder Principle 5 -> V. Kiểm thử, quan sát và phục hồi là bắt buộc
- Added sections:
  - Ràng buộc kiến trúc và trải nghiệm
  - Quy trình phát triển và quality gates
- Added architecture constraints:
  - Next.js App Router là router duy nhất; không dùng React Router
  - Mantine component system và semantic theme tokens; không tự mô phỏng component có sẵn
  - Server Component mặc định và ba layout boundary tách biệt
  - UI foundation acceptance gate trước màn hình nghiệp vụ
- Removed sections: Không có
- Follow-up TODOs: Không có
-->
# HN-LMS Constitution

## Core Principles

### I. Phân quyền và cô lập dữ liệu theo phạm vi

Mọi request MUST được xác thực và kiểm tra quyền tại backend theo tổ chức, chi nhánh,
lớp, học viên, vai trò và ủy quyền có hiệu lực. Frontend chỉ được dùng quyền để điều
chỉnh trải nghiệm và MUST NOT là lớp bảo vệ duy nhất. Dữ liệu của chi nhánh, phụ huynh,
học viên, nhân sự, tài chính, payroll, trao đổi và AI MUST không bị truy cập ngoài phạm
vi được cấp. Mọi chức năng xem, sửa, xuất, tải file, gửi thông báo và chạy AI MUST áp
dụng cùng quy tắc phạm vi. Các thay đổi quyền và thao tác bị từ chối MUST được audit khi
có ý nghĩa bảo mật. Nguyên tắc này bảo vệ dữ liệu đa chi nhánh và ngăn rò rỉ qua API,
export, báo cáo hoặc liên kết file trực tiếp.

### II. Module hóa và kiểm soát license

Hệ thống MUST được tổ chức thành modular monolith với ranh giới nghiệp vụ rõ ràng. Mỗi
business module MUST khai báo manifest gồm module key ổn định, version, dependencies,
permissions, routes, navigation, migrations, jobs, events và license feature key. Module
chỉ được hoạt động khi đã cài đặt, được cấu hình bật, có entitlement hợp lệ và thỏa mãn
mọi dependency. Backend MUST enforce effective module state; ẩn menu ở frontend không
được xem là enforcement. Các module lõi identity, organization, authorization, audit,
module registry và license runtime MUST không thể tắt. Việc tắt module MUST không xóa dữ
liệu lịch sử. License tháng, năm và trọn đời MUST hỗ trợ chữ ký, trạng thái hiệu lực,
grace period, quota, gia hạn, thu hồi và audit. Tenant admin MUST không thể tự cấp module
hoặc quota ngoài entitlement do super admin phát hành. Nguyên tắc này cho phép thương mại
hóa theo gói mà không tạo nhiều biến thể source hoặc làm suy yếu bảo mật.

### III. Tính đúng đắn, bất biến và khả năng đối soát

PostgreSQL MUST là nguồn dữ liệu giao dịch chính cho ghi danh, điểm, công nợ, thanh toán,
thu chi, payroll, license và trạng thái tích hợp. Các thao tác có quan hệ nghiệp vụ MUST
được thực hiện trong transaction phù hợp. Tích hợp payment, meeting, kế toán/ERP và các
worker side effect MUST dùng idempotency, outbox/inbox, retry có giới hạn, dead-letter và
reconciliation. Không được xác nhận thanh toán chỉ từ browser redirect. Kỳ lương đã khóa,
giao dịch tài chính, điểm, bài làm, audit và chứng từ đã chốt MUST không bị sửa hoặc xóa
trực tiếp; điều chỉnh MUST tạo lịch sử mới có lý do và phê duyệt. File hạn chế quyền MUST
được lưu private và chỉ cấp quyền truy cập ngắn hạn sau authorization. Nguyên tắc này đảm
bảo số liệu có thể giải thích, đối soát và phục hồi khi provider hoặc worker lỗi.

### IV. AI minh bạch và có con người giám sát

Mọi tác vụ AI MUST đi qua AI governance boundary để kiểm tra mục đích, quyền dữ liệu,
tối thiểu hóa dữ liệu, model/prompt version, nguồn, confidence, chi phí và audit. AI output
MUST được phân loại theo chế độ đề xuất, tự động có điều kiện hoặc yêu cầu review. AI MUST
NOT tự thay đổi điểm, lương, quyền lợi, quyền truy cập, quyết định kỷ luật hoặc kết luận
gian lận khi chưa có người có thẩm quyền xem xét. Người bị ảnh hưởng MUST có khả năng nhận
giải thích phù hợp, đánh dấu sai lệch, yêu cầu xem xét và khiếu nại. Quy trình nghiệp vụ
chính MUST có manual fallback khi AI không khả dụng. Dữ liệu nhạy cảm MUST không được dùng
ngoài mục đích đã phê duyệt. Nguyên tắc này cho phép tự động hóa cao nhưng giữ trách nhiệm,
khả năng kiểm tra và quyền con người.

### V. Kiểm thử, quan sát và phục hồi là bắt buộc

Mỗi thay đổi MUST có mức kiểm thử tương xứng với rủi ro. Logic tài chính, payroll, license,
quyền, assessment và AI policy MUST có unit tests. Authorization MUST có matrix tests và
negative access cases. Payment, meeting, ERP, AI và license MUST có contract và duplicate/
retry tests. Các luồng P1 MUST có integration hoặc end-to-end tests. Release MUST không
được phê duyệt nếu còn lỗi scope, duplicate financial effect, payroll lock bypass, license
bypass hoặc high-risk AI bypass. Runtime MUST có structured logs, correlation IDs, metrics,
health checks và alerting cho API, worker, queue, database và integration. Backup, restore,
migration compatibility và rollback MUST được kiểm chứng trên staging. Nguyên tắc này biến
các yêu cầu an toàn thành bằng chứng có thể lặp lại thay vì giả định.

## Ràng buộc kiến trúc và trải nghiệm

- Stack chuẩn MUST dùng TypeScript trên Node.js LTS, Next.js cho web và NestJS cho backend
  modular monolith, trừ khi amendment constitution phê duyệt thay đổi.
- Mọi nội dung hiển thị cho người dùng Việt Nam MUST dùng tiếng Việt hoàn chỉnh, có đầy đủ dấu và ngữ pháp tự nhiên; không được dùng chuỗi tiếng Việt không dấu trong landing, portal, form, thông báo, trạng thái, metadata hoặc dữ liệu mẫu. Ngoại lệ chỉ gồm tên thương hiệu, tên riêng, thuật ngữ quốc tế và mã kỹ thuật.
- UI MUST dùng Mantine components, CSS Modules/Mantine styles và semantic theme tokens. Component
  nghiệp vụ MUST không hard-code màu thương hiệu, font hoặc radius khi đã có design token.
- Theme MUST hỗ trợ preset, version, preview, publish, rollback, light/dark/system mode và kiểm tra
  accessibility. Đổi preset Mantine MUST không yêu cầu sửa logic component nghiệp vụ.
- Web application MUST dùng duy nhất Next.js App Router với route groups, nested layouts,
  loading/error/not-found boundaries, `next/link` và `next/navigation`. React Router hoặc một
  router phía client cạnh tranh MUST NOT được cài hoặc sử dụng trong cùng ứng dụng.
- Mantine MUST được khởi tạo bằng provider/theme API chuẩn của dự án. Component registry/wrapper được đưa vào `components/ui` và chỉ điều chỉnh có kiểm soát; MUST NOT tự mô phỏng lại component Mantine bằng thẻ HTML/CSS khi component tương ứng tồn tại.`r`n- Server Component MUST là mặc định. Chỉ thêm `use client` tại boundary nhỏ nhất cần state,
  browser API hoặc interaction; MUST NOT biến toàn bộ layout/page thành Client Component chỉ để
  phục vụ một điều khiển con.
- Landing page, license control plane và LMS application MUST có route group và layout boundary
  riêng. Hai control/application shell MUST dùng shared UI primitives nhưng không dùng chung
  navigation tree, authorization context hoặc product identity một cách nhập nhằng.
- Application shell và bộ component nền tảng MUST vượt qua visual, responsive, keyboard,
  accessibility và theme acceptance gates trước khi triển khai thêm màn hình nghiệp vụ.
- Worker MUST tách khỏi HTTP API cho payment reconciliation, ERP sync, meeting sync,
  notification, report, payroll batch, content processing và AI task.
- Redis MUST chỉ dùng cho cache, queue và lock ngắn hạn; MUST không là nguồn dữ liệu chính
  cho payment, payroll, kết quả thi, license hoặc audit.
- File lớn MUST dùng private object storage; database chỉ lưu metadata, hash, ownership và
  access policy.
- Production MUST chạy trực tiếp trên Debian 12+ hoặc Ubuntu LTS bằng Node.js, Nginx và
  systemd. Docker hoặc container runtime MUST NOT là dependency triển khai.
- Release MUST là artifact versioned có checksum, migration preflight, backup, health check,
  atomic activation và rollback runbook. Service MUST chạy bằng user giới hạn quyền và
  secrets MUST không nằm trong source hoặc artifact công khai.
- Mục tiêu năng lực tối thiểu là 50 chi nhánh, 100.000 học viên, 5.000 lớp hoạt động và
  100.000 tài nguyên thư viện; thiết kế truy vấn, phân trang và reporting MUST được kiểm thử
  theo các ngưỡng này.

## Quy trình phát triển và quality gates

1. Mọi feature MUST bắt đầu từ spec có user scenarios, testable requirements, edge cases và
   measurable success criteria.
2. Plan MUST ghi Technical Context, Constitution Check, research decisions, data model,
   contracts và quickstart validation trước khi tạo tasks.
3. Tasks MUST chia theo module và user story, nêu dependency, migration, contract, test và
   rollout/rollback khi áp dụng.
4. Thay đổi module boundary, license entitlement, schema giao dịch, public contract hoặc AI
   policy MUST được review bởi owner của miền liên quan.
5. Database migration MUST tương thích theo chiến lược expand, migrate, contract; migration
   phá hủy MUST không chạy trong cùng release với code còn phụ thuộc schema cũ.
6. Mọi external event handler MUST chứng minh idempotency. Mọi signed webhook hoặc license
   document MUST kiểm tra chữ ký, timestamp/replay policy và trạng thái revoke khi áp dụng.
7. Pull request MUST nêu tác động đến scope, module/license, audit, dữ liệu nhạy cảm,
   performance và rollback. Complexity vượt modular monolith MUST có bằng chứng tải hoặc
   ownership và quyết định kiến trúc được ghi nhận.
8. Staging release MUST vượt qua quickstart P1, authorization matrix, integration contracts,
   payroll/finance invariants, license lifecycle, theme accessibility và native Linux
   deployment checks trước production approval.
9. Production change MUST có người chịu trách nhiệm, kế hoạch quan sát sau triển khai và
   đường rollback. Incident ảnh hưởng dữ liệu, tài chính, payroll, quyền hoặc AI MUST được
   lập biên bản và tạo action items có owner.

## Governance

Constitution này là nguồn quản trị cao nhất cho đặc tả, plan, tasks, implementation và
review của HN-LMS. Khi artifact khác mâu thuẫn với constitution, artifact đó MUST được sửa
hoặc phải có amendment constitution được phê duyệt trước khi tiếp tục.

Amendment MUST mô tả thay đổi, lý do, tác động đến module, dữ liệu, migration, license,
security, testing và rollout. Amendment MUST được project owner phê duyệt và cập nhật Sync
Impact Report. Thay đổi phá vỡ hoặc loại bỏ nguyên tắc là MAJOR; thêm nguyên tắc hoặc mở rộng
nghĩa vụ đáng kể là MINOR; làm rõ không thay đổi nghĩa vụ là PATCH.

Mọi spec và plan MUST có Constitution Check. Mọi code review và release review MUST kiểm tra
các quality gates liên quan. Ngoại lệ MUST có phạm vi, lý do, rủi ro, người phê duyệt, ngày
hết hạn và remediation plan; ngoại lệ vĩnh viễn không được dùng thay cho amendment.

Constitution MUST được rà soát khi bắt đầu feature lớn, trước production release có thay đổi
kiến trúc hoặc ít nhất mỗi 12 tháng. Compliance issue ảnh hưởng quyền, tài chính, payroll,
license hoặc AI MUST chặn release cho đến khi được xử lý hoặc có ngoại lệ hữu hạn được phê
duyệt theo quy định trên.

**Version**: 1.1.0 | **Ratified**: 2026-08-19 | **Last Amended**: 2026-08-19

