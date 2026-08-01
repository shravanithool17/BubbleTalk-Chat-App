// import { v2 as cloudinary } from "cloudinary";
// import { config } from "dotenv";
// config();

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// cloudinary.uploader
//   .upload("https://res.cloudinary.com/demo/image/upload/sample.jpg")
//   .then((result) => console.log("UPLOAD SUCCESS:", result.secure_url))
//   .catch((error) =>
//     console.log("UPLOAD FAILED:", JSON.stringify(error, null, 2)),
//   );


// import { v2 as cloudinary } from "cloudinary";
// import dotenv from "dotenv";

// dotenv.config();

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// try {
//   const result = await cloudinary.uploader.upload(
//     "https://res.cloudinary.com/demo/image/upload/sample.jpg"
//   );

//   console.log(result);
// } catch (err) {
//   console.dir(err, { depth: null });
// }


import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log(cloudinary.config());

try {
  const result = await cloudinary.uploader.upload("./test.jpg");
  console.log(result);
} catch (e) {
  console.dir(e, { depth: null });
}