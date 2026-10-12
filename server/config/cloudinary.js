
import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

console.log("Cloudinary environment check:", {
  cloudNameLoaded: Boolean(cloudName),
  apiKeyLoaded: Boolean(apiKey),
  apiSecretLoaded: Boolean(apiSecret),
});

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error(
    "Cloudinary credentials are missing. Check server/.env."
  );
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export default cloudinary;
