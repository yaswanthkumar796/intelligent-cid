import { Server } from "socket.io";

let io: Server;

export const initSocket = (server: any) => {

  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST"]
    }
  });

  return io;
};

export const getIO = () => io;