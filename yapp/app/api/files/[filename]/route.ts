import { NextResponse } from 'next/server';
import clientPromise from '../../../utils/mongodb';

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db('fileupload');
    const bucket = new (require('mongodb')).GridFSBucket(db, {
      bucketName: 'profilePhotos'
    });

    const files = await bucket.find({ filename: params.filename }).toArray();
    if (files.length === 0) {
      return new NextResponse('File not found', { status: 404 });
    }

    const downloadStream = bucket.openDownloadStreamByName(params.filename);
    
    return new NextResponse(downloadStream as any, {
      headers: {
        'Content-Type': files[0].metadata?.contentType || 'application/octet-stream',
      },
    });
  } catch (error) {
    console.error('Error retrieving file:', error);
    return new NextResponse('Error retrieving file', { status: 500 });
  }
} 