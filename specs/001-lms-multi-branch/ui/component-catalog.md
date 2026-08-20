# Component Catalog

## Primitives

Button, icon button, input, textarea, number/currency input, select, combobox, checkbox, radio, switch, date/time/range picker, tabs, badge, avatar, tooltip, dropdown, dialog, alert dialog, sheet, toast và separator.

## Data and domain compositions

Page header, breadcrumb, workspace switcher, navigation group, filter bar, search, data table, column settings, pagination, empty/error/forbidden state, skeleton, file upload, timeline, calendar, KPI block, form section, status banner, confirmation flow và command result.

## Required states

Mỗi component áp dụng có default, hover, focus-visible, active/selected, disabled, loading, read-only, validation error và destructive. Kiểm tra dark/light, vi/en, keyboard và touch.

## Ownership

- `apps/web/src/components/ui`: wrapper/composition dùng chung quanh Mantine, không domain logic.
- `apps/web/src/components/shell`: public/platform/LMS shell.
- `apps/web/src/components/domain`: composition nghiệp vụ.
- Không tự xây lại component khi Mantine đã có primitive phù hợp; chỉ wrapper để chuẩn hóa default, accessibility và domain-neutral behavior.

## Catalog gate

Trang kiểm thử nội bộ hiển thị mọi state, text dài, loading, validation, icon-only, disabled và destructive. Visual tests chạy 390x844 và 1440x900 cho vi/en, dark/light.


