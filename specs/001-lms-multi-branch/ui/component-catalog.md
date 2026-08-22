# Component Catalog

## Primitives

Button, icon button, input, textarea, number/currency input, select, combobox, checkbox, radio, switch, date/time/range picker, tabs, badge, avatar, tooltip, dropdown, dialog, alert dialog, sheet, toast và separator.

## Data and domain compositions

Page header, breadcrumb, workspace switcher, navigation group, filter bar, search, data table, column settings, pagination, empty/error/forbidden state, skeleton, file upload, timeline, calendar, KPI block, form section, status banner, confirmation flow và command result.

## Data table standard

- Toàn bộ bảng dữ liệu trong authenticated spaces (License control plane và LMS application) phải dùng **một loại bảng chuẩn: TanStack Table 8.x** cho state/sort/filter/pagination/column visibility/selection, render qua wrapper dùng chung trong `apps/web/src/components/ui`.
- Không tạo bảng riêng bằng Mantine `Table`, `div` grid, card-list giả bảng hoặc thư viện khác nếu không có ADR chấp thuận. Mantine chỉ dùng để render primitive/table markup bên trong wrapper chuẩn.
- Mọi list page dùng cùng cấu trúc: `PageHeader` → toolbar search/filter/action → table wrapper → pagination/summary → empty/error/loading state. Không để mỗi trang tự bố trí toolbar, bảng, padding, badge, sort icon hoặc empty state theo kiểu khác nhau.
- Column sizing, row height, sticky/overflow, hover/selected, sort indicator, action column, column settings/export và pagination phải lấy từ component chuẩn; trang chỉ khai báo column definition và dữ liệu.
- Mobile/tablet dùng cùng responsive policy: filter vào sheet, bảng được horizontal scroll hoặc chuyển sang card-list chuẩn do table component cung cấp; không tự chế layout mobile khác từng trang.

## Shell, topbar and breadcrumb standard

- Authenticated LMS pages use one shell only: sidebar + sticky topbar + content. Sidebar collapse must change the actual shell column width (expanded about 248px, collapsed about 64px), not merely hide labels while preserving the old width.
- The sidebar collapse/expand control belongs at the start of the topbar, visually adjacent to the sidebar edge. It must not sit inside page content, table toolbar or account action group.
- Breadcrumb lives in the topbar immediately after the sidebar toggle and is derived from the navigation manifest/route. Page-level `PageHeader` must not repeat breadcrumbs or `HN LMS / ...` text.
- Topbar utility actions must stay pinned to the far right: search, locale switch, theme switch, notifications and user menu. Breadcrumb takes flexible space between sidebar toggle and the right action group.
- Topbar search is icon-first: show only a search icon by default; reveal the text input only after the user clicks search. Do not render a permanently open search input in the topbar.

## Table visual standard

- Data table headers use the same filled primary color as application buttons via theme variables, not an ad-hoc bright color. Header text must use the matching primary contrast token.
- All TanStack-rendered tables must inherit this header style from the shared table wrapper/CSS; individual pages must not override table header colors.

## Page layout and visual consistency

- Trong cùng một product space, các trang phải dùng chung layout primitive (`PageFrame`/`PageHeader`/`PageToolbar`/panel/table wrapper), cùng mật độ, spacing, border radius, surface và semantic color roles.
- Không hard-code màu trực tiếp hoặc dùng ngẫu nhiên `cyan/blue/teal/orange/grape` trong domain page. Màu nghiệp vụ phải map qua token/semantic role chung (`primary`, `success`, `warning`, `danger`, `info`, `muted`) để các trang nhìn nhất quán ở dark/light.
- Dashboard, list, detail, form và workflow page có thể khác cấu trúc nghiệp vụ nhưng không được khác “ngôn ngữ thị giác”: cùng header, toolbar, panel, badge/status, button hierarchy, empty/loading/error state.
- Review UI bắt buộc kiểm tra độ đồng nhất giữa các trang trước khi merge; nếu một trang cần pattern mới, cập nhật catalog này trước rồi mới dùng.

## Required states

Mỗi component áp dụng có default, hover, focus-visible, active/selected, disabled, loading, read-only, validation error và destructive. Kiểm tra dark/light, vi/en, keyboard và touch.

## Ownership

- `apps/web/src/components/ui`: wrapper/composition dùng chung quanh Mantine, không domain logic.
- `apps/web/src/components/shell`: public/platform/LMS shell.
- `apps/web/src/components/domain`: composition nghiệp vụ.
- Không tự xây lại component khi Mantine đã có primitive phù hợp; chỉ wrapper để chuẩn hóa default, accessibility và domain-neutral behavior.

## Catalog gate

Trang kiểm thử nội bộ hiển thị mọi state, text dài, loading, validation, icon-only, disabled và destructive. Visual tests chạy 390x844 và 1440x900 cho vi/en, dark/light.
