import { io } from "socket.io-client";

export const socket = io(
    `${window.location.protocol}//${window.location.hostname}:4000`,
    {
        withCredentials: true,
        transports: ['websocket', 'polling']
    }
);

socket.on("connect", () => {
    console.log("Connected to Socket.IO server on port 4000");
});

socket.on("disconnect", () => {
    console.log("Disconnected from Socket.IO server");
});

socket.on("connect_error", (error) => {
    console.error("Socket.IO connection error:", error);
});