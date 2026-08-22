import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ProductBoundary } from "@/components/shell/product-boundary";

export const metadata: Metadata = {
  title: { default: "Teacher Workspace", template: "%s | HN LMS" },
  description: "Không gian giảng dạy cho giáo viên và trợ giảng.",
};

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProductBoundary space="lms">
      <AppShell workspace="teacher">{children}</AppShell>
    </ProductBoundary>
  );
}
