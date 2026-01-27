import { baseApi } from "@/shared/api/base-api";

export const backupApi = {
  createBackup: async () => {
    const response = await baseApi.post<{
      message: string;
      filePath: string;
    }>("/backups");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response as unknown as any; // unwrapping done in baseApi usually, but let's be safe or strict
  },

  restoreBackup: async (file: File, secret: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("secret", secret);

    const response = await baseApi.post("/backups/restore", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response as unknown as any;
  },

  getBackups: async () => {
    const response = await baseApi.get<
      {
        filename: string;
        size: number;
        createdAt: string;
      }[]
    >("/backups");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response as unknown as any;
  },

  getDownloadUrl: (filename: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    return `${baseUrl}/backups/${filename}`;
  },
};
