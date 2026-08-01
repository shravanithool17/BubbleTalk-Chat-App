// import {v2 as cloudinary} from 'cloudinary'

// import {config} from 'dotenv'
// config();
// console.log("CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
// console.log("API_KEY:", process.env.CLOUDINARY_API_KEY);
// console.log("API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "Present (hidden)" : "MISSING");

// cloudinary.config({
//     CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
//     API_KEY: process.env.CLOUDINARY_API_KEY,
//     API_SECRET: process.env.CLOUDINARY_API_SECRET

   
// });

// export default cloudinary;

import { v2 as cloudinary } from "cloudinary";
import { config } from "dotenv";

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;