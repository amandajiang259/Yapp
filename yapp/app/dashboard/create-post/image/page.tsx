"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../../lib/firebase";
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { useRouter } from "next/navigation";
import { User } from 'firebase/auth';
import Navigation from '../../../components/Navigation';

const INTERESTS = [
  "Art", "Music", "Sports", "Technology", "Food", "Travel",
  "Fashion", "Health", "Education", "Business", "Science",
  "Entertainment", "Politics", "Environment", "Literature"
];

export default function CreateImagePost() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/');
      } else {
        setUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setCurrentUserData(userDoc.data());
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else if (selectedTags.length < 3) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !imageFile) return;

    setIsLoading(true);
    try {
      // Create FormData for image upload
      const formData = new FormData();
      formData.append('image', imageFile);

      // Upload image to MongoDB (you'll need to set up the API endpoint)
      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const { imageUrl } = await uploadResponse.json();

      // Create post document in Firestore
      const postData = {
        userId: user.uid,
        userName: currentUserData?.firstName + ' ' + currentUserData?.lastName,
        type: 'image',
        caption,
        imageUrl,
        tags: selectedTags,
        createdAt: serverTimestamp(),
        likes: 0,
        comments: []
      };

      await addDoc(collection(db, 'posts'), postData);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f6ebff]">
      <Navigation firstName={currentUserData?.firstName} />
      
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-[#6c5ce7] mb-6">Create Image Post</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full"
                  required
                />
                {previewUrl && (
                  <div className="mt-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (select up to 3)
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagClick(tag)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedTags.includes(tag)
                          ? 'bg-[#6c5ce7] text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading || !imageFile}
                  className="px-6 py-2 bg-[#6c5ce7] text-white rounded-md hover:bg-[#5a4dc7] transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Creating Post...' : 'Create Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 