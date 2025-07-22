import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
    username:{type:String,required:true},
    avatarUrl:{type:String},
    socketId:{type:String},
});

export const User=mongoose.model("User",userSchema);