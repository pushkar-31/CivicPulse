
import cloudinary from "../config/cloudinary.js";

export const uploadIssueImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image to upload.",
      });
    }

    const imageUrl = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "civicpulse/issues",
          resource_type: "image",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );

      stream.end(req.file.buffer);
    });

    return res.status(201).json({
      success: true,
      imageUrl,
      message: "Image uploaded successfully.",
    });
  } catch (error) {
  console.error("Cloudinary upload failed:", {
    message: error.message,
    http_code: error.http_code,
    name: error.name,
    cloudinaryMessage: error.error?.message,
  });

  next(error);
}
};
