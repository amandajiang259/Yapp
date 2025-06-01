"use client";

import { useState, useEffect } from 'react';
import { auth, db } from '../../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp, deleteDoc, orderBy } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';
import { generateWeeklyPrompt } from '../../utils/promptUtils';

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  bio?: string;
}

interface PromptResponse {
  id: string;
  userId: string;
  content: string;
  createdAt: any;
  userData?: UserData;
  prompt: string;
}

interface PersonalAffirmation {
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
  const [responses, setResponses] = useState<PromptResponse[]>([]);
  const [personalAffirmations, setPersonalAffirmations] = useState<PersonalAffirmation[]>([]);
  const [newResponse, setNewResponse] = useState('');
  const [newAffirmation, setNewAffirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState('');

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
      } catch (error) {
        console.error('Error in auth state change:', error);
        setError('Failed to load user data');
      }
    });

    // Set the weekly prompt using the shared function
    setCurrentPrompt(generateWeeklyPrompt());

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      fetchResponses();
    }
  }, [currentUser]);

  useEffect(() => {
    document.title = "Weekly Discussion | Yapp";
  }, []);

  const fetchResponses = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'promptResponses'),
        where('prompt', '==', currentPrompt),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const responsesData: PromptResponse[] = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        responsesData.push({
          id: docSnapshot.id,
          userId: data.userId,
          content: data.content,
          createdAt: data.createdAt,
          userData: data.userData,
          prompt: data.prompt
        });
      }
      
      setResponses(responsesData);
    } catch (error) {
      console.error('Error fetching responses:', error);
      setError('Failed to fetch responses');
    } finally {
      setIsLoading(false);
    }
  };

  const createResponse = async () => {
    if (!currentUserData || !newResponse.trim()) return;

    const newResponseData: PromptResponse = {
      id: uuidv4(),
      userId: currentUserData.id,
      content: newResponse,
      createdAt: serverTimestamp(),
      userData: currentUserData,
      prompt: currentPrompt
    };

    try {
      await addDoc(collection(db, 'promptResponses'), newResponseData);
      setNewResponse('');
      fetchResponses();
    } catch (error) {
      console.error('Error creating response:', error);
      setError('Failed to create response');
    }
  };

  const deleteResponse = async (responseId: string) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'promptResponses', responseId));
      setResponses(prev => prev.filter(response => response.id !== responseId));
    } catch (error) {
      console.error('Error deleting response:', error);
      setError('Failed to delete response');
    }
  };

  const fetchPersonalAffirmations = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const q = query(
        collection(db, 'personalAffirmations'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const affirmationsData: PersonalAffirmation[] = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const userDoc = await getDoc(doc(db, 'users', data.userId));
        const userData = userDoc.exists() ? userDoc.data() as UserData : undefined;
        
        affirmationsData.push({
          id: docSnapshot.id,
          userId: data.userId,
          content: data.content,
          createdAt: data.createdAt,
          userData: userData
        });
      }
      
      setPersonalAffirmations(affirmationsData);
    } catch (error) {
      console.error('Error fetching personal affirmations:', error);
      setError('Failed to fetch personal affirmations');
    } finally {
      setIsLoading(false);
    }
  };

  const createPersonalAffirmation = async () => {
    if (!currentUserData || !newAffirmation.trim()) return;

    // Check if user has reached the limit of 5 affirmations
    const userAffirmations = personalAffirmations.filter(a => a.userId === currentUserData.id);
    if (userAffirmations.length >= 5) {
      setError('You have reached the maximum limit of 5 personal affirmations');
      return;
    }

    const newAffirmationData = {
      userId: currentUserData.id,
      content: newAffirmation,
      createdAt: serverTimestamp(),
      userData: currentUserData
    };

    try {
      await addDoc(collection(db, 'personalAffirmations'), newAffirmationData);
      setNewAffirmation('');
      fetchPersonalAffirmations();
    } catch (error) {
      console.error('Error creating personal affirmation:', error);
      setError('Failed to create personal affirmation');
    }
  };

  const deletePersonalAffirmation = async (affirmationId: string) => {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, 'personalAffirmations', affirmationId));
      setPersonalAffirmations(prev => prev.filter(aff => aff.id !== affirmationId));
    } catch (error) {
      console.error('Error deleting personal affirmation:', error);
      setError('Failed to delete personal affirmation');
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchPersonalAffirmations();
    }
  }, [currentUser]);

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
                  Weekly Discussion
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Personal Affirmations Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-[#6c5ce7] mb-4">Share Your Personal Affirmations</h2>
            <p className="text-gray-600 mb-4">Share up to 5 of your personal affirmations with the community.</p>
            <div className="mb-4">
              <textarea
                value={newAffirmation}
                onChange={(e) => setNewAffirmation(e.target.value)}
                placeholder="Write your personal affirmation..."
                className="w-full p-4 border rounded-md mb-4"
                rows={3}
              />
              <button
                onClick={createPersonalAffirmation}
                disabled={!newAffirmation.trim()}
                className="px-4 py-2 bg-[#6c5ce7] text-white rounded-md hover:bg-[#5a4dc7] transition-colors disabled:opacity-50"
              >
                Share Affirmation
              </button>
            </div>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <div className="space-y-4">
              {isLoading ? (
                <p>Loading affirmations...</p>
              ) : personalAffirmations.length === 0 ? (
                <p>No affirmations shared yet. Be the first to share your affirmation!</p>
              ) : (
                personalAffirmations.map((affirmation) => (
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
                      {affirmation.userId === currentUser?.uid && (
                        <button
                          onClick={() => deletePersonalAffirmation(affirmation.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-gray-700">{affirmation.content}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {affirmation.createdAt?.toDate().toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Weekly Discussion Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-[#6c5ce7] mb-4">Weekly Discussion</h2>
            
            {/* Weekly prompt */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-[#6c5ce7] mb-2">This Week's Prompt</h3>
              <p className="text-gray-700 mb-4">{currentPrompt}</p>
            </div>

            {/* Response form */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-[#6c5ce7] mb-2">Share Your Response</h3>
              <textarea
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full p-4 border rounded-md mb-4"
                rows={4}
              />
              <button
                onClick={createResponse}
                disabled={!newResponse.trim()}
                className="px-4 py-2 bg-[#6c5ce7] text-white rounded-md hover:bg-[#5a4dc7] transition-colors disabled:opacity-50"
              >
                Post Response
              </button>
            </div>

            {/* Responses list */}
            <div>
              <h3 className="text-lg font-medium text-[#6c5ce7] mb-2">Community Responses</h3>
              {isLoading ? (
                <p>Loading responses...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : responses.length === 0 ? (
                <p>No responses yet. Be the first to share your thoughts!</p>
              ) : (
                <div className="space-y-4">
                  {responses.map((response) => (
                    <div key={response.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-3">
                          <Image
                            src={response.userData?.photoURL || '/default-avatar.svg'}
                            alt="Profile"
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                          <span className="font-medium">
                            {response.userData?.firstName} {response.userData?.lastName}
                          </span>
                        </div>
                        {response.userId === currentUser?.uid && (
                          <button
                            onClick={() => deleteResponse(response.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700">{response.content}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {response.createdAt?.toDate().toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
