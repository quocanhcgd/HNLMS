import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ProductBoundary } from "@/components/shell/product-boundary";

export const metadata: Metadata = {
  title: { default: "LMS Application", template: "%s | HN LMS" },
  description: "Không gian vận hành LMS của tổ chức.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProductBoundary space="lms">
      <AppShell>{children}</AppShell>
    </ProductBoundary>
  );
}
