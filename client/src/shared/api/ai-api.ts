import { baseApi as api } from "@/shared/api/base-api";

export const aiApi = {
  translate: async (text: string) => {
    const response = await api.post<{ en: string; uz: string; ru: string }>(
      "/ai/translate",
      { text },
    );
    return response;
  },
};
