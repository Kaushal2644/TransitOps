import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user || !user.isActive) return next(new Error("User not found or inactive"));

      socket.user = { id: user._id.toString(), role: user.role };
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`role:${socket.user.role}`);
    socket.join(`user:${socket.user.id}`);
  });

  return io;
};

export const getIO = () => io;
