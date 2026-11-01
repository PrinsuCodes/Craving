import { io } from 'socket.io-client';

/**
 * Socket.io Client Service (Phase 7)
 *
 * Manages WebSocket connection to the Express backend (http://localhost:4000).
 * Scopes updates to individual order rooms so customers only receive updates
 * for their own active delivery.
 */

const SOCKET_SERVER_URL = 'http://localhost:4000';

let socketInstance = null;

export function getSocket() {
  if (!socketInstance) {
    socketInstance = io(SOCKET_SERVER_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'], // Fallback to polling if websockets are blocked
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected to backend tracking server:', socketInstance.id);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('[Socket] Connection warning (Backend may be offline):', err.message);
    });
  }
  return socketInstance;
}

/**
 * Join an order's private room to receive real-time driver updates
 */
export function joinOrderTrackingRoom(orderId) {
  const socket = getSocket();
  if (socket && orderId) {
    socket.emit('joinOrderRoom', String(orderId));
  }
}

/**
 * Leave an order's tracking room when leaving the page or closing the map
 */
export function leaveOrderTrackingRoom(orderId) {
  const socket = getSocket();
  if (socket && orderId) {
    socket.emit('leaveOrderRoom', String(orderId));
  }
}

/**
 * Listen for live driver location updates
 */
export function onDriverLocationUpdate(callback) {
  const socket = getSocket();
  socket.on('driverLocationUpdate', callback);
  return () => {
    socket.off('driverLocationUpdate', callback);
  };
}

/**
 * Listen for order status transitions (e.g. "Food Processing" -> "Out for delivery" -> "Delivered")
 */
export function onOrderStatusUpdate(callback) {
  const socket = getSocket();
  socket.on('orderStatusUpdate', callback);
  return () => {
    socket.off('orderStatusUpdate', callback);
  };
}

/**
 * Listen for real-time food item and menu category updates
 */
export function onFoodListUpdate(callback) {
  const socket = getSocket();
  socket.on('foodListUpdate', callback);
  return () => {
    socket.off('foodListUpdate', callback);
  };
}

/**
 * Emit a location update from driver to backend
 */
export function emitDriverLocationPing(orderId, lat, lng) {
  const socket = getSocket();
  if (socket && orderId) {
    socket.emit('sendLocationPing', { orderId: String(orderId), lat, lng });
  }
}
