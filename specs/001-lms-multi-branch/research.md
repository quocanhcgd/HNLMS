# Research: LMS đa ngành đa chi nhánh

**Feature**: `001-lms-multi-branch`
**Date**: 2026-08-19

## Decision 1: Kiến trúc backend modular monolith và worker riêng

**Decision**: Dùng backend modular monolith stateless, chia theo module nghiệp vụ; worker chạy riêng cho tác vụ bất đồng bộ và tích hợp.

**Rationale**:

- Ghi danh, học phí, công nợ, payroll và quyền truy cập cần transaction và tính nhất quán cao.
- Phạm vi lớn nhưng chưa có bằng chứng cần microservices độc lập ngay từ đầu.
- Ranh giới module vẫn cho phép tách service sau này dựa trên tải và ownership thực tế.
- Worker tách riêng giúp xử lý retry, export, thông báo, AI, payroll và đồng bộ ngoài mà không chặn request người dùng.

**Alternatives considered**:

- Microservices ngay từ đầu: loại vì tăng chi phí vận hành và khó giữ nhất quán giữa enrollment, finance, payroll và ERP.
- Một ứng dụng không phân module: loại vì khó kiểm thử và dễ trộn quyền giữa các miền nghiệp vụ.

## Decision 2: Web responsive gồm public site và authenticated portals

**Decision**: Một web application có vùng public cho landing page và vùng xác thực cho quản trị, nhân sự, giáo viên, học viên, phụ huynh và tư vấn.

**Rationale**:

- Landing page cần tối ưu khả năng tìm kiếm và tốc độ truy cập.
- Portal nghiệp vụ cần phân quyền theo vai trò, chi nhánh, lớp và ủy quyền phụ huynh.
- Dùng chung domain model và quyền backend giúp lead, tư vấn, ghi danh và học tập liên tục.

**Alternatives considered**:

- Tách marketing site thành hệ thống khác: để sau nếu nhu cầu SEO hoặc đội vận hành yêu cầu độc lập.
- Chỉ xây portal nội bộ: không đáp ứng yêu cầu tạo lead và đăng ký tư vấn công khai.

## Decision 3: PostgreSQL là nguồn dữ liệu giao dịch chính

**Decision**: Dùng PostgreSQL cho dữ liệu tổ chức, học viên, lớp, học liệu metadata, đánh giá, phụ huynh, HRM, payroll, tài chính, audit và trạng thái tích hợp.

**Rationale**:

- Hỗ trợ quan hệ, transaction, constraint, migration và truy vấn báo cáo theo scope.
- Phù hợp mô hình đa chi nhánh dùng `organization_id` và `branch_id`.
- Có thể bổ sung read replica hoặc reporting read model khi dashboard tăng tải.

**Alternatives considered**:

- Database riêng cho từng chi nhánh: loại ở giai đoạn đầu vì làm phức tạp báo cáo hợp nhất và vận hành migration.
- NoSQL làm nguồn chính: loại vì payroll, công nợ, đối soát và quyền cần quan hệ và transaction rõ.

## Decision 4: Private object storage cho file lớn

**Decision**: Lưu video, tài liệu, bài nộp, chứng từ, phiếu lương, recording và file export trong object storage private; database chỉ giữ metadata, hash, owner và quyền.

**Rationale**:

- File học tập và recording có kích thước lớn.
- Pre-signed URL sau authorization bảo vệ tài nguyên giới hạn quyền.
- Versioning và lifecycle bảo toàn lịch sử học liệu, chứng từ và recording.

**Alternatives considered**:

- Lưu file trực tiếp trong database: loại vì ảnh hưởng hiệu năng và backup.
- Public URL: loại vì không đáp ứng quyền theo chi nhánh, lớp, học viên và phụ huynh.

## Decision 5: Outbox, inbox và idempotency cho tích hợp

**Decision**: Ghi event nghiệp vụ và outbox trong cùng transaction; worker gửi payment/accounting/meeting events; webhook đi qua inbox có khóa chống trùng; mọi handler phải idempotent.

**Rationale**:

- Thanh toán, ERP và nền tảng họp có thể timeout, retry hoặc gửi event trùng.
- Không được cập nhật công nợ, payroll hoặc chứng từ hai lần.
- Outbox giúp không mất event sau khi transaction nghiệp vụ commit.

**Alternatives considered**:

- Gọi provider trực tiếp trong request transaction: loại vì provider chậm hoặc lỗi làm kéo dài transaction và khó retry.
- Chỉ dùng polling: loại vì chậm và không tận dụng webhook, nhưng vẫn giữ reconcile job để sửa event thất lạc.

## Decision 6: AI Gateway với human oversight

**Decision**: Mọi tác vụ AI đi qua AI Gateway/module governance để kiểm tra quyền, tối thiểu hóa dữ liệu, lưu phiên bản, confidence, nguồn, log và trạng thái duyệt.

**Rationale**:

- AI được phép tự động hóa cao nhưng dữ liệu học tập, nhân sự, payroll và tài chính nhạy cảm.
- Điểm, lương, quyền lợi, kỷ luật và kết luận gian lận cần người chịu trách nhiệm.
- Một gateway tập trung chính sách giúp các module không gọi provider tùy tiện.

**Alternatives considered**:

- Cho từng module gọi trực tiếp AI provider: loại vì khó kiểm soát dữ liệu, quota, audit và thay model.
- Chỉ dùng AI ở chế độ gợi ý: không đáp ứng mong muốn tự động hóa cao, nhưng vẫn là fallback an toàn cho tác vụ rủi ro.

## Decision 7: Testing strategy theo rủi ro nghiệp vụ

**Decision**: Kết hợp unit test cho quy tắc tính toán, authorization matrix test, contract test cho provider, integration test cho transaction/outbox và E2E cho các luồng P1.

**Rationale**:

- Rủi ro lớn nhất nằm ở lộ dữ liệu liên chi nhánh, thanh toán trùng, payroll sai, đồng bộ ERP trùng và AI vượt quyền.
- Success criteria yêu cầu kiểm chứng cả thời gian phản hồi, năng lực tải và độ chính xác dữ liệu.

**Alternatives considered**:

- Chỉ test UI E2E: loại vì không bao phủ đầy đủ rule tài chính, quyền và retry.
- Chỉ unit test: loại vì không phát hiện lỗi hợp đồng provider, transaction boundary và authorization xuyên module.

## Resolved Technical Unknowns

- **Project type**: Web application responsive gồm public site, authenticated portals, backend API và background workers.
- **Storage**: PostgreSQL giao dịch, Redis cache/queue, private object storage cho file.
- **External boundaries**: Payment provider, meeting provider, accounting/ERP và AI provider adapters.
- **Multi-branch isolation**: `organization_id`, `branch_id`, authorization ở service/domain và kiểm thử negative access.
- **Async consistency**: Outbox/inbox, retry, dead-letter queue, idempotency và reconcile định kỳ.
- **AI governance**: Policy check, data minimization, audit, confidence, explanation, human review và manual fallback.

## Decision 8: Stack và triển khai native Linux

**Decision**: Chọn TypeScript 5.x trên Node.js LTS; Next.js cho web, NestJS cho backend modular monolith, Vitest cho unit/integration, Playwright cho E2E, OpenAPI cho contract; triển khai trực tiếp trên Debian 12+ hoặc Ubuntu LTS bằng artifact versioned, Nginx và systemd, không dùng Docker.

**Rationale**:

- Một ngôn ngữ cho frontend, backend, worker và contract types giảm sai lệch giữa các lớp.
- Next.js phù hợp public landing page và authenticated portals.
- NestJS cung cấp module boundary rõ cho backend lớn.
- Vitest/Playwright bao phủ unit, integration và browser flows.
- systemd quản lý process, restart, resource limit và log; Nginx xử lý TLS/reverse proxy.
- Artifact versioned cùng symlink `current` cho phép atomic switch và rollback mà không cần container runtime.

**Alternatives considered**:

- Docker/container runtime: loại theo yêu cầu vận hành; vẫn giữ build reproducible bằng lockfile và CI artifact.
- Chạy process bằng shell hoặc terminal session: loại vì thiếu restart policy, isolation và health management.
- Chọn cloud/provider cụ thể ngay: loại vì chưa có ràng buộc hạ tầng; dùng adapter và cloud-agnostic interfaces.

## Decision 9: UI dựa trên Mantine và semantic theme tokens

**Decision**: Dùng Mantine làm component/theme system với CSS Modules khi cần style riêng; preset thương hiệu được chuyển thành Mantine theme override và semantic token package thay vì sửa từng component nghiệp vụ.

**Rationale**:

- Mantine cung cấp bộ component React đầy đủ, theme API tập trung và khả năng mở rộng bằng wrapper/composition thuộc repository.
- Semantic tokens như `background`, `foreground`, `primary`, `muted`, `destructive`, `border`, `radius` tách giao diện khỏi màu cụ thể.
- Component nghiệp vụ chỉ compose primitives và variants, nên đổi preset/màu/font/radius không ảnh hưởng logic.
- Theme có thể cấu hình theo organization/brand và kiểm tra contrast/accessibility.

**Alternatives considered**:

- Hard-code màu trong từng màn hình: loại vì preset mới gây sửa diện rộng và giao diện không nhất quán.
- Xây toàn bộ component từ đầu: loại vì tăng chi phí accessibility và hành vi tương tác.
- Dùng nhiều UI framework song song: loại vì token, spacing và interaction dễ xung đột.

## Decision 10: Modular monolith với module manifest và entitlement gate

**Decision**: Mỗi business module khai báo manifest gồm key, version, dependencies, permissions, routes, navigation, migrations, jobs, events và license feature key. Module được enable theo organization bằng effective entitlement; backend guard kiểm tra cả permission và license.

**Rationale**:

- Cho phép thương mại hóa theo gói mà vẫn giữ transaction nhất quán của modular monolith.
- Dependency graph ngăn bật module thiếu nền tảng và tránh trạng thái hệ thống không hợp lệ.
- Navigation và frontend routes được tạo từ module registry, nhưng backend vẫn là nguồn enforcement cuối.
- Tắt module không xóa dữ liệu; migration luôn tiến về trước để tenant có thể bật lại an toàn.

**Alternatives considered**:

- Build/deploy một binary riêng cho từng gói: loại vì tạo nhiều biến thể khó nâng cấp và vá bảo mật.
- Chỉ dùng frontend feature flags: loại vì API vẫn có thể bị gọi trực tiếp.
- Microservices theo module: để tương lai khi có tải/ownership độc lập; hiện tại tăng chi phí vận hành không cần thiết.

## Decision 11: License control plane tách biệt logic với tenant runtime

**Decision**: Có super-admin license control plane quản lý product, plan, module entitlement, quota và license tháng/năm/trọn đời. Tenant runtime nhận license document ký số, xác minh locally, cache entitlement và đồng bộ định kỳ.

**Rationale**:

- Tách quyền thương mại cấp toàn hệ thống khỏi admin của từng organization.
- Chữ ký số ngăn tenant tự sửa module/quota/thời hạn.
- Local verification giúp hệ thống không phụ thuộc license server ở từng request.
- Grace period và trạng thái read-only có kiểm soát giảm gián đoạn khi hết hạn hoặc mất kết nối.
- Audit toàn bộ issue, renew, revoke, module change và override.

**Alternatives considered**:

- Kiểm tra license server trên mọi request: loại vì tăng latency và tạo single point of failure.
- Chỉ lưu cờ license trong database tenant: loại vì khó chống chỉnh sửa và khó quản lý thương mại tập trung.
- Lifetime license không có maintenance metadata: loại vì vẫn cần quản lý phiên bản, support/updates và revoke khi khóa bị lộ.

## Remaining Implementation Choices

Nhà cung cấp cloud, payment, meeting, accounting/ERP và AI cụ thể vẫn được chọn trong các task tích hợp sau khi có thông tin tài khoản, yêu cầu pháp lý và hợp đồng dịch vụ. Các lựa chọn này không làm thay đổi contract nghiệp vụ, idempotency, audit và authorization đã định nghĩa.


## Decision 12: Mantine và Next.js App Router

**Decision**: Dùng Mantine làm UI component/theme system, TanStack Table cho bảng nghiệp vụ nâng cao, Lucide React cho icon và `next-intl` cho tiếng Việt/Anh. Web dùng duy nhất Next.js App Router; không dùng React Router.

**Rationale**:

- Mantine cung cấp primitive và composition đủ rộng cho form, dialog, sheet, navigation, dates, notifications và dark/light theme.
- Theme có thể quản lý tập trung, phù hợp default dark, locale độc lập và brand preset theo organization.
- TanStack Table giữ quyền kiểm soát server-side filtering, sorting, pagination, selection và virtualization.
- Next.js App Router phù hợp public landing, authenticated portal, Server Components, nested layouts, loading/error boundaries và deep link.
- Một router duy nhất tránh xung đột URL, back/forward, auth boundary và active navigation.

**Decision 13: TypeScript là ngôn ngữ application chính**

TypeScript strict đủ cho frontend, NestJS API, worker và shared contracts. Dùng OpenAPI/DTO/schema validation để bảo vệ ranh giới runtime; dùng PostgreSQL/SQL cho persistence và shell scripts cho deployment, không cần thêm Python, Go hoặc Java ở giai đoạn đầu.



## Decision 14: Versioned lesson block và question type registry

**Decision**: Bài giảng và câu hỏi dùng JSON document có schema version; editor, renderer, review và scoring được đăng ký qua registry TypeScript nội bộ. TipTap dùng cho rich-text block, Zod kiểm tra payload runtime. Tenant không được tải JavaScript plugin tùy ý.

**Rationale**: Block/question có thể mở rộng nhưng vẫn kiểm soát XSS, migration, accessibility, license và compatibility. HTML tùy ý không đủ an toàn và khó tái sử dụng trên player, search hoặc mobile.

## Decision 15: Private resumable media pipeline

**Decision**: Dùng Uppy với S3 multipart hoặc tus cho upload lớn; source ở object storage private. Worker versioned chạy scan, Sharp image derivatives, FFmpeg/ffprobe audio-video processing, LibreOffice headless chuyển slide sang PDF và PDF.js/react-pdf để xem. Vidstack dùng cho video, WaveSurfer.js cho audio/waveform khi cần.

**Rationale**: Upload hoàn tất không đồng nghĩa asset có thể phát; scan, metadata và derivative phải có state/retry riêng. Adapter video provider cho phép dùng Mux/Cloudflare Stream/MediaConvert thay self-hosted transcoding mà không đổi contract.

## Decision 16: MCP không thuộc runtime learning

**Decision**: Player, recorder, uploader, lesson renderer và assessment engine dùng component/API/worker bình thường và không phụ thuộc MCP. MCP chỉ có thể dùng cho development tooling hoặc AI Gateway truy cập catalog/search đã qua authorization và data-minimization policy.
