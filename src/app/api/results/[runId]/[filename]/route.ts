// Serve generated result images from runs
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string; filename: string }> }
) {
  try {
    const { runId, filename } = await params;
    
    // Security: Validate runId and filename to prevent directory traversal
    // Support both old format (0826_15) and new format (run_1756255302774)
    const validRunId = runId.match(/^(run_\d+|\d{4}_\d{2}|TEST_\d+|test_[\w_]+)$/);
    const validFilename = filename.match(/^[\w_-]+\.(png|jpg|jpeg)$/i);
    
    if (!validRunId || !validFilename) {
      return new NextResponse('Invalid request', { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'data', 'results', runId, filename);
    
    if (!fs.existsSync(filePath)) {
      return new NextResponse('Image not found', { status: 404 });
    }

    // Read the image file
    const imageBuffer = fs.readFileSync(filePath);
    
    // Determine content type based on extension
    const extension = path.extname(filename).toLowerCase();
    const contentType = extension === '.png' ? 'image/png' : 'image/jpeg';
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      },
    });
    
  } catch (error) {
    console.error('Error serving result image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}