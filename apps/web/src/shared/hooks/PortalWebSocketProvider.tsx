import React, { createContext, PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getRuntimeConfig } from "../config/runtimeConfig";
import { useAuthStore } from "../auth/store";

type PortalWebSocketStatus = "offline" | "connecting" | "online";

export type PortalWebSocketEvent = {
  type: string;
  payload?: unknown;
  timestamp?: string;
};

type Subscriber = (event: PortalWebSocketEvent) => void;

type PortalWebSocketContextValue = {
  status: PortalWebSocketStatus;
  subscribe: (handler: Subscriber) => () => void;
  send: (data: unknown) => void;
};

const PortalWebSocketContext = createContext<PortalWebSocketContextValue | null>(null);

function toWebSocketUrl(apiBaseUrl: string) {
  if (apiBaseUrl.startsWith("ws:") || apiBaseUrl.startsWith("wss:")) {
    return apiBaseUrl;
  }

  const url = new URL(apiBaseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  return url.toString();
}

export function PortalWebSocketProvider({ children }: PropsWithChildren) {
  const token = useAuthStore((state) => state.accessToken);
  const [status, setStatus] = useState<PortalWebSocketStatus>("offline");

  const socketRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Set<Subscriber>>(new Set());
  const heartbeatRef = useRef<number | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);

  const subscribe = useCallback((handler: Subscriber) => {
    subscribersRef.current.add(handler);
    return () => subscribersRef.current.delete(handler);
  }, []);

  const send = useCallback((data: unknown) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(typeof data === "string" ? data : JSON.stringify(data));
  }, []);

  useEffect(() => {
    const clearHeartbeat = () => {
      if (heartbeatRef.current) window.clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    };

    const clearReconnect = () => {
      if (reconnectRef.current) window.clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    };

    if (!token) {
      setStatus("offline");
      clearHeartbeat();
      clearReconnect();
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }

    let stopped = false;

    clearHeartbeat();
    clearReconnect();
    socketRef.current?.close();
    socketRef.current = null;

    const connect = () => {
      if (stopped) return;

      const socket = new WebSocket(toWebSocketUrl(getRuntimeConfig().wsBaseUrl), ["portal-vesper", `token.${token}`]);
      socketRef.current = socket;
      setStatus("connecting");

      socket.onopen = () => {
        reconnectAttemptRef.current = 0;
        setStatus("online");
        clearHeartbeat();
        heartbeatRef.current = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
        }, 30_000);
      };

      socket.onclose = () => {
        if (socketRef.current === socket) socketRef.current = null;
        clearHeartbeat();
        setStatus("offline");

        if (!stopped) {
          const delay = Math.min(1000 * 2 ** reconnectAttemptRef.current, 10_000);
          reconnectAttemptRef.current += 1;
          clearReconnect();
          reconnectRef.current = window.setTimeout(connect, delay);
        }
      };

      socket.onerror = () => {
        setStatus("offline");
        socket.close();
      };

      socket.onmessage = (message) => {
        try {
          const parsed = JSON.parse(message.data as string) as PortalWebSocketEvent;
          if (parsed?.type === "pong" || parsed?.type === "ping") return;
          subscribersRef.current.forEach((handler) => handler(parsed));
        } catch {
          // Ignore messages outside the expected event envelope.
        }
      };
    };

    connect();

    return () => {
      stopped = true;
      clearHeartbeat();
      clearReconnect();
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [token]);

  const value = useMemo<PortalWebSocketContextValue>(() => ({ status, subscribe, send }), [status, subscribe, send]);

  return <PortalWebSocketContext.Provider value={value}>{children}</PortalWebSocketContext.Provider>;
}

export function usePortalWebSocketContext() {
  const ctx = React.useContext(PortalWebSocketContext);
  if (!ctx) {
    throw new Error("usePortalWebSocketContext deve ser usado dentro de <PortalWebSocketProvider />");
  }
  return ctx;
}
