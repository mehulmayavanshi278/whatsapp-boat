import mongoose, { Schema, Document } from "mongoose";

interface IUser extends Document {
    name: string;
    channel: string;
    email:string;
    onBoardThrough?: string; 
    timeStamp: Date;
}


const userSchema = new Schema<IUser>({
    name: { type: String, required: true },
    channel: { type: String, required: true },
    email:{type:String},
    onBoardThrough: { type: String }, 
    timeStamp: { type: Date, default: Date.now },
});


const User = mongoose.model<IUser>("User", userSchema);
export default User;
