import { ProductBoundary } from "@/components/shell/product-boundary";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <ProductBoundary space="platform">{children}</ProductBoundary>;
}
