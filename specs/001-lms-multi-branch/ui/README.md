# UI/UX Specification Index

Bộ tài liệu này là nguồn yêu cầu giao diện cho public landing, license control plane và LMS application. UI stack: Mantine + TanStack Table + Lucide React + next-intl. `spec.md` quyết định phạm vi nghiệp vụ; thư mục này quyết định cấu trúc trình bày, tương tác và tiêu chí nghiệm thu UI.

## Quyết định mặc định

- Locale mặc định khi chưa có preference: `vi`.
- Theme mặc định khi chưa có preference: `dark`.
- Hỗ trợ tiếng Việt (`vi`) và English (`en`).
- Hỗ trợ light, dark và system; system theo OS nhưng preference vẫn được giữ là `system`.
- Locale và theme lưu độc lập. Đổi một lựa chọn không làm mất route, query, workspace, filter hoặc dữ liệu form.

## Tài liệu

- [design-direction.md](./design-direction.md)
- [information-architecture.md](./information-architecture.md)
- [role-navigation.md](./role-navigation.md)
- [screen-inventory.md](./screen-inventory.md)
- [screen-specifications.md](./screen-specifications.md)
- [interaction-patterns.md](./interaction-patterns.md)
- [responsive-rules.md](./responsive-rules.md)
- [accessibility.md](./accessibility.md)
- [content-guidelines.md](./content-guidelines.md)
- [design-tokens.md](./design-tokens.md)
- [component-catalog.md](./component-catalog.md)
- [acceptance-matrix.md](./acceptance-matrix.md)
- [multimedia-components.md](./multimedia-components.md)

## Thứ tự nghiệm thu

1. Chốt design direction, IA và navigation theo vai trò.
2. Nghiệm thu token, typography, locale và theme runtime.
3. Nghiệm thu component catalog và ba application shell.
4. Nghiệm thu dashboard, lead pipeline, class detail và parent dashboard.
5. Chạy acceptance matrix desktop/mobile trước khi nhân rộng module.



