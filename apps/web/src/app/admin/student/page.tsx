import { redirect } from "next/navigation";
export default function LegacyAdminStudentRedirect() {
  redirect("/student");
}
