// hooks/useSocket.js
import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getToken } from '../utils/api';
import { useAuth } from './useAuth';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socketInstance = null;

const useSocket = () => {
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?._id) return;

    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        auth: { userId: String(user._id), token: getToken() },
        transports: ['websocket'],
        reconnectionAttempts: 5,
      });
    }
    socketRef.current = socketInstance;

    // Join personal room
    socketInstance.emit('join_personal', { userId: String(user._id) });

    // Join group rooms based on role
    socketInstance.emit('join_group', { groupType: 'interns' });
    if (user.role === 'supervisor') {
      socketInstance.emit('join_group', { groupType: 'supervisors' });
    }

    return () => {
      // Don't disconnect on unmount — keep persistent
    };
  }, [user?._id, user?.role]);

  const sendMessage = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('[useSocket] Not connected, cannot send:', event);
    }
  }, []);

  const onMessage = useCallback((event, handler) => {
    const sock = socketRef.current;
    if (!sock) return () => {};
    sock.on(event, handler);
    return () => sock.off(event, handler);
  }, []);

  return { sendMessage, onMessage };
};

export default useSocket;