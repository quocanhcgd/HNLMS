import { redirect } from "next/navigation";
export default function LegacyAdminParentRedirect() {
  redirect("/parent");
}
