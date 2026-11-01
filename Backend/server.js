import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import foodRouter from './routes/foodRoute.js';
import userRouter from './routes/userRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import orderModel from './models/orderModel.js';
import 'dotenv/config';

// App configuration
const app = express();
const PORT = process.env.PORT || 4000;

// Create HTTP server for Express and Socket.io
const server = http.createServer(app);

// Initialize Socket.io with permissive CORS for local dev
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
        methods: ["GET", "POST"]
    }
});

// Attach io instance to Express app so controllers can emit events
app.set("socketio", io);

// Middleware
app.use(express.json());
app.use(cors());

// DB connection
connectDB();

// Making uploads folder static
app.use("/image", express.static("uploads"));

// API endpoints
app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

app.get("/", (req, res) => {
    res.send("API Working with Live Socket.io Tracking");
});

// Socket.io Real-Time Event Handlers (Phase 7)
io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Customer or Driver joins private room for specific order
    socket.on("joinOrderRoom", (orderId) => {
        if (orderId) {
            const roomName = `order:${orderId}`;
            socket.join(roomName);
            console.log(`[Socket] ${socket.id} joined ${roomName}`);
        }
    });

    // Driver emits real-time location ping (from real device GPS or simulator)
    socket.on("sendLocationPing", async (data) => {
        const { orderId, lat, lng } = data;
        if (!orderId || lat === undefined || lng === undefined) return;

        const numLat = Number(lat);
        const numLng = Number(lng);
        if (isNaN(numLat) || isNaN(numLng) || numLat < -90 || numLat > 90 || numLng < -180 || numLng > 180) {
            return;
        }

        try {
            const order = await orderModel.findById(orderId);
            if (order && order.status.toLowerCase() === "out for delivery") {
                const deliveryLocation = {
                    lat: numLat,
                    lng: numLng,
                    updatedAt: new Date(),
                };
                order.deliveryLocation = deliveryLocation;

                // If customer destination is absent or from default Bangalore while real GPS is elsewhere,
                // adapt destination so realistic local street routing works seamlessly in the user's city
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

                const payload = {
                    orderId,
                    deliveryLocation,
                    customerCoords: order.customerCoords,
                    status: order.status,
                };

                // Broadcast update to the order's room (e.g. customer) and globally
                io.to(`order:${orderId}`).emit("driverLocationUpdate", payload);
                io.emit("driverLocationUpdate", payload);
            }
        } catch (err) {
            console.error("[Socket] Location ping error:", err.message);
        }
    });

    socket.on("leaveOrderRoom", (orderId) => {
        if (orderId) {
            socket.leave(`order:${orderId}`);
        }
    });

    socket.on("disconnect", () => {
        console.log(`[Socket] Disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => console.log(`Server + Socket.io started at PORT : ${PORT}`));
