"use client";

import { useParams } from "next/navigation";
import TeacherCVView from "@/components/profile/TeacherCVView";

export default function TeacherProfilePageWrapper() {
  const params = useParams();
  const id = params?.id as string;
  
  if (!id) return null;
  
  return <TeacherCVView teacherId={id} enableGoBack={true} />;
}
