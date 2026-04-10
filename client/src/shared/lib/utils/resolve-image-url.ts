export const resolveImageUrl = (path: string | undefined | null) => {
  if (!path) return "";

  // If it's already a full URL (external or previously saved local with host), return as is
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";

  // Ensure we don't double slash
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${apiUrl}${cleanPath}`;
};
