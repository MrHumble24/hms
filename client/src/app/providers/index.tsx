import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "react-router-dom";
import { ConfigProvider, App } from "antd";
import { queryClient } from "@/shared/api/query-client";
import { router } from "./router/config";

export const Providers = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 6,
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <App>
          <RouterProvider router={router} />
        </App>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ConfigProvider>
  );
};
