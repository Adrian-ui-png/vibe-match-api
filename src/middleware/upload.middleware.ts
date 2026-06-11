import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';

// Store in memory to prevent writing temp files to disk
const storage = multer.memoryStorage();

// Only allow image files by MIME type header
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image uploads are allowed!', 400) as any, false);
  }
};

export const uploadPhoto = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 4 * 1024 * 1024 // Strict limit of 4MB for memory economy
  }
});

/**
 * Validates the file buffer at a binary level using file signature (magic numbers)
 */
export const validateImageSignature = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return next();
  }

  const buffer = req.file.buffer;
  if (!buffer || buffer.length < 12) {
    return next(new AppError('Uploaded file is corrupted or too small.', 400));
  }

  // Read magic bytes
  const hex = buffer.toString('hex', 0, 4).toUpperCase();

  const isPng = hex === '89504E47';
  const isJpeg = hex.startsWith('FFD8FF');
  const isGif = hex.startsWith('474946'); // 'GIF' is 47 49 46

  // WebP check: starts with 'RIFF' (52494646) and has 'WEBP' (57454250) at index 8-11
  const isWebp = buffer.toString('hex', 0, 4).toUpperCase() === '52494646' &&
                 buffer.toString('hex', 8, 12).toUpperCase() === '57454250';

  if (isPng || isJpeg || isGif || isWebp) {
    next();
  } else {
    next(new AppError('Access denied: Invalid file signature. Only valid JPEG, PNG, GIF, or WEBP images are allowed.', 400));
  }
};
