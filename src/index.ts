import express from "express";
import dotenv from "dotenv";
import userRouter from "./routes/user.routes";
import mongoose from "mongoose";
import cors from 'cors';
dotenv.config();
const app = express();

app.use(express.json());


const connectDB = async () => {
  const DB_URL: string | undefined = process.env.DB_URL;
  if (DB_URL) {
    await mongoose
      .connect(DB_URL)
      .then(() => {
        console.log("connected to database");
      })
      .catch((err) => {
        console.log(err);
      });
  }
};

app.use(
  cors({
    origin: "https://frotend-1.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE" , "OPTIONS"], 
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);
connectDB();

app.get('/health' , (req , res)=>{
  res.send("ok");
})
app.use("/user", userRouter);

app.get("*" , (req,res)=>{
  res.status(404).send("route not found");
})

app.listen(process.env.PORT || 5000, () => {
  console.log("running on 5000");
});
