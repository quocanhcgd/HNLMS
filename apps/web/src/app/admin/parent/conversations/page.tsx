import { redirect } from "next/navigation";
export default function LegacyAdminParentConversationsRedirect() {
  redirect("/parent/conversations");
}
