import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ProductBoundary } from "@/components/shell/product-boundary";

export const metadata: Metadata = {
  title: { default: "Student Portal", template: "%s | HN LMS" },
  description: "Không gian học tập tự phục vụ của học viên.",
};

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProductBoundary space="lms">
      <AppShell workspace="student">{children}</AppShell>
    </ProductBoundary>
  );
}
