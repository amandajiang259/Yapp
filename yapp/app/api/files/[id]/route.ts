import { NextResponse } from 'next/server';
import { MongoClient, GridFSBucket, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db();
    const bucket = new GridFSBucket(db);

    // Find file metadata
    const files = await bucket.find({ _id: new ObjectId(id) }).toArray();
    const file = files[0];

    if (!file) {
      await client.close();
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Create download stream
    const downloadStream = bucket.openDownloadStream(new ObjectId(id));

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of downloadStream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    await client.close();

    // Return file with appropriate content type
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': file.contentType || 'application/octet-stream',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
} 