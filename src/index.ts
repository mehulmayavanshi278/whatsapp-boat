import express, { Request, Response } from "express";
import dotenv from "dotenv";
import userRouter from "./routes/user.routes";
import mongoose from "mongoose";
import cors from 'cors';
import { handleIntereactiveMessage, sendWelcomeTemplate, verifyOTP } from "./Handlers/templateHandler";
import { sendEmail } from "./Handlers/sendMail";
import upload from "./utils/multer.init";
import axios from "axios";
import { handleBookingConfirm } from "./Handlers/paymentHandler";
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

const markMessageAsRead = async (messageId: string) => {
  try {
    await axios({
      method: "post",
      url: "https://api.direct.aisensy.io/v1/mark-message-as-read",  // adjust to the exact URL from the Stoplight spec
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AISENSY_API_KEY}`,
      },
      data: { message_id: messageId },
    });
    console.log("✅ Message marked as read:", messageId);
  } catch (err: any) {
    console.error("❌ Failed to mark read:", err.response?.data || err.message);
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



app.post('/api/upload/file', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const file = req.file as Express.MulterS3.File;

    if (!file) {
      res.status(400).send({ message: 'File not found' });
      return;
    }

    if (!file.location) {
      res.status(422).send({ message: 'File location not found' });
      return;
    }

    res.status(200).send({ message: 'Success', url: file.location });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Server error' });
  }
});

app.post("/sendemail" , async(req,res)=>{
  try{
    const body = req.body;
    await sendEmail(body.to , body?.subject , body?.text);
  }catch(err){
    console.log(err);
  }
})

app.use("/receiveData", (req: Request, res: Response) => {
  console.log("Received data:", req.body);
  handleBookingConfirm(req.body); // Call your function here
  res.status(200).json({ message: "Data received successfully" });
});

app.get('/webhook' ,(req,res)=>{
  try{
    console.log("get webookk triggered");
    let mode = req.query['hub.mode'];
    // console.log("mode" , mode);
    let chalenge = req.query['hub.challenge'];
    let token = req.query["hub.verify_token"];

    // console.log("token", token);

    if (mode === "subscribe" && token === 'applebanana') {
      console.log("Webhook verified");
      res.status(200).send(chalenge);
    } else {
      res.sendStatus(403);
    }

    const mytoken = 'applebanana';

  }catch(err){
    console.log(err);
  }
})

app.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log("post webhook triggered");
    const payload =  req.body;

    console.log("payload" , payload);
    console.log("changes" , payload?.entry[0]?.changes);
    console.log("changes" , payload?.entry[0]?.changes[0]?.field);


    console.log("value" , payload?.entry[0]?.changes[0]?.value);
    const value = payload?.entry[0]?.changes[0]?.value;
    const messageType = payload?.entry[0]?.changes[0]?.value?.messages[0]?.type;

    const metadata = payload?.entry[0]?.changes[0]?.value?.metadata
    const from = payload?.entry[0]?.changes[0]?.value?.messages[0]?.from;
    const messageId = value.messages[0]?.id;
    console.log("metadata" , metadata);
    console.log("messageType" , messageType);
    if(messageType==='text'){
      console.log("text:", payload?.entry[0]?.changes[0]?.value?.messages[0]?.text)
      console.log("body:",payload?.entry[0]?.changes[0]?.value?.messages[0]?.text?.body);
      const bodyMsg = payload?.entry[0]?.changes[0]?.value?.messages[0]?.text?.body;

      console.log(typeof bodyMsg);
      await markMessageAsRead(messageId);

      if(bodyMsg.toString().toLowerCase()==="hotel"){
        console.log("calling start template");

        sendWelcomeTemplate(from)

      }else if(bodyMsg.toString().length===6){
        console.log("it is an otp");
        verifyOTP(bodyMsg , from);

      }
      
    }else if(messageType==="interactive"){
      const data = value?.messages[0]?.interactive;

      handleIntereactiveMessage(data , from);
    }
    console.log("metadata" , payload?.entry[0]?.changes[0]?.value?.metadata);
    console.log(
      "📦 Payload received:",
      JSON.stringify({
        object: payload.object,
        entry_count: payload.entry?.length || 0,
        ip: req.ip,
      })
    );

    res.status(200).send('EVENT_RECEIVED');

  } catch (err) {
    console.error("Error in webhook:", err);
    res.status(500).send('Internal Server Error');
  }
});









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
