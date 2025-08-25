// Static file serving for input images
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const filePath = path.join(process.cwd(), 'input', ...pathSegments);

    // Security check - ensure file is within input directory
    const inputDir = path.join(process.cwd(), 'input');
    const resolvedPath = path.resolve(filePath);
    const resolvedInputDir = path.resolve(inputDir);
    
    if (!resolvedPath.startsWith(resolvedInputDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Check if file exists
    if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Read file
    const fileBuffer = fs.readFileSync(resolvedPath);
    
    // Determine content type
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    }[ext] || 'application/octet-stream';

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('Error serving static file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}