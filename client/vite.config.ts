import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    allowedHosts: ["app.hotelcloud.uz", "api.hotelcloud.uz"],
    strictPort: false,
  },
  preview: {
    port: 4175,
    strictPort: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "zustand",
            "@tanstack/react-query",
            "axios",
          ],
          antd: ["antd", "@ant-design/icons"],
          ui: ["lucide-react", "date-fns", "dayjs"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
