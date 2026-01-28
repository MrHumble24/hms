import axios from "axios";

export const baseApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

baseApi.interceptors.request.use((config) => {
  // Auth token
  const token = localStorage.getItem("auth-storage")
    ? JSON.parse(localStorage.getItem("auth-storage")!).state.token
    : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Multi-tenant headers - read fresh from localStorage on each request
  const tenantId = localStorage.getItem("activeTenantId");
  const branchId = localStorage.getItem("activeBranchId");

  console.log(
    "🔄 API Request - Branch ID from localStorage:",
    branchId,
    "URL:",
    config.url,
  );

  if (tenantId) {
    config.headers["x-tenant-id"] = tenantId;
  }
  if (branchId) {
    config.headers["x-branch-id"] = branchId;
  }

  return config;
});

baseApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || "";
    const errorText = String(message).toLowerCase();

    // Check for suspension-related keywords
    const isSuspended =
      errorText.includes("deactivated") ||
      errorText.includes("inactive") ||
      errorText.includes("suspended") ||
      errorText.includes("account has been deactivated") ||
      errorText.includes("organization is currently deactivated") ||
      errorText.includes("organization is suspended") ||
      errorText.includes("inactive tenant");

    const isSuspensionStatus =
      status === 401 || status === 403 || status === 400;

    if (isSuspensionStatus && isSuspended) {
      // Clear persistence explicitly
      localStorage.removeItem("auth-storage");
      localStorage.removeItem("activeTenantId");
      localStorage.removeItem("activeBranchId");
      localStorage.removeItem("tenant-storage");

      window.location.href = "/suspended";
      return Promise.reject(error);
    }

    if (status === 401) {
      localStorage.removeItem("auth-storage");
      localStorage.removeItem("activeTenantId");
      localStorage.removeItem("activeBranchId");
      localStorage.removeItem("tenant-storage");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
