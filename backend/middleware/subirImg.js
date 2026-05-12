import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: "ddydemm9u",
  api_key: "167396583177692",
  api_secret: "MThRV65WznH9BLOLrYwFaqLEDME"
});

// 📦 Configurar almacenamiento con Multer y Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "img-cdisfruta", // Carpeta en Cloudinary
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

export const subirImg = upload.single("imagen");
