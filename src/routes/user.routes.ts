import express from 'express'
import userController from '../controller/userController';

const router = express.Router();


router.get('/' , userController.getUsers )
router.post('/onboard' , userController.onBoardUser);


export default router;