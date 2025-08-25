// List input images endpoint
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, ImageListResponse } from '@/lib/types/api';
import fs from 'fs';
import path from 'path';

export async function GET(_request: NextRequest) {
  try {
    const inputDir = path.join(process.cwd(), 'input');
    const images: any[] = [];

    // Read model images
    const modelsDir = path.join(inputDir, 'models');
    if (fs.existsSync(modelsDir)) {
      const modelFiles = fs.readdirSync(modelsDir);
      for (const file of modelFiles) {
        if (file.match(/\.(png|jpg|jpeg)$/i)) {
          const filePath = path.join(modelsDir, file);
          const stats = fs.statSync(filePath);
          images.push({
            filename: file,
            path: `/input/models/${file}`,
            type: 'model',
            size: stats.size,
            lastModified: stats.mtime.toISOString()
          });
        }
      }
    }

    // Read outfit images (tops and bottoms)
    const outfitsDir = path.join(inputDir, 'outfits');
    if (fs.existsSync(outfitsDir)) {
      const outfitFiles = fs.readdirSync(outfitsDir);
      for (const file of outfitFiles) {
        if (file.match(/\.(png|jpg|jpeg)$/i)) {
          const filePath = path.join(outfitsDir, file);
          const stats = fs.statSync(filePath);
          
          // Determine clothing type from filename
          const type = file.startsWith('top_') ? 'top' : 
                      file.startsWith('bottom_') ? 'bottom' : 'clothing';
          
          images.push({
            filename: file,
            path: `/input/outfits/${file}`,
            type: type,
            size: stats.size,
            lastModified: stats.mtime.toISOString()
          });
        }
      }
    }

    const response: ApiResponse<ImageListResponse> = {
      success: true,
      data: { images },
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error reading input images:', error);
    const errorResponse: ApiResponse = {
      success: false,
      error: 'Failed to fetch images',
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// TODO: Implement POST for uploading new images