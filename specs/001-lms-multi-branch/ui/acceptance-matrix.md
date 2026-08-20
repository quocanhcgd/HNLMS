# UI Acceptance Matrix

## Global gate

| Area | Acceptance |
|---|---|
| Default | First visit without preference is Vietnamese + dark |
| Theme | Light/dark/system đổi không reload/flash và lưu độc lập |
| Locale | vi/en giữ route, query, tab, workspace và safe form state |
| Routing | Direct load, refresh, back/forward và deep link giữ shell/active nav |
| Authorization | Hidden navigation + backend denial; forbidden không lộ scoped data |
| Responsive | Không overlap tại sáu viewport; workflow chính vẫn dùng được |
| Keyboard | Luồng chính hoàn thành không cần pointer; focus rõ và trả đúng |
| Contrast | WCAG AA trong light/dark cho preset được publish |
| Async | Loading/empty/error/pending/retry ổn định và trung thực |
| Localization | Không thiếu key; text expansion và tên dài không phá control |

## Screen gate

Mỗi screen trong inventory kiểm tra tối thiểu desktop 1440x900 và mobile 390x844, ở `vi+dark` mặc định, `en+dark`, `vi+light`, `en+light`. System kiểm tra bằng OS emulation. Populated, loading, empty, error và forbidden là bắt buộc.

## Critical workflows

1. Visitor tìm chương trình và gửi tư vấn.
2. Consultant lọc lead, mở timeline và chuyển trạng thái.
3. Academic manager mở class, xử lý conflict và xem capacity.
4. Parent đổi học viên và xem đúng delegation.
5. Student làm bài, mất mạng, autosave và submit an toàn.
6. Finance phân biệt payment pending/confirmed/refunded.
7. Admin preview/publish/rollback theme và chuyển locale.

## Evidence

- Playwright screenshots cho matrix chính.
- Accessibility scan cộng keyboard test thủ công cho critical workflows.
- Overflow checks bằng screenshot/layout assertions.
- Không qua gate nếu có overlap, inaccessible command, wrong-language/theme flash, cross-scope leak hoặc false-success financial state.
