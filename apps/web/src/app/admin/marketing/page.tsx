import type { Metadata } from "next";
import { MarketingDashboard } from "./marketing-dashboard";

export const metadata: Metadata = { title: "Marketing & tăng trưởng", description: "Điều hành chiến dịch, nguồn lead và nội dung công khai." };

export default function MarketingPage() {
  return <MarketingDashboard />;
}
