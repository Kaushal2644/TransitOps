import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext({ socket: null, connected: false });

const SOCKET_URL = "http://localhost:5000";

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      setSocket((prev) => {
        prev?.disconnect();
        return null;
      });
      setConnected(false);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    const instance = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    instance.on("connect", () => setConnected(true));
    instance.on("disconnect", () => setConnected(false));
    setSocket(instance);

    return () => {
      instance.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

export const useSocketRefresh = (events, callback) => {
  const { socket } = useSocket();
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const eventsKey = events?.join(",");

  useEffect(() => {
    if (!socket || !eventsKey) return;

    const eventList = eventsKey.split(",");
    const handler = () => callbackRef.current?.();
    eventList.forEach((event) => socket.on(event, handler));

    return () => {
      eventList.forEach((event) => socket.off(event, handler));
    };
  }, [socket, eventsKey]);
};
