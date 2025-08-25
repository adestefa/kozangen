// File operations utilities
import { FileSystemError } from './error-handler';

export interface FileInfo {
  filename: string;
  path: string;
  size: number;
  lastModified: Date;
  extension: string;
  mimeType: string;
}

// Supported image extensions
export const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Maximum file size (in bytes)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function getFileExtension(filename: string): string {
  return filename.toLowerCase().substring(filename.lastIndexOf('.'));
}

export function isValidImageFile(filename: string): boolean {
  const extension = getFileExtension(filename);
  return SUPPORTED_IMAGE_EXTENSIONS.includes(extension);
}

export function validateFileSize(size: number): void {
  if (size > MAX_FILE_SIZE) {
    throw new FileSystemError(
      `File size ${Math.round(size / 1024 / 1024)}MB exceeds maximum allowed size of ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`
    );
  }
}

export function validateImageFile(file: FileInfo): void {
  if (!isValidImageFile(file.filename)) {
    throw new FileSystemError(
      `Invalid image format. Supported formats: ${SUPPORTED_IMAGE_EXTENSIONS.join(', ')}`
    );
  }
  
  validateFileSize(file.size);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function generateUniqueFilename(originalFilename: string): string {
  const extension = getFileExtension(originalFilename);
  const nameWithoutExt = originalFilename.substring(0, originalFilename.lastIndexOf('.'));
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  return `${nameWithoutExt}_${timestamp}_${random}${extension}`;
}

// Mock file operations for development
export async function mockReadDirectory(path: string): Promise<FileInfo[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const mockFiles: FileInfo[] = [
    {
      filename: 'model_001.jpg',
      path: '/static/input/model_001.jpg',
      size: 256000,
      lastModified: new Date('2025-08-20'),
      extension: '.jpg',
      mimeType: 'image/jpeg'
    },
    {
      filename: 'clothing_001.jpg', 
      path: '/static/input/clothing_001.jpg',
      size: 180000,
      lastModified: new Date('2025-08-21'),
      extension: '.jpg',
      mimeType: 'image/jpeg'
    },
    {
      filename: 'person_001.jpg',
      path: '/static/input/person_001.jpg',
      size: 220000,
      lastModified: new Date('2025-08-22'),
      extension: '.jpg',
      mimeType: 'image/jpeg'
    }
  ];

  return mockFiles.filter(file => file.path.startsWith(path));
}

export async function mockFileExists(path: string): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Mock some existing files
  const existingFiles = [
    '/static/input/model_001.jpg',
    '/static/input/clothing_001.jpg',
    '/static/input/person_001.jpg'
  ];
  
  return existingFiles.includes(path);
}

// TODO: Implement real file operations for production
// TODO: Add image processing utilities (resize, compress)
// TODO: Add file upload/download functionality