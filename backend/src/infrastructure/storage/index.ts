// Storage Service for File Uploads
import { promises as fs } from 'fs';
import path from 'path';

export class StorageService {
  private static readonly UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  static async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.UPLOAD_DIR);
    } catch {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
    }
  }

  static validateFile(file: { mimetype: string; size: number }): { valid: boolean; error?: string } {
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return {
        valid: false,
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'File size exceeds 5MB limit.',
      };
    }

    return { valid: true };
  }

  static async saveFile(filename: string, buffer: Buffer): Promise<string> {
    await this.ensureUploadDir();

    const filepath = path.join(this.UPLOAD_DIR, filename);
    await fs.writeFile(filepath, buffer);

    return `/uploads/${filename}`;
  }

  static async deleteFile(filepath: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), filepath);
      await fs.unlink(fullPath);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  }

  static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '-');

    return `${name}-${timestamp}-${randomString}${ext}`;
  }
}