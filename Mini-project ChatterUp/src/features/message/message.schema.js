

import mongoose from "mongoose";

export const messageSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true,
    },
    content:{
        type:String,
        required:true,
    },
    avatarUrl:{
        type:String,
    },
    timestamp:{
        type:Date,
        default:Date.now,
    }
});

export const MessageModel=mongoose.model("Message",messageSchema);
