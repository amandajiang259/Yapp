"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "../../authentication/firebase";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from "next/navigation";
import { User } from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';
import Head from "next/head";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState({
    username: '',
    bio: '',
    photoURL: '/default-avatar.svg',
    firstName: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    username: '',
    bio: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
      if (!user) {
        router.push('/');
      } else {
        setUser(user);
        await fetchProfileData(user.uid);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchProfileData = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setProfileData({
          username: data.username || '',
          bio: data.bio || '',
          photoURL: data.photoURL || '/default-avatar.svg',
          firstName: data.firstName || ''
        });
        setEditedData({
          username: data.username || '',
          bio: data.bio || ''
        });
        setPreviewURL(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setPreviewURL(preview);
      setError(null);
    } else {
      setError('Please select a valid image file');
      setSelectedFile(null);
      setPreviewURL(null);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      let photoURL = profileData.photoURL;

      if (selectedFile) {
        try {
          const storageRef = ref(storage, `profile-photos/${user.uid}/${selectedFile.name}`);
          await uploadBytes(storageRef, selectedFile);
          photoURL = await getDownloadURL(storageRef);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          throw new Error('Failed to upload profile photo. Please try again.');
        }
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        username: editedData.username,
        bio: editedData.bio,
        photoURL,
        updatedAt: new Date().toISOString()
      });

      setProfileData(prev => ({
        ...prev,
        username: editedData.username,
        bio: editedData.bio,
        photoURL
      }));

      setSelectedFile(null);
      if (previewURL) {
        URL.revokeObjectURL(previewURL);
        setPreviewURL(null);
      }
      
      await fetchProfileData(user.uid);
      router.push('/dashboard/profile');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewURL) {
        URL.revokeObjectURL(previewURL);
      }
    };
  }, [previewURL]);

  if (!user) {
    return null;
  }

  return (
  <>
    <Head>
        <title>Yapp! Main Page</title>
    </Head>
    <div className="min-h-screen bg-[#f6ebff]">
      {/* Navigation */}
      <nav className="bg-[#6c5ce7] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link 
                href="/dashboard" 
                className="text-xl font-bold text-white hover:text-[#f6ebff] transition-colors cursor-pointer"
              >
                Yapp
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link href="/dashboard" className="text-white hover:bg-[#ab9dd3] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Home
                </Link>
                <Link href="/dashboard/search" className="text-white hover:bg-[#ab9dd3] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Search
                </Link>
                <Link href="/dashboard/messages" className="text-white hover:bg-[#ab9dd3] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Messages
                </Link>
                <Link href="/dashboard/profile" className="text-white hover:bg-[#ab9dd3] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Profile
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm">Welcome, {profileData.firstName || 'User'}</span>
              <button
                onClick={() => auth.signOut()}
                className="px-4 py-2 bg-[#68baa5] text-white rounded-md hover:bg-[#5aa594] transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-[#6c5ce7] mb-6 text-center">Profile</h1>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex flex-col items-center">
              {/* Profile Photo */}
              <div className="relative w-48 h-48 mb-4">
                <Image
                  src={previewURL || profileData.photoURL}
                  alt="Profile"
                  fill
                  className="rounded-lg object-cover"
                />
                {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                    <label className="cursor-pointer bg-white text-[#6c5ce7] px-4 py-2 rounded-md hover:bg-[#f6ebff] transition-colors">
                      {selectedFile ? 'Change Photo' : 'Select Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Username */}
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.username}
                  onChange={(e) => setEditedData(prev => ({ ...prev, username: e.target.value }))}
                  className="text-2xl font-bold text-[#6c5ce7] mb-2 text-center bg-[#f6ebff] border border-[#ab9dd3] rounded-md px-3 py-1"
                  placeholder="Username"
                />
              ) : (
                <h2 className="text-2xl font-bold text-[#6c5ce7] mb-2">{profileData.username || 'No username set'}</h2>
              )}

              {/* Bio */}
              {isEditing ? (
                <div className="w-full max-w-md">
                  <textarea
                    value={editedData.bio}
                    onChange={(e) => {
                      if (e.target.value.length <= 100) {
                        setEditedData(prev => ({ ...prev, bio: e.target.value }));
                      }
                    }}
                    className="w-full h-24 p-3 text-gray-600 bg-[#f6ebff] border border-[#ab9dd3] rounded-md resize-none"
                    placeholder="Tell us about yourself (max 100 characters)"
                    maxLength={100}
                  />
                  <p className="text-sm text-gray-500 text-right">
                    {editedData.bio.length}/100 characters
                  </p>
                </div>
              ) : (
                <p className="text-gray-600 text-center max-w-md">
                  {profileData.bio || 'No bio set'}
                </p>
              )}

              {/* Edit/Save Buttons */}
              <div className="mt-6">
                {isEditing ? (
                  <div className="flex space-x-4">
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="bg-[#68baa5] text-white px-6 py-2 rounded-md hover:bg-[#5aa594] transition-colors"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedFile(null);
                        if (previewURL) {
                          URL.revokeObjectURL(previewURL);
                          setPreviewURL(null);
                        }
                      }}
                      className="bg-gray-200 text-gray-600 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-[#6c5ce7] text-white px-6 py-2 rounded-md hover:bg-[#5a4bc7] transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#6c5ce7] text-white p-4 text-center shadow-lg">
        <p>Welcome to Yapp! Share your positive affirmations and creative stories!</p>
      </div>
    </div>
  </>
  );
}