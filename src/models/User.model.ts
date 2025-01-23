import mongoose, { Schema, Document } from "mongoose";

interface IUser extends Document {
    number: string;
    channel: string;
    email:string;
    onBoardThrough?: string; 
    timeStamp: Date;
}


const userSchema = new Schema<IUser>({
    number: { type: String, required: true },
    channel: { type: String, required: true },
    email:{type:String},
    onBoardThrough: { type: String }, 
    timeStamp: { type: Date, default: Date.now },
});


const User = mongoose.model<IUser>("User", userSchema);
export default User;
