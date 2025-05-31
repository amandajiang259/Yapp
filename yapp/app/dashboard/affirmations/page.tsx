"use client";

import { useState, useEffect } from 'react';
import { auth, db } from '../../authentication/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { WEEKLY_PROMPTS } from '../../constants/prompts';

function generateWeeklyPrompt(): string {
  const now = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - oneJan.getTime()) / (1000 * 60 * 60 * 24));
  const week = Math.ceil((days + oneJan.getDay() + 1) / 7);
  const index = week % WEEKLY_PROMPTS.length;
  return WEEKLY_PROMPTS[index];
}

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  bio?: string;
}

interface Affirmation {
  id: string;
  userId: string;
  content: string;
  createdAt: any;
  userData?: UserData;
}

export default function AffirmationsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [newAffirmation, setNewAffirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState('');

  const fetchAffirmations = async () => {
    if (!currentUser) {
      console.log('No authenticated user found');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const q = query(
        collection(db, 'affirmations'),
        where('userId', '==', currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const affirmationsData: Affirmation[] = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        affirmationsData.push({
          id: docSnapshot.id,
          userId: data.userId,
          content: data.content,
          createdAt: data.createdAt,
          userData: data.userData
        });
      }
      
      setAffirmations(affirmationsData);
    } catch (error: any) {
      console.error('Error fetching affirmations:', error);
      setError(error.message || 'Failed to fetch affirmations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/');
        return;
      }
      
      setCurrentUser(user);
      try {
        // Fetch user profile data
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUserData({
            id: userDoc.id,
            ...userDoc.data()
          } as UserData);
        }
        // Only fetch affirmations after user data is loaded
        await fetchAffirmations();
      } catch (error) {
        console.error('Error in auth state change:', error);
        setError('Failed to load user data');
      }
    });

    // Set the weekly prompt
    setCurrentPrompt(generateWeeklyPrompt());

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const createAffirmation = async (content: string) => {
    if (!currentUserData) return;

    const newAffirmation: Affirmation = {
      id: uuidv4(),
      userId: currentUserData.id,
      content: content,
      createdAt: serverTimestamp(),
      userData: currentUserData
    };

    try {
      await addDoc(collection(db, 'affirmations'), newAffirmation);
      setNewAffirmation('');
      fetchAffirmations();
    } catch (error) {
      console.error('Error creating affirmation:', error);
      setError('Failed to create affirmation');
    }
  };

  const deleteAffirmation = async (affirmationId: string) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'affirmations', affirmationId));
      setAffirmations(prev => prev.filter(aff => aff.id !== affirmationId));
    } catch (error) {
      console.error('Error deleting affirmation:', error);
      setError('Failed to delete affirmation');
    }
  };

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
          {/* Weekly prompt */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#6c5ce7] mb-4">Weekly Prompt</h2>
            <p className="text-gray-700 mb-4">{currentPrompt}</p>
            <button
              onClick={() => createAffirmation(currentPrompt)}
              className="px-4 py-2 bg-[#6c5ce7] text-white rounded-md hover:bg-[#5a4dc7] transition-colors"
            >
              Respond to Prompt
            </button>
          </div>

          {/* Create new affirmation */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#6c5ce7] mb-4">Create New Affirmation</h2>
            <textarea
              value={newAffirmation}
              onChange={(e) => setNewAffirmation(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full p-4 border rounded-md mb-4"
              rows={4}
            />
            <button
              onClick={() => createAffirmation(newAffirmation)}
              disabled={!newAffirmation.trim()}
              className="px-4 py-2 bg-[#6c5ce7] text-white rounded-md hover:bg-[#5a4dc7] transition-colors disabled:opacity-50"
            >
              Post Affirmation
            </button>
          </div>

          {/* Affirmations list */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-[#6c5ce7] mb-4">Your Affirmations</h2>
            {isLoading ? (
              <p>Loading affirmations...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : affirmations.length === 0 ? (
              <p>No affirmations yet. Start by creating one!</p>
            ) : (
              <div className="space-y-4">
                {affirmations.map((affirmation) => (
                  <div key={affirmation.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-3">
                        <Image
                          src={affirmation.userData?.photoURL || '/default-avatar.svg'}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <span className="font-medium">
                          {affirmation.userData?.firstName} {affirmation.userData?.lastName}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteAffirmation(affirmation.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        title="Delete affirmation"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-gray-700">{affirmation.content}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {affirmation.createdAt?.toDate().toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
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
