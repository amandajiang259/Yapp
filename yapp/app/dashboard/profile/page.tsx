"use client";

import { useEffect, useState, useRef } from "react";
import { auth, db } from '../../../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { useRouter } from "next/navigation";
import { User } from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ProfileData {
  username: string;
  bio: string;
  photoURL: string;
  firstName: string;
  followers?: string[];
  following?: string[];
}

interface UserData {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  photoURL: string;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    username: '',
    bio: '',
    photoURL: '/default-avatar.svg',
    firstName: '',
    followers: [],
    following: []
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
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0
  });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const router = useRouter();
  const [showCropModal, setShowCropModal] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts'>('posts');
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<UserData[]>([]);
  const [followingList, setFollowingList] = useState<UserData[]>([]);

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
        const profileData = {
          username: data.username || '',
          bio: data.bio || '',
          photoURL: data.photoURL || '/default-avatar.svg',
          firstName: data.firstName || '',
          followers: data.followers || [],
          following: data.following || []
        };
        setProfileData(profileData);
        setEditedData({
          username: data.username || '',
          bio: data.bio || ''
        });
        setPreviewURL(null);
        
        // Fetch followers and following data
        await fetchFollowersAndFollowing(profileData.followers || [], profileData.following || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile data');
    }
  };

  const fetchFollowersAndFollowing = async (followers: string[], following: string[]) => {
    try {
      // Fetch followers data
      const followersPromises = [...new Set(followers)].map(async (followerId) => {
        const followerDoc = await getDoc(doc(db, 'users', followerId));
        if (followerDoc.exists()) {
          return {
            id: followerDoc.id,
            ...followerDoc.data()
          } as UserData;
        }
        return null;
      });

      // Fetch following data
      const followingPromises = [...new Set(following)].map(async (followingId) => {
        const followingDoc = await getDoc(doc(db, 'users', followingId));
        if (followingDoc.exists()) {
          return {
            id: followingDoc.id,
            ...followingDoc.data()
          } as UserData;
        }
        return null;
      });

      const followersData = (await Promise.all(followersPromises)).filter(Boolean) as UserData[];
      const followingData = (await Promise.all(followingPromises)).filter(Boolean) as UserData[];

      // Remove duplicates
      const uniqueFollowers = Array.from(new Map(followersData.map(user => [user.id, user])).values());
      const uniqueFollowing = Array.from(new Map(followingData.map(user => [user.id, user])).values());

      setFollowersList(uniqueFollowers);
      setFollowingList(uniqueFollowing);
    } catch (error) {
      console.error('Error fetching followers/following:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, SVG, GIF, or WebP)');
        return;
      }
      
      // Validate file size (max 2MB for base64 storage)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB');
        return;
      }

      setSelectedFile(file);
      const preview = URL.createObjectURL(file);
      setOriginalImage(preview);
      setShowCropModal(true);
      setError(null);
    }
  };

  const handleCropComplete = async () => {
    if (imgRef.current && completedCrop) {
      try {
        const croppedImageUrl = await getCroppedImg(imgRef.current, completedCrop);
        setPreviewURL(croppedImageUrl);
      } catch (error) {
        console.error('Error cropping image:', error);
        setError('Failed to crop image. Please try again.');
      }
    }
    
    if (originalImage) {
      URL.revokeObjectURL(originalImage);
      setOriginalImage(null);
    }
    setShowCropModal(false);
  };

  const getCroppedImg = (image: HTMLImageElement, crop: Crop): Promise<string> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width!;
    canvas.height = crop.height!;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    ctx.drawImage(
      image,
      crop.x! * scaleX,
      crop.y! * scaleY,
      crop.width! * scaleX,
      crop.height! * scaleY,
      0,
      0,
      crop.width!,
      crop.height!
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Canvas is empty');
        }
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
      }, 'image/jpeg', 0.8); // Reduced quality to keep size smaller
    });
  };

  const handleSave = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      let photoURL = profileData.photoURL;

      // If we have a preview URL (cropped image), use that
      if (previewURL) {
        photoURL = previewURL;
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
      
      setIsEditing(false);
      await fetchProfileData(user.uid);
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

  const fetchPosts = async (userId: string) => {
    setIsLoadingPosts(true);
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(postsQuery);
      const postsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts');
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPosts(user.uid);
    }
  }, [user]);

  useEffect(() => {
    document.title = "Profile | Yapp";
  }, []);

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const postRef = doc(db, 'posts', postId);
      await deleteDoc(postRef);
      
      // Update the posts state to remove the deleted post
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete post');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f6ebff] flex flex-col">
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
                <Link href="/dashboard/affirmations" className="text-white hover:bg-[#ab9dd3] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Weekly Discussion
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
      <main className="flex-1 overflow-y-auto pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                        accept="image/jpeg,image/png,image/svg+xml,image/gif,image/webp"
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

          {/* Posts Section */}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
            <h2 className="text-xl font-bold text-[#6c5ce7] mb-6">Posts</h2>

            {isLoadingPosts ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6c5ce7]"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {posts
                  .filter(post => post.type === 'story')
                  .map(post => (
                    <div key={post.id} className="bg-[#f6ebff] rounded-lg p-4">
                      <div className="space-y-2">
                        <div 
                          className="text-gray-700"
                          dangerouslySetInnerHTML={{ __html: post.formattedContent || post.content }}
                        />
                        {post.tags && (
                          <div className="flex flex-wrap gap-2">
                            {post.tags.map((tag: string) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-[#6c5ce7] text-white text-xs rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                            month: 'numeric',
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'No date'}
                        </div>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                {posts.filter(post => post.type === 'story').length === 0 && (
                  <div className="col-span-full text-center text-gray-500 py-8">
                    No posts yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#6c5ce7] text-white p-4 text-center shadow-lg z-10">
        <p>Welcome to Yapp! Share your positive affirmations and creative stories!</p>
      </div>

      {/* Crop Modal */}
      {showCropModal && originalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold text-[#6c5ce7] mb-4">Crop your profile photo</h2>
            <div className="relative w-full max-w-lg mx-auto aspect-square">
              <ReactCrop
                crop={crop}
                onChange={(c: Crop) => setCrop(c)}
                onComplete={(c: Crop) => setCompletedCrop(c)}
                aspect={1}
                className="max-w-full max-h-full"
              >
                <img
                  ref={imgRef}
                  src={originalImage}
                  alt="Profile preview"
                  className="max-w-full max-h-full object-contain"
                />
              </ReactCrop>
            </div>
            <div className="mt-4 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setSelectedFile(null);
                  if (originalImage) {
                    URL.revokeObjectURL(originalImage);
                    setOriginalImage(null);
                  }
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCropComplete}
                className="px-4 py-2 bg-[#6c5ce7] text-white rounded-md hover:bg-[#5a4bc7] transition-colors"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Followers Modal */}
      {showFollowers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#6c5ce7]">Followers</h2>
              <button
                onClick={() => setShowFollowers(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {followersList.map((follower) => (
                <div key={`follower-${follower.id}`} className="flex items-center space-x-4">
                  <div className="relative w-10 h-10">
                    <Image
                      src={follower.photoURL || '/default-avatar.svg'}
                      alt={`${follower.firstName}'s profile picture`}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <Link
                      href={`/dashboard/profile/${follower.id}`}
                      className="font-semibold text-[#6c5ce7] hover:underline"
                    >
                      {follower.username}
                    </Link>
                    <p className="text-gray-600 text-sm">{follower.firstName} {follower.lastName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#6c5ce7]">Following</h2>
              <button
                onClick={() => setShowFollowing(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {followingList.map((following) => (
                <div key={`following-${following.id}`} className="flex items-center space-x-4">
                  <div className="relative w-10 h-10">
                    <Image
                      src={following.photoURL || '/default-avatar.svg'}
                      alt={`${following.firstName}'s profile picture`}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <Link
                      href={`/dashboard/profile/${following.id}`}
                      className="font-semibold text-[#6c5ce7] hover:underline"
                    >
                      {following.username}
                    </Link>
                    <p className="text-gray-600 text-sm">{following.firstName} {following.lastName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}