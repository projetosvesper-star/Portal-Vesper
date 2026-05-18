import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuthStore } from "./store";

export function ProtectedRoute() {
  const location = useLocation();
  const token = useAuthStore((state) => state.accessToken);
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
