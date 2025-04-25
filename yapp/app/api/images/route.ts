import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

export async function POST(req: NextRequest) {
  try {
    const { userId, imageData, tags } = await req.json();

    if (!userId || !imageData) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await client.connect();
    const db = client.db('your-db-name');
    const images = db.collection('images');

    const result = await images.insertOne({
      userId,
      imageData, // base64 string
      tags: tags || [],
      createdAt: new Date(),
    });

    return NextResponse.json({ message: 'Image stored', id: result.insertedId }, { status: 200 });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ message: 'Failed to store image' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function GET(req: NextRequest) {
    try {
      await client.connect();
      const db = client.db('your-db-name');
      const images = db.collection('images');
  
      const allImages = await images.find({}).sort({ createdAt: -1 }).limit(50).toArray();
  
      return NextResponse.json(allImages, { status: 200 });
    } catch (error) {
      console.error('MongoDB fetch error:', error);
      return NextResponse.json({ message: 'Failed to load images' }, { status: 500 });
    } finally {
      await client.close();
    }
}