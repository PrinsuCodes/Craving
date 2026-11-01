import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import './MyOrders.css';
import { StoreContext } from '../../Context/StoreContext.jsx';
import { assets } from "../../assets/assets.js";
import axios from 'axios';
import FloatingDeliveryTracker from '../../components/Tracking/FloatingDeliveryTracker.jsx';
import ToastNotification from '../../components/Tracking/ToastNotification.jsx';
import { onOrderStatusUpdate, joinOrderTrackingRoom, getSocket } from '../../services/socketService.js';

const MyOrders = () => {
    const [data, setData] = useState([]);
    const [activeFloatingOrder, setActiveFloatingOrder] = useState(null);
    const [toast, setToast] = useState(null);
    const deliveredToastShownRef = useRef(new Set());
    const outForDeliveryToastShownRef = useRef(new Set());
    const toastSeqRef = useRef(0);
    const { url, token } = useContext(StoreContext);

    const showToast = (message, type = 'success') => {
        toastSeqRef.current += 1;
        setToast({
            id: toastSeqRef.current,
            message,
            type,
        });
    };

    const fetchOrders = useCallback(async () => {
        if (!token) return;
        try {
            const response = await axios.post(
                url + "/api/order/userorders",
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const orders = response.data.data || [];
            setData(orders);
            // Join real-time tracking rooms for all orders of this customer
            orders.forEach((order) => {
                if (order._id) {
                    joinOrderTrackingRoom(order._id);
                }
            });
        } catch (error) {
            console.log("error fetching orders: ", error);
        }
    }, [url, token]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Secondary real-time synchronization:
    // 1. Polling fallback every 10 seconds to guarantee fresh state
    // 2. Immediate refresh when user focuses window
    // 3. Re-subscribe and fetch on socket reconnect
    useEffect(() => {
        if (!token) return;

        const pollInterval = setInterval(() => {
            fetchOrders();
        }, 10000);

        const handleWindowFocus = () => {
            fetchOrders();
        };
        window.addEventListener('focus', handleWindowFocus);

        const socket = getSocket();
        const handleSocketConnect = () => {
            fetchOrders();
        };
        socket.on('connect', handleSocketConnect);

        return () => {
            clearInterval(pollInterval);
            window.removeEventListener('focus', handleWindowFocus);
            socket.off('connect', handleSocketConnect);
        };
    }, [token, fetchOrders]);

    // Real-time status transitions listener via WebSockets
    useEffect(() => {
        const unsubscribe = onOrderStatusUpdate((update) => {
            console.log("[MyOrders] Received real-time order status update:", update);
            if (!update?.orderId) return;

            // 1. Instantly update order status in customer orders list without page reload
            setData((prevData) => {
                const orderExists = prevData.some((order) => String(order._id) === String(update.orderId));
                if (!orderExists) return prevData;

                return prevData.map((order) => {
                    if (String(order._id) === String(update.orderId)) {
                        return {
                            ...order,
                            status: update.status,
                            deliveryLocation: update.deliveryLocation || order.deliveryLocation,
                        };
                    }
                    return order;
                });
            });

            const updateStatusLower = (update.status || '').toLowerCase();

            // 2. Synchronize active floating map tracker if currently tracking this order
            setActiveFloatingOrder((current) => {
                if (!current || String(current._id) !== String(update.orderId)) {
                    return current;
                }
                if (updateStatusLower === 'delivered' || updateStatusLower === 'cancelled') {
                    return null;
                }
                return {
                    ...current,
                    status: update.status,
                    deliveryLocation: update.deliveryLocation || current.deliveryLocation,
                };
            });

            // 3. When order transitions to "Out for delivery", notify customer in top-right corner
            if (updateStatusLower === 'out for delivery') {
                setData((currentOrders) => {
                    const isUserOrder = currentOrders.some((order) => String(order._id) === String(update.orderId));
                    if (isUserOrder && !outForDeliveryToastShownRef.current.has(update.orderId)) {
                        outForDeliveryToastShownRef.current.add(update.orderId);
                        showToast("Your order is now out for delivery! Click 'Track Order' to follow live.", "info");
                    }
                    return currentOrders;
                });
            }

            // 4. When order transitions to "Delivered", close tracker and show success toast
            if (updateStatusLower === 'delivered') {
                setData((currentOrders) => {
                    const isUserOrder = currentOrders.some((order) => String(order._id) === String(update.orderId));
                    if (isUserOrder && !deliveredToastShownRef.current.has(update.orderId)) {
                        deliveredToastShownRef.current.add(update.orderId);
                        showToast("Order delivered successfully!", "success");
                    }
                    return currentOrders;
                });
            }
        });

        return () => unsubscribe();
    }, []);

    // Handle "Track Order" button click according to workflow requirements
    const handleTrackOrderClick = (order) => {
        const statusLower = (order.status || '').toLowerCase();

        // 1. Order Delivered Behavior
        if (statusLower === 'delivered') {
            setActiveFloatingOrder(null);
            showToast("Order delivered successfully!", "success");
            return;
        }

        // 2. Order Cancelled Behavior
        if (statusLower === 'cancelled') {
            setActiveFloatingOrder(null);
            showToast("This order has been cancelled.", "warning");
            return;
        }

        // 3. Pending / Food Processing / Preparing Behavior
        if (
            statusLower === 'food processing' ||
            statusLower === 'preparing' ||
            statusLower === 'pending' ||
            statusLower === 'confirmed'
        ) {
            setActiveFloatingOrder(null);
            showToast(
                "Your order is currently being prepared. Live map tracking will activate once out for delivery.",
                "info"
            );
            return;
        }

        // 4. Out for Delivery -> Open the floating live map popup in the top-right corner
        if (statusLower === 'out for delivery') {
            if (activeFloatingOrder && activeFloatingOrder._id === order._id) {
                // Clicking again toggles it off
                setActiveFloatingOrder(null);
            } else {
                setActiveFloatingOrder(order);
            }
        }
    };

    return (
        <div className='my-orders'>
            <div className="my-orders-header-row">
                <h2>My Orders</h2>
                <span className="live-orders-count">
                    {data.length} {data.length === 1 ? 'order' : 'orders'} placed
                </span>
            </div>

            {/* Success / Status Toast Notification in Top-Right Corner */}
            {toast && (
                <ToastNotification
                    key={toast.id || toast.message}
                    message={toast.message}
                    type={toast.type}
                    duration={4000}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Floating Live Map Popup in Top-Right Corner */}
            {activeFloatingOrder && (
                <FloatingDeliveryTracker
                    orderId={activeFloatingOrder._id}
                    order={activeFloatingOrder}
                    backendUrl={url}
                    token={token}
                    onClose={(reason) => {
                        if (reason?.delivered) {
                            if (!deliveredToastShownRef.current.has(activeFloatingOrder._id)) {
                                deliveredToastShownRef.current.add(activeFloatingOrder._id);
                                showToast("Order delivered successfully!", "success");
                            }
                        }
                        setActiveFloatingOrder(null);
                    }}
                />
            )}

            <div className="container">
                {data.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        <p>No orders placed yet. Click <strong>"Live Tracking"</strong> in the top navbar to test the map!</p>
                    </div>
                )}

                {data.map((order, index) => {
                    const orderId = order._id || index;
                    const statusLower = (order.status || '').toLowerCase();
                    const isOutForDelivery = statusLower === 'out for delivery';
                    const isDelivered = statusLower === 'delivered';
                    const isTrackerOpen = activeFloatingOrder && activeFloatingOrder._id === order._id;

                    return (
                        <div key={orderId} className="my-orders-item-wrapper">
                            <div className={`my-orders-order ${isTrackerOpen ? 'order-card-tracking-active' : ''}`}>
                                <img src={assets.parcel_icon} alt="Parcel" />
                                <p>
                                    {order.items.map((item, idx) => {
                                        if (idx === order.items.length - 1) {
                                            return item.name + " x " + item.quantity;
                                        } else {
                                            return item.name + " x " + item.quantity + ", ";
                                        }
                                    })}
                                </p>
                                <p>${order.amount}.00</p>
                                <p>Items: {order.items.length}</p>

                                {/* Dynamic Status Pill */}
                                <p className="order-status-pill-cell">
                                    <span className={`status-dot ${isOutForDelivery ? 'status-dot-active' : isDelivered ? 'status-dot-delivered' : ''}`}>
                                        &#x25cf;
                                    </span>
                                    <b className={`status-text status-${statusLower.replace(/\s+/g, '-')}`}>
                                        {order.status}
                                    </b>
                                </p>

                                <button
                                    onClick={() => handleTrackOrderClick(order)}
                                    className={`track-order-btn ${isOutForDelivery ? 'btn-out-for-delivery' : ''} ${isTrackerOpen ? 'btn-active-tracking' : ''}`}
                                >
                                    {isTrackerOpen
                                        ? 'Tracking Live ✕'
                                        : isOutForDelivery
                                        ? 'Track Order 🛵'
                                        : 'Track Order'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default MyOrders;
