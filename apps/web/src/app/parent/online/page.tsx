import type { Metadata } from "next";
import { ParentOnlineWorkspace } from "./parent-online-workspace";
export const metadata: Metadata={title:"Lớp online của con",description:"Phụ huynh theo dõi buổi học online."};
export default function ParentOnlinePage(){return <ParentOnlineWorkspace/>}
