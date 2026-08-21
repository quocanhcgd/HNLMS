export type AccessSection = "roles" | "scope-grants";
export type AccessNavigationItem = { key: AccessSection; label: string; description: string };
export const accessNavigation: AccessNavigationItem[] = [
  { key: "roles", label: "Vai trò & quyền", description: "Gán quyền theo chức năng" },
  { key: "scope-grants", label: "Phạm vi dữ liệu", description: "Giới hạn theo đơn vị và hồ sơ" },
];
export const accessPermissionGroups = [
  { key: "organization", label: "Tổ chức", permissions: ["organization:read", "organization:update"] },
  { key: "users", label: "Người dùng", permissions: ["users:read", "users:assign"] },
  { key: "learning", label: "Đào tạo", permissions: ["classes:read", "classes:write", "students:read"] },
  { key: "finance", label: "Tài chính", permissions: ["invoices:read", "reports:export"] },
] as const;
export const accessUsers = [
  { id: "u-001", name: "Nguyễn Minh Anh", email: "minh.anh@hnlms.vn", role: "Quản lý chi nhánh", scope: "Cơ sở Cầu Giấy" },
  { id: "u-002", name: "Trần Hoàng Nam", email: "hoang.nam@hnlms.vn", role: "Tư vấn viên", scope: "2 chi nhánh" },
  { id: "u-003", name: "Lê Bảo Ngọc", email: "bao.ngoc@hnlms.vn", role: "Giáo viên", scope: "Lớp IELTS Foundation A1" },
] as const;
