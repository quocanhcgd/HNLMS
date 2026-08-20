# Screen Inventory

## UI foundation release

| ID | Screen | Space | Priority |
|---|---|---|---|
| UI-001 | Component catalog | Internal | Gate |
| UI-002 | Public landing | Public | P1 |
| UI-003 | Consultation form | Public | P1 |
| UI-004 | Platform tenant list/detail | Platform | P1 |
| UI-005 | Organization dashboard | LMS | P1 |
| UI-006 | Branch dashboard | LMS | P1 |
| UI-007 | Lead pipeline | LMS | P1 |
| UI-008 | Lead detail/timeline | LMS | P1 |
| UI-009 | Program and class list | LMS | P1 |
| UI-010 | Class detail | LMS | P1 |
| UI-011 | Student profile | LMS | P1 |
| UI-012 | Parent dashboard | LMS | P1 |
| UI-013 | Assessment attempt | LMS | P1 |
| UI-014 | Invoice/payment detail | LMS | P1 |
| UI-015 | Organization/access settings | LMS | P1 |
| UI-016 | Theme preview/publish | LMS | P1 |

## Required states

Mỗi screen mô tả loading, empty, populated, filtered-empty, validation error, server error, forbidden, stale data, provider pending và destructive confirmation khi áp dụng. Kiểm tra `vi/en` và `dark/light`; system kiểm tra runtime behavior.

## Wireframe fidelity

- Low fidelity: information hierarchy và workflow.
- Interactive prototype: shell, navigation, filter, tabs, dialog/sheet, locale/theme.
- Production reference: component catalog và UI-006, UI-007, UI-010, UI-012.
