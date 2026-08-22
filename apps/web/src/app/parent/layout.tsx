import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ProductBoundary } from "@/components/shell/product-boundary";

export const metadata: Metadata = {
  title: { default: "Parent Portal", template: "%s | HN LMS" },
  description: "Không gian phụ huynh theo dõi học viên được ủy quyền.",
};

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProductBoundary space="lms">
      <AppShell workspace="parent">{children}</AppShell>
    </ProductBoundary>
  );
}
