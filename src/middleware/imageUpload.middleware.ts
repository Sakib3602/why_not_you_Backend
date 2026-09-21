import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

// ছবি সরাসরি Cloudinary-তে আপলোড হয়ে যাবে, ডিস্কে সেভ হবে না
const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: "why-not-you/image-quiz",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    // অতিরিক্ত বড় ছবি resize করে রাখা হচ্ছে যাতে লোড ফাস্ট হয়
    transformation: [{ width: 1600, crop: "limit" }],
  }),
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB পর্যন্ত
});

export default upload;
