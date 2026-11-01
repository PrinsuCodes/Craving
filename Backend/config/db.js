import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async ()=>{
    await mongoose.connect('mongodb+srv://rahulrajput02513_db_user:XaXKD7GmXRaeE3Ms@cluster0.ybyrqjb.mongodb.net/rahuldatabase').then(()=>console.log("DB connected"))
}