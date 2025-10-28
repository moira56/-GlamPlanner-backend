import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DEFAULT_FOLDER = process.env.CLOUDINARY_FOLDER || "uploads";

export function uploadBuffer(buffer, filename, folder = DEFAULT_FOLDER) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image", public_id: filename?.split(".")?.[0] },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

export async function uploadFromUrl(url, folder = DEFAULT_FOLDER) {
  return cloudinary.uploader.upload(url, { folder, resource_type: "image" });
}

export async function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
