import { ProductBoundary } from "@/components/shell/product-boundary";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <ProductBoundary space="public">{children}</ProductBoundary>;
}
