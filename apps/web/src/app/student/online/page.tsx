import type { Metadata } from "next";
import { StudentOnlineWorkspace } from "./student-online-workspace";
export const metadata: Metadata={title:"Lớp online",description:"Học viên tham gia và xem lại lớp online."};
export default function StudentOnlinePage(){return <StudentOnlineWorkspace/>}
