import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId:{
        type:String,
        require:true,
    },
    items:{
        type:Array,
        require:true,
    },
    amount:{
        type:Number,
        require:true,
    },
    address:{
        type:Object,
        require:true,
    },
    status:{
        type:String,
        default:"Food Processing",
    },
    date:{
        type:Date,
        default:Date.now(),
    },
    payment:{
        type:Boolean,
        default:false,
    },
    deliveryPartnerId:{
        type:String,
        default:null,
    },
    deliveryLocation:{
        lat:{ type:Number, default:null },
        lng:{ type:Number, default:null },
        updatedAt:{ type:Date, default:null },
    },
    customerCoords:{
        lat:{ type:Number, default:12.9352 },
        lng:{ type:Number, default:77.6245 },
    }
});

const orderModel = mongoose.models.order || mongoose.model("order",orderSchema);
export default orderModel;
