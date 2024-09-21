import { io } from 'socket.io-client';

let socket;

export const createSocket = (url) => {
    socket = io(url);
    return socket;
};

export const getSocket = () => {
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};