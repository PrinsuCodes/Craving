import express from "express";
import multer from "multer";
import { addFood, listFood, removeFood, listCategories } from "../controllers/foodController.js";

const foodRouter = express.Router();

const storage = multer.diskStorage({
    destination:function (req,file,cb){
        return cb(null,'uploads');
    },
    filename:function(req,file,cb){
        return cb(null,`${Date.now()}${file.originalname}`);
    },
});

const upload = multer({storage:storage});

foodRouter.post("/add",upload.single("image"),addFood);
foodRouter.get("/list",listFood);
foodRouter.get("/categories",listCategories);
foodRouter.post("/remove",removeFood);

export default foodRouter;
