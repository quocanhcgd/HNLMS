import type { Metadata } from "next";
import { ProductBoundary } from "@/components/shell/product-boundary";
import { PublicShell } from "@/components/shell/public-shell";
import "./public-catalog.css";

const siteName = "HN Learning";
const defaultDescription =
  "Nền tảng học tập và đào tạo đa chi nhánh. Chương trình IELTS, Tiếng Anh giao tiếp, Tiếng Anh thiếu niên và kỹ năng học thuật với giáo viên đồng hành.";
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hanoilearning.vn";

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  metadataBase: new URL(baseUrl),
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName,
    title: siteName,
    description: defaultDescription,
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: siteName }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: defaultDescription,
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProductBoundary space="public">
      <PublicShell>{children}</PublicShell>
    </ProductBoundary>
  );
}
