import type { Metadata } from "next";
import { ProductBoundary } from "@/components/shell/product-boundary";

export const metadata: Metadata = {
  title: { default: "Control Plane", template: "%s | HN LMS Control Plane" },
  description: "Quản trị tenant, license và deployment HN LMS.",
};

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return <ProductBoundary space="platform">{children}</ProductBoundary>;
}
