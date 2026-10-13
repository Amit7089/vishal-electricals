
import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";

export const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image to upload.",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "vishal-electricals/products",
          resource_type: "image",
        },
        (error, uploadedImage) => {
          if (error) {
            reject(error);
          } else {
            resolve(uploadedImage);
          }
        }
      );

      Readable.from(req.file.buffer).pipe(uploadStream);
    });

    return res.status(201).json({
      success: true,
      message: "Product image uploaded successfully.",
      image: {
        url: result.secure_url,
        publicId: result.public_id,
        alt: req.file.originalname,
      },
    });
  } catch (error) {
    next(error);
  }
};
