import { useMutation } from "@tanstack/react-query";
import { baseApi } from "@/shared/api/base-api";
import { useAuthStore } from "@/entities/user/model/auth-store";
import { message } from "antd";

import { useNavigate } from "react-router-dom";

export const useLogin = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (values: any) => {
      const response = await baseApi.post("/auth/login", values);
      console.log("Login response:", response);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return response as any;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      message.success("Login successful!");
      navigate("/");
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.message || "Login failed";
      const isSuspended =
        errorMsg.toLowerCase().includes("deactivated") ||
        errorMsg.toLowerCase().includes("inactive");

      if (isSuspended) {
        navigate("/suspended");
      } else {
        message.error(errorMsg);
      }
    },
  });
};
