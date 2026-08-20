# Accessibility

Mục tiêu WCAG 2.2 AA cho luồng chính.

## Keyboard and focus

- Mọi command, navigation, dropdown, dialog, sheet, tabs, table action và form dùng được bằng bàn phím.
- Focus-visible rõ ở light/dark; dialog trap focus và trả focus đúng trigger; có skip link tới main.
- Thứ tự tab theo cấu trúc đọc, không dùng tabindex dương.

## Semantics

- Một `h1` cho page; heading không bỏ cấp tùy tiện.
- Form control liên kết label, description và error.
- Table có accessible name, header scope và sort state.
- Status quan trọng dùng live region vừa đủ, không đọc lặp.

## Color and motion

- Contrast text/control/focus đạt AA ở mọi theme/preset publish được.
- State dùng icon + text + màu. Chart có label/value hoặc bảng thay thế.
- Tôn trọng reduced motion.

## Language

- Root `lang` cập nhật `vi`/`en`; title, aria-label, alt, validation và announcement đều dịch.
- Không hiện key i18n hoặc chuỗi sai ngôn ngữ; CI kiểm tra parity key.
