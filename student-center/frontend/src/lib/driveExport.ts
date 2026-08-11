import { packageLessonToSCORMZip, InteractiveLesson } from "./scormPackager";

export interface DriveSaveResult {
  success: boolean;
  driveUrl?: string;
  filename: string;
  message: string;
}

/**
 * Lưu trực tiếp gói bài giảng SCORM .zip lên Google Drive của giáo viên
 */
export async function saveLessonToGoogleDrive(
  lesson: InteractiveLesson,
  token?: string
): Promise<DriveSaveResult> {
  try {
    const zipBlob = await packageLessonToSCORMZip(lesson);
    const filename = `MINDA_BaiGiang_${lesson.id}_SCORM.zip`;
    const file = new File([zipBlob], filename, { type: "application/zip" });

    const formData = new FormData();
    formData.append("file", file);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://minda.io.vn";
    const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("minda_token") : null);

    const headers: Record<string, string> = {};
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const res = await fetch(`${apiBase}/api/files/upload-to-drive`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    return {
      success: true,
      driveUrl: data.file_url || data.url || `https://drive.google.com/`,
      filename,
      message: `Đã lưu thành công gói SCORM "${filename}" vào Google Drive!`
    };
  } catch (error: any) {
    console.error("Google Drive Upload Error:", error);
    // Fallback: Trigger local download if Drive direct token upload fails
    return {
      success: false,
      filename: `MINDA_${lesson.id}.zip`,
      message: `Không thể đồng bộ Drive tự động: ${error.message}. Bạn có thể tải file trực tiếp về máy!`
    };
  }
}
