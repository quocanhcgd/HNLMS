import type { Metadata } from "next";
import { StudentEnglishWorkspace } from "./student-english-workspace";

export const metadata: Metadata = { title: "Lộ trình tiếng Anh", description: "Học viên theo dõi tiến bộ bốn kỹ năng tiếng Anh." };
export default function StudentEnglishPage() { return <StudentEnglishWorkspace />; }
