# Quickstart Validation: LMS đa ngành đa chi nhánh

**Feature**: `001-lms-multi-branch`

Tài liệu này là hướng dẫn kiểm chứng end-to-end ở mức nghiệp vụ. Cấu hình framework, provider và lệnh cụ thể được điền trong giai đoạn triển khai sau khi repository có source code.

## Prerequisites

- Môi trường development hoặc staging đã có frontend, backend và worker.
- Database đã chạy migration và có dữ liệu seed cho một trung tâm với hai chi nhánh.
- Có người dùng mẫu: super admin, branch manager A/B, consultant, finance officer, HR officer, teacher, student, parent.
- Có adapter sandbox cho payment, meeting, accounting/ERP và AI.
- Có storage private cho học liệu, chứng từ và recording.
- Có công cụ chạy unit, integration, contract và E2E tests.
- Có máy Debian 12+ hoặc Ubuntu LTS với Node.js LTS, Nginx, systemd, PostgreSQL/Redis endpoint và user dịch vụ không có quyền root.
- Không cài hoặc sử dụng Docker/container runtime trong deployment validation.
- Có super admin, product plan và signing key sandbox để phát hành license kiểm thử.

## Scenario 0: Native Linux deployment

1. Build immutable release artifact bằng lockfile trong CI hoặc build host.
2. Chuyển artifact tới `/opt/hn-lms/releases/{version}` trên Debian/Ubuntu.
3. Cài production dependencies, kiểm tra checksum và environment file permission.
4. Chạy migration preflight và backup.
5. Chuyển symlink `/opt/hn-lms/current` sang release mới.
6. Restart `hn-lms-web`, `hn-lms-api`, `hn-lms-worker` bằng systemd.
7. Reload Nginx sau config test.
8. Chạy health/smoke tests; rollback symlink nếu lỗi.

**Expected**:

- Không có Docker process hoặc container dependency.
- Service chạy bằng user giới hạn quyền, tự restart và có health/log qua systemd/journald.
- Nginx phục vụ TLS/reverse proxy đúng route.
- Release rollback được mà không sửa artifact cũ.
- Migration phá hủy không chạy trước khi có bước tương thích và backup.

## Scenario 1: Scope đa chi nhánh

1. Tạo branch A và branch B.
2. Gán branch manager A chỉ vào branch A.
3. Tạo lớp, học viên, hóa đơn và báo cáo ở cả hai branch.
4. Đăng nhập bằng branch manager A.
5. Mở danh sách lớp, học viên, finance và report.

**Expected**:

- Chỉ dữ liệu branch A xuất hiện.
- Request cố truy cập ID thuộc branch B bị từ chối.
- Export cũng không chứa branch B.
- Audit event ghi lại thao tác bị từ chối.

## Scenario 2: Landing page đến ghi danh

1. Tạo nội dung landing page về chương trình và bài tin ở trạng thái draft.
2. Preview bằng admin, sau đó publish.
3. Truy cập public catalog và gửi consultation form.
4. Phân lead cho consultant branch A.
5. Gắn bài thi đầu vào, hoàn tất bài thi và tạo đề xuất lớp.
6. Chuyển lead thành student và enroll vào lớp.

**Expected**:

- Draft không hiển thị public; published hiển thị đúng.
- Lead lưu source, consent, nhu cầu và branch quan tâm.
- Tư vấn viên thấy lịch sử xử lý và kết quả đầu vào.
- Enrollment tạo nghĩa vụ tài chính đúng một lần.

## Scenario 3: Parent delegation và trao đổi ba bên

1. Liên kết parent với student A và student B.
2. Cấp parent quyền xem tiến độ cho A nhưng chỉ xem lịch cho B.
3. Tạo conversation gồm tổ chức, teacher và parent của A.
4. Thu hồi quyền xem tiến độ của A.
5. Thử mở tiến độ A và lịch B.

**Expected**:

- Quyền A/B độc lập.
- Parent xem được đúng dữ liệu theo từng delegation.
- Conversation chỉ hiển thị thành viên đúng scope.
- Sau thu hồi, dữ liệu mới bị từ chối; lịch sử trao đổi vẫn bảo toàn theo retention.

## Scenario 4: Payment, công nợ và kế toán

1. Tạo enrollment và invoice.
2. Tạo payment attempt với idempotency key.
3. Gửi payment webhook confirmed hai lần.
4. Kiểm tra invoice, balance và receipt.
5. Worker gửi AccountingSyncEvent.
6. Giả lập timeout sau khi ERP đã nhận; chạy retry.
7. Chạy reconciliation.

**Expected**:

- Hai webhook chỉ tạo một hiệu ứng tài chính.
- Balance và receipt cập nhật từ event đã xác thực.
- ERP không nhận chứng từ trùng.
- Timeout được chuyển retryable/pending và reconcile phát hiện đúng trạng thái.
- Redirect trình duyệt không thể tự đánh dấu paid.

## Scenario 5: Payroll và thu chi chi nhánh

1. Tạo employee/teacher, contract, lịch làm và teacher assignment ở hai branch.
2. Ghi nhận attendance, leave và giờ dạy.
3. Tạo finance entry có chứng từ và một expense thiếu chứng từ.
4. Tính payroll period.
5. Kiểm tra lương cơ bản, giờ/lớp, phụ cấp, khấu trừ, thuế và bảo hiểm.
6. Approve rồi lock period.
7. Thử sửa trực tiếp dữ liệu đã khóa; tạo adjustment hợp lệ.

**Expected**:

- Dữ liệu nhiều branch phân bổ đúng, không tính trùng.
- Expense thiếu chứng từ không vào finalized ledger.
- Payroll dùng calculation version và có snapshot nguồn.
- Period locked không sửa trực tiếp được.
- Adjustment có lý do, người duyệt và audit.

## Scenario 6: Online class và recording

1. Tạo class có modality online.
2. Tạo online session và gọi meeting adapter sandbox.
3. Nhận event participant joined/left và recording ready.
4. Đăng nhập bằng student đã enroll, parent có quyền và user ngoài scope.
5. Mở join link và recording.

**Expected**:

- Join link chỉ cấp đúng người có quyền.
- Attendance không nhân đôi khi event gửi lại.
- Recording private và permission theo LMS.
- Provider timeout tạo trạng thái pending/retry, không báo thành công giả.

## Scenario 7: Assessment và English pathway

1. Tạo câu hỏi và duyệt vào bank.
2. Tạo entrance assessment với rule xếp level.
3. Cho candidate làm bài, submit một lần và gửi submit lặp.
4. Tạo English pathway có listening, speaking, reading, writing.
5. Nộp speaking/writing cần manual review.

**Expected**:

- Attempt không bị nhân đôi.
- Kết quả đầu vào gán level/lớp đề xuất theo rule.
- Bốn skill có tiến độ riêng.
- Speaking/writing ở trạng thái chờ chấm cho đến khi teacher review.

## Scenario 7A: Bài giảng và media processing

1. Tạo lesson draft gồm rich text, image, audio, video, PDF/slide, quiz checkpoint và speaking prompt.
2. Upload file lớn, ngắt kết nối giữa chừng rồi resume; gửi complete lặp với cùng idempotency key.
3. Chạy scan và processing sandbox cho image derivative, audio metadata, video thumbnail/HLS và slide-to-PDF.
4. Publish khi asset ready; thử publish khi asset còn processing hoặc rejected.
5. Học viên đúng scope xem/phát, đổi tốc độ, mở caption/transcript và tiếp tục từ vị trí cũ; user ngoài scope dùng direct URL.

**Expected**:

- Block schema/version hợp lệ và preview khớp renderer; payload executable bị từ chối.
- Resume không tạo asset trùng; complete lặp chỉ có một effect.
- Uploading/scanning/processing/ready/rejected/failed hiển thị trung thực; source không mất khi derivative lỗi.
- Lesson không publish khi asset bắt buộc chưa ready.
- Playback dùng signed URL có hạn; user ngoài scope và URL hết hạn bị từ chối.

## Scenario 7B: Assessment đa phương tiện và speaking

1. Tạo câu hỏi choice, fill blank, matching, ordering, image/audio/video prompt, file upload và speaking response.
2. Bắt đầu attempt, autosave nhiều answer sequence và gửi request sequence cũ đến sau.
3. Mất mạng, retry upload speaking, nghe lại và submit hai lần.
4. Giáo viên chấm speaking/writing bằng rubric và timestamp feedback.
5. Chạy luồng bằng keyboard trên desktop và viewport mobile.

**Expected**:

- Renderer dùng đúng question schema; sequence mới nhất không bị request cũ ghi đè.
- Retry media không tạo answer asset trùng; submit lặp không tạo attempt/result trùng.
- Speaking/writing chờ manual review; feedback và adjustment có audit.
- Component hoạt động responsive, có save/connectivity state và fallback khi microphone không khả dụng.

## Scenario 8: AI governance

1. Gửi AI task gợi ý khóa học trong scope của consultant.
2. Gửi task tạo câu hỏi và yêu cầu nguồn tham chiếu.
3. Gửi task dự báo bỏ học với dữ liệu ngoài scope.
4. Gửi task đề xuất thay đổi lương hoặc kết luận gian lận.
5. Cho provider timeout và output confidence thấp.
6. Review, reject, appeal một task.

**Expected**:

- Task ngoài scope bị policy từ chối hoặc loại dữ liệu.
- Output có model/prompt version, nguồn, confidence, safety flags và audit.
- Điểm, lương, quyền lợi, kỷ luật và kết luận gian lận không thay đổi tự động.
- Confidence thấp chuyển needs_review.
- Provider lỗi vẫn có manual fallback.
- Appeal tạo lịch sử xem xét mới và không xóa audit trước đó.

## Scenario 9: Mantine preset và brand theme

1. Chọn preset Mantine mặc định và publish theme cho organization A.
2. Đổi semantic colors, font, radius và logo bằng preset khác.
3. Preview ở landing page, admin, teacher, student và parent portals; kiểm tra light/dark mode.
4. Publish preset mới rồi rollback về version trước.
5. Chạy accessibility và visual regression tests ở desktop/mobile.
6. Xóa preference đã lưu và tải mới ứng dụng; kiểm tra mặc định tiếng Việt + dark theme.
7. Chuyển độc lập giữa Việt/Anh và light/dark/system; refresh và mở deep link ở mỗi tổ hợp.

**Expected**:

- Không cần sửa component nghiệp vụ khi đổi preset.
- Màu, typography, radius và states thay đổi nhất quán qua semantic tokens.
- Contrast, focus, disabled, destructive và validation states đạt kiểm tra.
- Organization B không bị ảnh hưởng bởi theme của A.
- Rollback theme không làm mất dữ liệu hoặc route.
- Lần truy cập đầu hiển thị tiếng Việt và dark theme, không flash giao diện sáng hoặc chuỗi ngôn ngữ sai.
- Locale và theme được lưu độc lập; đổi một lựa chọn không đặt lại lựa chọn còn lại hoặc làm mất filter, tab, form draft và ngữ cảnh workspace.

## Scenario 10: Tenant database isolation và migration

1. Provision hai tenant SaaS, mỗi tenant có database riêng và migration version riêng.
2. Tạo dữ liệu, backup, quota và license độc lập cho từng tenant.
3. Lập lịch chuyển tenant A sang instance riêng, thông báo trước và mở maintenance window.
4. Chuyển tenant A sang read-only, chạy final sync, checksum/schema/data validation.
5. Kích hoạt license đích, cutover instance riêng và chạy smoke tests.
6. Giả lập validation thất bại để kiểm tra rollback.
7. Kiểm tra tenant B vẫn hoạt động trong toàn bộ quy trình.

**Expected**:

- Không thể truy cập chéo database hoặc instance của tenant.
- Backup, restore và migration của tenant A không ảnh hưởng tenant B.
- Giao dịch mới trong maintenance window bị chặn rõ ràng.
- Chỉ cutover sau khi final sync, validation và license đích đạt.
- Rollback khôi phục tenant A về source khi validation thất bại.
- Tenant B không bị downtime.

## Scenario 11: Module và license lifecycle

1. Tạo plan Basic chỉ có landing, CRM và academic core; plan Pro thêm assessment, online class, HRM, payroll và AI.
2. Phát license monthly cho organization A và lifetime cho organization B.
3. Bật module được cấp, thử bật module thiếu entitlement và module thiếu dependency.
4. Truy cập API module bị tắt bằng URL trực tiếp.
5. Gia hạn license, thay đổi quota, chuyển active sang grace, expired và revoked.
6. Ngắt kết nối control plane trong grace period và sau grace period.
7. Bật lại module đã tắt và kiểm tra dữ liệu lịch sử.

**Expected**:

- Frontend navigation và backend API cùng phản ánh effective module state.
- API module disabled trả lỗi license/module rõ ràng, không chỉ ẩn menu.
- Module thiếu dependency không được bật.
- Monthly/yearly hết hạn theo thời gian; lifetime không hết quyền sử dụng nhưng vẫn có policy support/update.
- Runtime xác minh chữ ký local và tiếp tục trong grace policy khi control plane tạm mất kết nối.
- Hết grace chuyển hành vi theo policy đã cấu hình, không xóa dữ liệu.
- Tenant admin không tự tăng quota hoặc cấp module.
- Issue, renew, revoke, override và verification đều có audit.

## Performance validation

Kiểm thử với dữ liệu tối thiểu:

- 50 chi nhánh.
- 100.000 hồ sơ học viên.
- 5.000 lớp hoạt động.
- 100.000 tài nguyên thư viện.

Xác minh:

- Các thao tác chính đạt mục tiêu thời gian trong spec.
- Cập nhật tiến độ/điểm danh hiển thị trong 5 giây.
- Kết quả thi tự động trong 10 giây.
- Thanh toán đã xác nhận cập nhật công nợ trong 1 phút.
- Report không làm nghẽn transaction database.
- Queue không tăng backlog ngoài ngưỡng cảnh báo.

## Release gate

Chỉ coi feature sẵn sàng khi:

- Unit, authorization, contract, integration và E2E P1 tests đạt.
- Không có lỗi scope đa chi nhánh hoặc parent delegation.
- Payment/ERP/meeting duplicate và retry tests đạt.
- Payroll lock/adjustment tests đạt.
- AI high-risk review và manual fallback tests đạt.
- Module dependency, backend license enforcement, quota, expiry, grace và revoke tests đạt.
- Mantine preset/theme visual regression và accessibility tests đạt trên desktop/mobile.
- Native Debian/Ubuntu install, systemd restart, Nginx validation và release rollback tests đạt mà không dùng Docker.
- Backup restore và migration compatibility được kiểm chứng trên staging.
- Audit, alerting và dashboard vận hành có thể truy vết lỗi bằng correlation ID.

## UI Foundation Acceptance Gate - 2026-08-21

**Scope**: T009 và T012-T022, kiểm tra bằng local Playwright/Chromium và quality scripts từ repository.

### Evidence

- Route boundaries: public, platform và LMS có nested layout/product marker riêng; public/platform không render LMS sidebar.
- Route states: `loading.tsx`, `error.tsx`, `not-found.tsx`, product metadata, refresh, deep link và back/forward đã kiểm tra.
- Theme/locale: mặc định tiếng Việt + dark; vi/en persistence; light/dark/system; semantic preset preview/publish/rollback; contrast validation.
- Navigation: typed manifest, active parent/child, role/module visibility mock, desktop collapse và mobile drawer.
- Shared UI: Mantine wrappers, page/data states, lead empty state và TanStack Table integration.
- Responsive: no horizontal overflow cho `/`, `/platform`, `/admin`, `/admin/leads`, `/ui-preview` ở desktop 1440x900 và mobile Pixel 5.
- Accessibility: Axe WCAG 2A/2AA/2.1A/2.1AA không còn lỗi serious/critical trên năm route; keyboard drawer/menu flow đạt.

### Commands and results

```text
npm run format:check       PASS
npm run lint               PASS
npm run typecheck          PASS
npm test                   PASS - 30 tests
npx playwright test         PASS - 28 tests across chromium, visual-desktop, visual-mobile, accessibility
```

### Viewports

- Visual desktop: 1440x900.
- Visual mobile: Pixel 5 emulation.
- Existing responsive E2E also covers 390x844 behavior for public/platform/LMS drawers.

### Gate decision

- **PASS for UI foundation**: T009 and T012-T022 có artifact và bằng chứng kiểm thử.
- **Next allowed work**: bắt đầu T024 foundational backend song song với các việc còn lại của UI/organization.
- **Owner sign-off**: Accepted for T023 on 2026-08-21; UI foundation gate is closed.
- **Still blocked**: production full-stack vẫn bị chặn bởi database/auth/provider/infra readiness checklist.

## US2 Public Acquisition Acceptance Gate - 2026-08-22

**Scope**: T047-T052, từ landing content lifecycle đến public catalog, SEO và consultation submission.

### Evidence

- Draft và revoked content không xuất hiện trong published query; publish tăng version và ghi actor/timestamp.
- Public content query giữ organization scope và không làm lộ content của tenant khác.
- Consultation bắt buộc consent, lưu source/nhu cầu/branch và trả cùng kết quả khi gửi lại idempotency key.
- E2E duyệt landing page, catalog, chi tiết chương trình và gửi consultation với payload/source/consent/submission key đúng.
- Metadata trang chủ, sitemap, robots và loading/error/empty states được kiểm tra; history navigation ổn định dưới tải song song.

### Commands and results

```text
npm test                                      PASS - 277 tests
npm run typecheck                             PASS
npm run lint                                  PASS
npm run format:check                          PASS
npm run build                                 PASS - 22 static/SSG pages
npx playwright test --project=chromium        PASS - 17 tests
```

### Gate decision

- **PASS for US2**: Phase 5 hoàn tất và có contract/E2E evidence cho ba acceptance scenario.
- **Next allowed work**: bắt đầu T053 trong Phase 6 / US3 admission flow.
