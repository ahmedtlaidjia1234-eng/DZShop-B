import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log('☁️  Cloudinary configured successfully for folder:', process.env.CLOUDINARY_FOLDER || 'project-1');
} else {
  console.log('ℹ️  Cloudinary credentials not detected in server/.env. Using local upload fallback.');
}

export { cloudinary, isCloudinaryConfigured };

export async function uploadToCloudinary(filePathOrBuffer, options = {}) {
  const folder = process.env.CLOUDINARY_FOLDER || 'project-1';

  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      filePathOrBuffer,
      {
        folder,
        resource_type: 'image',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
  });
}
