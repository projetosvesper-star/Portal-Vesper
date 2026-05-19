import { usePortalWebSocketContext } from "./PortalWebSocketProvider";

export function usePortalWebSocket() {
  const { status } = usePortalWebSocketContext();
  return status;
}

export { usePortalWebSocketContext } from "./PortalWebSocketProvider";
