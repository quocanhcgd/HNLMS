# Design Tokens

## Semantic color roles

`background`, `foreground`, `surface`, `surface-muted`, `popover`, `primary`, `primary-foreground`, `secondary`, `muted`, `border`, `input`, `ring`, `success`, `warning`, `danger`, `info` và foreground tương ứng. Domain component chỉ dùng role, không dùng mã màu trực tiếp.

Dark dùng surface phân cấp, không pure black; light không pure white cho mọi layer. Cả hai phân biệt hover, selected, focus, disabled và trạng thái nghiệp vụ.

## Typography

- Sans font hỗ trợ đầy đủ dấu tiếng Việt.
- Scale: 12, 14, 16, 18, 20, 24, 30px; không scale theo viewport width.
- Weight: 400, 500, 600; body 14-16px tùy density.
- Letter spacing 0; line-height phù hợp tiếng Việt.

## Geometry

- Spacing base 4px: 4, 8, 12, 16, 20, 24, 32, 40.
- Radius: 4, 6, 8px; pill chỉ cho badge/avatar/control quy ước.
- Control height: compact 32px, default 36px, touch 44px.
- Header 56px; sidebar expanded khoảng 248px, collapsed 64px; giá trị cuối dùng token.
- Table row compact 40px, default 48px.

## Elevation and border

Ưu tiên border; shadow cho popover/dialog/sticky khi cần. Focus ring là token độc lập và rõ trên primary, danger, surface.

## Preset contract

Preset chứa light/dark token, typography, radius, logo refs và version. Không publish nếu thiếu token, contrast fail hoặc visual test có lỗi nghiêm trọng. Rollback là publish version cũ, không sửa lịch sử.

