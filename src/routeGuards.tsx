import type { ReactNode } from "react";
import { useAuthContext } from "@/contexts";
import { Navigate } from "react-router";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthContext();
  if (loading) {
    return null; // or a loading spinner
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function RequireNoAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthContext();
  if (loading) {
    return null; // or a loading spinner
  }
  if (user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
