import { S3Client } from "@aws-sdk/client-s3";
import multer, { FileFilterCallback } from "multer";
import multerS3 from "multer-s3";
import { Request } from "express";
import dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
  region: process.env.region,
  endpoint: `https://s3.${process.env.region}.amazonaws.com/`,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME || "",
    metadata: (req: Request, file: Express.Multer.File, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req: Request, file: Express.Multer.File, cb) => {
      cb(null, `${Date.now().toString()}-${file.originalname}`);
    },
  }),
});

export default upload;
