import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = localStorage.getItem('teampulse_token');
    socket = io({
      auth: { token },
      autoConnect: true,
      withCredentials: true,
    });
  }
  return socket;
};

export const connectSocket = (token: string): Socket => {
  if (socket) {
    socket.disconnect();
  }
  socket = io({
    auth: { token },
    autoConnect: true,
    withCredentials: true,
  });
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
