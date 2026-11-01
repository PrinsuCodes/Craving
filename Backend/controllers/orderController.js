import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECERET_KEY);

// Place a new order
const placeOrder = async (req,res) => {
    const frontend_url = "https://craving-ph98.onrender.com/";

    try {
        const newOrder = new orderModel({
            userId: req.body.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address,
            customerCoords: {
                lat: req.body.customerLat || 12.9352,
                lng: req.body.customerLng || 77.6245,
            }
        });

        await newOrder.save();
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });

        const line_items = req.body.items.map((item) => ({
            price_data: {
                currency: "inr",
                product_data: {
                    name: item.name,
                },
                unit_amount: item.price * 100,
            },
            quantity: item.quantity,
        }));

        // Adding Delivery charges
        line_items.push({
            price_data: {
                currency: "inr",
                product_data: {
                    name: "Delivery Charges",
                },
                unit_amount: 2 * 100,
            },
            quantity: 1,
        });

        const session = await stripe.checkout.sessions.create({
            line_items: line_items,
            mode: 'payment',
            success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
        });

        res.json({ success: true, session_url: session.url });
    } catch (error) {
        console.error('error placing order:', error.message);
        res.status(500).json({ success: false, message: "failed to place order" });
    }
};

const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;
    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, { payment: true });
            res.json({ success: true, message: "payment success" });
        } else {
            await orderModel.findByIdAndDelete(orderId);
            res.json({ success: false, message: "payment fail" });
        }
    } catch (error) {
        console.error('error verifying order', error.message);
        res.status(500).json({ success: false, message: "fail to verify order" });
    }
};

const userOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.body.userId });
        res.json({ success: true, data: orders });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "error" });
    }
};

// List all order for admin
const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({});
        res.json({ success: true, data: orders });
    } catch (error) {
        console.log("error: ", error);
        res.status(500).json({ success: false, message: "fail to load orders" });
    }
};

// Update status for an order
const updateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        
        let updateData = { status };

        // When order moves to Out for delivery, initialize starting driver coordinates if absent
        if (status && status.toLowerCase() === "out for delivery") {
            const existingOrder = await orderModel.findById(orderId);
            if (!existingOrder?.deliveryLocation?.lat) {
                updateData.deliveryLocation = {
                    lat: 12.9716,
                    lng: 77.5946,
                    updatedAt: new Date(),
                };
            }
        }

        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true }
        );

        // Notify active tracking clients via WebSocket if attached to req.app
        const io = req.app.get("socketio");
        if (io) {
            const eventPayload = {
                orderId: String(orderId),
                status,
                deliveryLocation: updatedOrder?.deliveryLocation,
            };
            console.log(`[Socket] Broadcasting orderStatusUpdate: orderId=${orderId}, status=${status}`);
            
            // 1. Emit to private order room (for customers actively viewing tracker)
            io.to(`order:${orderId}`).emit("orderStatusUpdate", eventPayload);
            
            // 2. Broadcast globally to all connected customers so their orders page updates instantly without reload
            io.emit("orderStatusUpdate", eventPayload);
        } else {
            console.warn("[Socket] Warning: socketio instance not found on req.app");
        }

        res.json({ success: true, message: "order status updated", data: updatedOrder });
    } catch (error) {
        console.log("error: ", error);
        res.status(500).json({ success: false, message: "failed to update order status" });
    }
};

// Update live delivery partner location (Phase 7)
const updateOrderLocation = async (req, res) => {
    const { orderId, lat, lng } = req.body;

    // 1. Coordinate range validation
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (isNaN(numLat) || isNaN(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
        return res.status(400).json({ success: false, message: "Invalid GPS coordinates" });
    }

    try {
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // 2. Validate order status
        if (order.status.toLowerCase() !== "out for delivery") {
            return res.status(400).json({
                success: false,
                message: `Cannot update location: Order is ${order.status}`,
            });
        }

        const now = new Date();
        const deliveryLocation = {
            lat: numLat,
            lng: numLng,
            updatedAt: now,
        };

        order.deliveryLocation = deliveryLocation;

        if (
            !order.customerCoords ||
            !order.customerCoords.lat ||
            Math.abs(order.customerCoords.lat - numLat) > 0.3 ||
            Math.abs(order.customerCoords.lng - numLng) > 0.3
        ) {
            order.customerCoords = {
                lat: Number((numLat + 0.0075).toFixed(6)),
                lng: Number((numLng + 0.0075).toFixed(6)),
            };
        }

        await order.save();

        const updatePayload = {
            orderId,
            deliveryLocation,
            customerCoords: order.customerCoords,
            status: order.status,
        };

        // 3. Broadcast real-time location update via WebSockets to the order room and globally
        const io = req.app.get("socketio");
        if (io) {
            io.to(`order:${orderId}`).emit("driverLocationUpdate", updatePayload);
            io.emit("driverLocationUpdate", updatePayload);
        }

        res.json({
            success: true,
            message: "Location updated successfully",
            deliveryLocation,
            customerCoords: order.customerCoords,
        });
    } catch (error) {
        console.error("error updating order location:", error);
        res.status(500).json({ success: false, message: "Failed to update location" });
    }
};

// Get live order tracking data (Phase 7 & 8)
const getOrderTracking = async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Verify authorization: customer can only access their own orders
        if (req.body.userId && order.userId && order.userId !== req.body.userId) {
            return res.status(403).json({ success: false, message: "Unauthorized access to order tracking" });
        }

        res.json({
            success: true,
            data: {
                orderId: order._id,
                status: order.status,
                customerCoords: order.customerCoords || { lat: 12.9352, lng: 77.6245 },
                deliveryLocation: order.deliveryLocation || null,
                deliveryPartnerId: order.deliveryPartnerId,
                address: order.address,
            },
        });
    } catch (error) {
        console.error("error fetching tracking data:", error);
        res.status(500).json({ success: false, message: "Failed to fetch tracking data" });
    }
};

export {
    placeOrder,
    verifyOrder,
    userOrders,
    listOrders,
    updateStatus,
    updateOrderLocation,
    getOrderTracking,
};
