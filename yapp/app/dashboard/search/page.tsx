"use client";

import { useState, useEffect } from 'react';
import { auth, db } from '../../authentication/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { User } from 'firebase/auth';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $convertFromMarkdownString } from '@lexical/markdown';
import React from 'react';

const interests = [
  'Technology', 'Sports', 'Music', 'Art', 'Travel', 'Food', 'Fashion',
  'Gaming', 'Movies', 'Books', 'Fitness', 'Photography', 'Science',
  'Politics', 'Business', 'Education', 'Health', 'Environment'
];

interface Post {
  id: string;
  userId: string;
  content: string;
  tags: string[];
  createdAt: any;
  type: string;
  formattedContent?: string;
}

interface AppUser {
  id: string;
  username: string;
  photoURL: string;
  bio?: string;
}

interface UserProfile {
  id: string;
  username: string;
  photoURL: string;
  bio?: string;
}

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  bio?: string;
}

export default function SearchPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'users' | 'posts'>('users');
  const [searchResults, setSearchResults] = useState<(Post | AppUser)[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/');
      } else {
        setCurrentUser(user);
        // Fetch user profile data
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

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsLoading(true);

    try {
      if (searchType === 'users') {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        const users = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as AppUser[];
        
        const filteredUsers = users.filter(user => 
          user.username && user.username.toLowerCase().startsWith(searchTerm.toLowerCase())
        );
        setSearchResults(filteredUsers);
      } else {
        const postsRef = collection(db, 'posts');
        const querySnapshot = await getDocs(postsRef);
        const posts = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Post[];
        
        // Filter posts by tag
        const filteredPosts = posts.filter(post => 
          post.tags && post.tags.some(tag => 
            tag.toLowerCase() === searchTerm.toLowerCase()
          )
        );
        
        setSearchResults(filteredPosts);

        // Fetch user profiles for posts
        const userIds = [...new Set(filteredPosts.map(post => post.userId))];
        const userPromises = userIds.map(async (userId) => {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            return {
              id: userDoc.id,
              ...userDoc.data()
            } as UserProfile;
          }
          return null;
        });

        const userResults = await Promise.all(userPromises);
        const userProfilesMap = userResults.reduce((acc, user) => {
          if (user) {
            acc[user.id] = user;
          }
          return acc;
        }, {} as Record<string, UserProfile>);
        setUserProfiles(userProfilesMap);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger search when search term changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, searchType]);

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag);
    setSearchType('posts');
    setSearchTerm(tag);
  };

  if (!currentUser) {
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
                onClick={handleLogout}
                className="px-4 py-2 bg-[#68baa5] text-white rounded-md hover:bg-[#5aa594] transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-2xl font-bold text-[#6c5ce7] mb-4">Search</h1>
            
            <div className="flex flex-col space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setSearchType('users');
                    setSelectedTag(null);
                    setSearchTerm('');
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    searchType === 'users'
                      ? 'bg-[#6c5ce7] text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Users
                </button>
                <button
                  onClick={() => {
                    setSearchType('posts');
                    setSelectedTag(null);
                    setSearchTerm('');
                  }}
                  className={`px-4 py-2 rounded-lg ${
                    searchType === 'posts'
                      ? 'bg-[#6c5ce7] text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Posts
                </button>
              </div>

              {searchType === 'users' && (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by username..."
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent"
                  />
                </div>
              )}

              {searchType === 'posts' && (
                <div className="flex flex-wrap gap-2">
                  {interests.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedTag === tag
                          ? 'bg-[#6c5ce7] text-white'
                          : 'bg-[#f6ebff] text-[#6c5ce7] border border-[#ab9dd3] hover:bg-[#e6d9ff]'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6c5ce7]"></div>
              </div>
            ) : searchResults.length > 0 ? (
              searchType === 'users' ? (
                <div className="space-y-4">
                  {(searchResults as AppUser[]).map((user) => (
                    <Link
                      key={user.id}
                      href={`/dashboard/profile/${user.id}`}
                      className="block"
                    >
                      <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                        <div className="flex items-center space-x-4">
                          <div className="relative w-12 h-12">
                            <Image
                              src={user.photoURL || '/default-avatar.svg'}
                              alt={`${user.username}'s profile picture`}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#6c5ce7]">{user.username}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {(searchResults as Post[]).map((post) => (
                    <Link
                      key={post.id}
                      href={`/dashboard/profile/${post.userId}`}
                      className="block"
                    >
                      <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                        <div className="flex items-center space-x-4">
                          <div className="relative w-12 h-12">
                            <Image
                              src={userProfiles[post.userId]?.photoURL || '/default-avatar.svg'}
                              alt={`${userProfiles[post.userId]?.username}'s profile picture`}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#6c5ce7]">{userProfiles[post.userId]?.username}</p>
                            <div 
                              className="text-gray-600 text-sm"
                              dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : (
              <p>No results found.</p>
            )}
          </div>
        </div>
      </main>

      {/* Bottom banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#6c5ce7] text-white p-4 text-center shadow-lg">
        <p>Welcome to Yapp! Share your positive affirmations and creative stories!</p>
      </div>
    </div>
  );
}