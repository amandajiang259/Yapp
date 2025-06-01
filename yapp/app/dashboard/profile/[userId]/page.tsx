"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { auth, db } from '../../../../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useIsFollowing } from '@/hooks/useIsFollowing';
import { followUser, unfollowUser } from '@/lib/followActions';
import Image from 'next/image';
import Link from 'next/link';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $convertFromMarkdownString } from '@lexical/markdown';
import React from 'react';

interface UserData {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  bio: string;
  photoURL: string;
  interests: string[];
  followers?: string[];
  following?: string[];
}

interface Post {
  id: string;
  content: string;
  createdAt: any;
  userId: string;
  username: string;
  userPhotoURL: string;
  tags: string[];
  formattedContent?: string;
}

export default function UserProfile() {
  const params = useParams();
  const userId = params.userId as string;
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
  const initialFollowing = useIsFollowing(userId);
  const [isFollowingState, setIsFollowingState] = useState<boolean | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<UserData[]>([]);
  const [followingList, setFollowingList] = useState<UserData[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Keep synced when hook loads
  useEffect(() => {
    if (initialFollowing !== null) {
      setIsFollowingState(initialFollowing);
      setIsFollowing(initialFollowing);
    }
  }, [initialFollowing]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/');
      } else {
        setCurrentUser(user);
        // Fetch current user's data from database
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUserData({
            id: userDoc.id,
            ...userDoc.data()
          } as UserData);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch user profile data
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          setError('User not found');
          return;
        }

        const userData = {
          id: userDoc.id,
          ...userDoc.data()
        } as UserData;
        setUser(userData);

        // Fetch user's posts
        const postsRef = collection(db, 'posts');
        const q = query(
          postsRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const userPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          userPhotoURL: userData.photoURL,
          username: userData.username
        })) as Post[];
        setPosts(userPosts);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  useEffect(() => {
    if (currentUserData && user) {
      setIsFollowing(user.followers?.includes(currentUserData.id) || false);
    }
  }, [currentUserData, user]);

  useEffect(() => {
    const fetchFollowersAndFollowing = async () => {
      if (!user) return;

      try {
        // Fetch followers and remove duplicates
        const followersPromises = [...new Set(user.followers || [])].map(async (followerId) => {
          const followerDoc = await getDoc(doc(db, 'users', followerId));
          if (followerDoc.exists()) {
            return {
              id: followerDoc.id,
              ...followerDoc.data()
            } as UserData;
          }
          return null;
        });

        // Fetch following and remove duplicates
        const followingPromises = [...new Set(user.following || [])].map(async (followingId) => {
          const followingDoc = await getDoc(doc(db, 'users', followingId));
          if (followingDoc.exists()) {
            return {
              id: followingDoc.id,
              ...followingDoc.data()
            } as UserData;
          }
          return null;
        });

        const followers = (await Promise.all(followersPromises)).filter(Boolean) as UserData[];
        const following = (await Promise.all(followingPromises)).filter(Boolean) as UserData[];

        // Remove any remaining duplicates by ID
        const uniqueFollowers = Array.from(new Map(followers.map(user => [user.id, user])).values());
        const uniqueFollowing = Array.from(new Map(following.map(user => [user.id, user])).values());

        setFollowersList(uniqueFollowers);
        setFollowingList(uniqueFollowing);
      } catch (error) {
        console.error('Error fetching followers/following:', error);
      }
    };

    fetchFollowersAndFollowing();
  }, [user]);

  const handleFollow = async () => {
    if (!currentUserData || !user) return;

    try {
      const userRef = doc(db, 'users', user.id);
      const currentUserRef = doc(db, 'users', currentUserData.id);
      
      if (isFollowing) {
        // Unfollow
        const updatedFollowers = (user.followers || []).filter(id => id !== currentUserData.id);
        const updatedFollowing = (currentUserData.following || []).filter(id => id !== user.id);
        
        await updateDoc(userRef, {
          followers: updatedFollowers
        });
        await updateDoc(currentUserRef, {
          following: updatedFollowing
        });
        setIsFollowing(false);
      } else {
        // Follow - Check if already following to prevent duplicates
        const isAlreadyFollowing = (currentUserData.following || []).includes(user.id);
        if (!isAlreadyFollowing) {
          const updatedFollowers = [...new Set([...(user.followers || []), currentUserData.id])];
          const updatedFollowing = [...new Set([...(currentUserData.following || []), user.id])];
          
          await updateDoc(userRef, {
            followers: updatedFollowers
          });
          await updateDoc(currentUserRef, {
            following: updatedFollowing
          });
          setIsFollowing(true);
        }
      }

      // Refresh user data
      const updatedUserDoc = await getDoc(userRef);
      if (updatedUserDoc.exists()) {
        setUser({
          id: updatedUserDoc.id,
          ...updatedUserDoc.data()
        } as UserData);
      }

      // Refresh current user data
      const updatedCurrentUserDoc = await getDoc(currentUserRef);
      if (updatedCurrentUserDoc.exists()) {
        setCurrentUserData({
          id: updatedCurrentUserDoc.id,
          ...updatedCurrentUserDoc.data()
        } as UserData);
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      setError('Failed to update follow status');
    }
  };

  if (!currentUser) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f6ebff] p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6c5ce7]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f6ebff] p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center text-red-600">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
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
                <Link href="/dashboard/affirmations" className="text-white hover:bg-[#ab9dd3] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Affirmations
                </Link>
                <Link href="/dashboard/profile" className="text-white hover:bg-[#ab9dd3] px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Profile
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm">Welcome, {currentUserData?.firstName || 'User'}</span>
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

      {/* Main content */}
      <main className="max-w-4xl mx-auto py-6 px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          {/* Profile header */}
          <div className="flex items-center space-x-6 mb-6">
            <div className="relative w-24 h-24">
              <Image
                src={user.photoURL || '/default-avatar.svg'}
                alt={`${user.firstName} ${user.lastName}'s profile picture`}
                fill
                className="rounded-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-[#6c5ce7]">{user.username}</h1>
                {currentUser?.uid !== userId && (
                  <button
                    onClick={handleFollow}
                    className={`px-3 py-1 text-sm rounded text-white font-medium transition-colors ${
                      isFollowing
                        ? 'bg-[#68baa5] hover:bg-red-500'
                        : 'bg-[#68baa5] hover:bg-[#5aa594]'
                    }`}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                )}
              </div>
              <p className="text-gray-600">{user.firstName} {user.lastName}</p>
              <p className="text-gray-600 mt-2">{user.bio || 'No bio available'}</p>
              <div className="flex space-x-4 mt-4">
                <button
                  onClick={() => setShowFollowers(true)}
                  className="text-gray-600 hover:text-[#6c5ce7] transition-colors"
                >
                  <span className="font-semibold">{user.followers?.length || 0}</span> Followers
                </button>
                <button
                  onClick={() => setShowFollowing(true)}
                  className="text-gray-600 hover:text-[#6c5ce7] transition-colors"
                >
                  <span className="font-semibold">{user.following?.length || 0}</span> Following
                </button>
              </div>
            </div>
          </div>
        </div>

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

        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#6c5ce7] mb-2">Interests</h2>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest) => (
                    <span
                        key={interest}
                        className="px-3 py-1 bg-[#f6ebff] text-[#6c5ce7] rounded-full text-sm"
                    >
              {interest}
            </span>
                ))}
              </div>
            </div>
        )}

        {/* Posts */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#6c5ce7] mb-4">Posts</h2>
          {posts.length > 0 ? (
            posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow-md p-4"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative w-10 h-10">
                    <Image
                      src={post.userPhotoURL || '/default-avatar.svg'}
                      alt={`${post.username}'s profile picture`}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <Link
                      href={`/dashboard/profile/${post.userId}`}
                      className="font-semibold text-[#6c5ce7] hover:underline"
                    >
                      {post.username}
                    </Link>
                    <p className="text-gray-500 text-sm">
                      {post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleDateString() : 'No date'}
                    </p>
                  </div>
                </div>
                <div 
                  className="text-gray-800 mb-2"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-[#f6ebff] text-[#6c5ce7] rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">
              No posts yet
            </div>
          )}
        </div>
      </main>

      {/* Bottom banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#6c5ce7] text-white p-4 text-center shadow-lg">
        <p>Welcome to Yapp! Share your positive affirmations and creative stories!</p>
      </div>
    </div>
  );
} 