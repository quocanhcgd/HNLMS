import type { Metadata } from "next";
import { ProductBoundary } from "@/components/shell/product-boundary";
import { PublicShell } from "@/components/shell/public-shell";
import "./public-catalog.css";

export const metadata: Metadata = {
  title: { default: "HN Learning", template: "%s | HN Learning" },
  description: "Nền tảng học tập và đào tạo đa chi nhánh.",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProductBoundary space="public">
      <PublicShell>{children}</PublicShell>
    </ProductBoundary>
  );
}
