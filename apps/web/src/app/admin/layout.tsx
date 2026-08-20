import { AppShell } from "@/components/app-shell";
import { ProductBoundary } from "@/components/shell/product-boundary";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProductBoundary space="lms">
      <AppShell>{children}</AppShell>
    </ProductBoundary>
  );
}
