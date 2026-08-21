import type { Metadata } from "next";
import { ContentListWorkspace } from "./content-list";

export const metadata: Metadata = {
  title: "Nội dung Landing Page",
  description: "Quản lý nội dung hiển thị trên trang landing page công khai.",
};

export default function MarketingContentPage() {
  return <ContentListWorkspace />;
}
