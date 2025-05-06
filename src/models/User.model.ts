import mongoose, { Schema, Document } from "mongoose";

interface IUser extends Document {
    number: string;
    channel: string;
    name:string;
    email:string;
    onBoardThrough?: string; 
    timeStamp: Date;
    roommates:any;
}

interface IOtp extends Document{
   phone:string; 
   otp:string;
   otpExpires:Date;
}

const otpSchema = new Schema<IOtp>({
    otp:{type:String},
    phone:{type:String,required:true},
    otpExpires: { type: Date, expires: 0 } 
})


const userSchema = new Schema<IUser>({
    number: { type: String, required: true },
    channel: { type: String,  },
    name:{type:String  },
    email:{type:String , required:true},
    onBoardThrough: { type: String }, 
    timeStamp: { type: Date, default: Date.now },
    roommates:[
        {
            name:{
                type:String,

            },
            phone:{
                type:String
            }
        }
    ]
});



export const Otp = mongoose.model<IOtp>("Otp" , otpSchema);

const User = mongoose.model<IUser>("User", userSchema);
export default User;
