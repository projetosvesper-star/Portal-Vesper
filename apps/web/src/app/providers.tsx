import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren } from "react";

import { ToastProvider } from "../shared/components/ToastProvider";
import { PortalWebSocketProvider } from "../shared/hooks/PortalWebSocketProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <PortalWebSocketProvider>
        <ToastProvider>{children}</ToastProvider>
      </PortalWebSocketProvider>
    </QueryClientProvider>
  );
}
