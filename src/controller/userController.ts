import { Express  , Request , Response} from "express";
import User from "../models/User.model";


class userController{
    getUsers = async(req:Request, res:Response)=>{
        try{
          const users = await User.find();
          res.status(200).send(users);
        }catch(err){
            console.log(err);
        }
    }

    onBoardUser = async(req:Request , res:Response)  =>{
        try{
          const body = req.body;
          console.log(body);
          const newUser = await User.create(body);
          res.status(200).send(newUser);
        }catch(err){
            console.log(err);
        }
    }
}

export default new userController();

