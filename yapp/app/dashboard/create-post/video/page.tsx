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

export default function CreateVideoPost() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
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

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
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
    if (!user || !videoFile) return;

    setIsLoading(true);
    try {
      // Create FormData for video upload
      const formData = new FormData();
      formData.append('video', videoFile);

      // Upload video to MongoDB (you'll need to set up the API endpoint)
      const uploadResponse = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video');
      }

      const { videoUrl } = await uploadResponse.json();

      // Create post document in Firestore
      const postData = {
        userId: user.uid,
        userName: currentUserData?.firstName + ' ' + currentUserData?.lastName,
        type: 'video',
        caption,
        videoUrl,
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
            <h2 className="text-2xl font-bold text-[#6c5ce7] mb-6">Create Video Post</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Video
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="w-full"
                  required
                />
                {previewUrl && (
                  <div className="mt-4">
                    <video
                      src={previewUrl}
                      controls
                      className="max-w-full h-auto rounded-lg"
                    >
                      Your browser does not support the video tag.
                    </video>
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
                  disabled={isLoading || !videoFile}
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