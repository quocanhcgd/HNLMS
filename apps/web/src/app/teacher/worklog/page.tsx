import type { Metadata } from "next";
import { TeacherWorklogWorkspace } from "./teacher-worklog-workspace";
export const metadata: Metadata = { title: "Buổi dạy & worklog", description: "Xác nhận buổi dạy và công dạy." };
export default function TeacherWorklogPage() { return <TeacherWorklogWorkspace />; }
