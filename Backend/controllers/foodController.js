import foodModel from "../models/foodModel.js";
import fs from "fs";

//add food item
const addFood = async (req, res) => {
    let image_filename = `${req.file.filename}`;

    const food = new foodModel({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        image: image_filename,
    });
    try {
        await food.save();

        // Broadcast real-time update to all connected clients
        const io = req.app.get("socketio");
        if (io) {
            io.emit("foodListUpdate", {
                action: "add",
                food,
            });
            console.log(`[Socket] Broadcasted foodListUpdate (add): ${food.name} (${food.category})`);
        }

        res.json({ success: true, message: "Food Added", data: food });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
};

//all food list
const listFood = async (req, res) => {
    try {
        const foods = await foodModel.find({});
        res.json({ success: true, data: foods });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "error" });
    }
};

//remove food item
const removeFood = async (req, res) => {
    try {
        const food = await foodModel.findById(req.body.id);
        if (food) {
            fs.unlink(`uploads/${food.image}`, () => { });
            await foodModel.findByIdAndDelete(req.body.id);

            // Broadcast real-time update to all connected clients
            const io = req.app.get("socketio");
            if (io) {
                io.emit("foodListUpdate", {
                    action: "remove",
                    id: req.body.id,
                });
                console.log(`[Socket] Broadcasted foodListUpdate (remove): ${req.body.id}`);
            }
        }
        res.json({ success: true, message: "Food removed" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "error" });
    }
};

// All unique available categories from active food items
const listCategories = async (req, res) => {
    try {
        const foods = await foodModel.find({});
        const categoryMap = new Map();

        foods.forEach((food) => {
            const cat = food.category ? food.category.trim() : null;
            if (cat && !categoryMap.has(cat.toLowerCase())) {
                categoryMap.set(cat.toLowerCase(), {
                    menu_name: cat,
                    menu_image: food.image,
                });
            }
        });

        res.json({ success: true, data: Array.from(categoryMap.values()) });
    } catch (error) {
        console.log("error fetching categories:", error);
        res.status(500).json({ success: false, message: "error" });
    }
};

export { addFood, listFood, removeFood, listCategories };
