import { baseApi } from "@/shared/api/base-api";

export const uploadApi = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await baseApi.post<{ url: string }>("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response as unknown as { url: string };
  },
};
