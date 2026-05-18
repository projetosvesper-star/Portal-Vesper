import { useQuery } from "@tanstack/react-query";
import { PropsWithChildren } from "react";

import { apiRequest } from "../api/client";
import { PortalModule } from "../api/types";
import { ForbiddenPage } from "../components/ForbiddenPage";

type ProtectedModuleRouteProps = PropsWithChildren<{
  moduleKey: string;
}>;

export function ProtectedModuleRoute({ moduleKey, children }: ProtectedModuleRouteProps) {
  const { data: modules = [], isLoading } = useQuery({
    queryKey: ["me", "modules"],
    queryFn: () => apiRequest<PortalModule[]>("/api/me/modules"),
  });

  if (isLoading) {
    return <div className="text-sm text-slate-400">Carregando permissoes...</div>;
  }

  if (!modules.some((module) => module.key === moduleKey)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}
