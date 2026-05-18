import { useEffect, useState } from "react";

import { API_BASE_URL } from "../api/client";
import { useAuthStore } from "../auth/store";

function toWebSocketUrl(apiBaseUrl: string) {
  const url = new URL(apiBaseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  return url.toString();
}

export function usePortalWebSocket() {
  const token = useAuthStore((state) => state.accessToken);
  const [status, setStatus] = useState<"offline" | "connecting" | "online">("offline");

  useEffect(() => {
    if (!token) {
      setStatus("offline");
      return;
    }

    const socket = new WebSocket(toWebSocketUrl(API_BASE_URL), ["portal-vesper", `token.${token}`]);
    setStatus("connecting");

    socket.onopen = () => setStatus("online");
    socket.onclose = () => setStatus("offline");
    socket.onerror = () => setStatus("offline");

    const heartbeat = window.setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    return () => {
      window.clearInterval(heartbeat);
      socket.close();
    };
  }, [token]);

  return status;
}
