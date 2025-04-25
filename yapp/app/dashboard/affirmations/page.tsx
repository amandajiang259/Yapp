'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '../../authentication/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { User as FirebaseUser } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  username: string;
  photoURL?: string;
}

interface Response {
  id: string;
  userId: string;
  username: string;
  content: string;
  createdAt: Date;
  userPhotoURL?: string;
}

interface Affirmation {
  id: string;
  userId: string;
  username: string;
  content: string;
  createdAt: Date;
  userPhotoURL?: string;
  responses: Response[];
  likes: string[];
}

const prompts = [
  "I am grateful for a new day. What was your favorite day of last week and why?",
  "I am grateful for a new week. Describe your favorite week so far?",
  "I am feeling healthy and strong today. What are your goals?",
  "I am a healthy and happy person. What made you happy recently?",
  "I choose to focus on the good parts of the day. What was the best part of yesterday?",
  "This is the best day of my life. Describe what you hope for / goals today.",
  "I am grateful that my life is so happy and successful. What are your future goals?",
  "I am excited to wake up today and experience this beautiful life that I am creating with my thoughts and visions. What visions will you bring to life?",
  "I am the creator of my best reality. What did you create most recently?",
  "I am filled with gratitude and kindness for another wonderful day on this earth. What are your plans for tomorrow?",
  "I am full of positive loving energy. Post an appreciative message for those in your life.",
  "Monday, you and I are going to be friends. What social plans are you looking forward to?",
  "Monday won't run me, I will run it. How do you plan to take charge this week?",
  "I am feeling better and better this Monday. Describe your most memorable Monday?",
  "I will put on my positive pants and enjoy my Monday. What inspires you to stay positive?",
  "Monday mornings are for clean slates and fresh starts. Did you do laundry this week, or plan to soon?",
  "I will use today to grow as a person. What are some traits you would like to better in yourself?",
  "This is going to be a productive week. What tasks do you have to complete?",
  "Money, success, and happiness will flow effortlessly toward me. What are your plans for this week?",
  "I am ready for an incredible week. What hopes do you have for this week?",
  "I am a successful and happy person. Describe how success feels to you.",
  "I choose to be free and happy. What was something your friend did to make you happy?",
  "I am a healthy and happy person. What do you wish to do outdoors?",
  "I am willing to be happy now. Describe an act a stranger did to make you feel happy.",
  "Things will fall into place for me effortlessly this Monday. How do you plan to stay organized this week?",
  "It's a good day to have a Monday. Describe your plans for the week.",
  "I see this new week as an opportunity. What new things do you want to try this week?",
  "This week, I am showing myself love. How are some ways you will show yourself love and care?",
  "The power is in my hands. I can make Monday anything I choose. What is your 'superpower' or special quality?",
  "I will make the most out of every minute of this new day, Monday. What is your top priority for this week?",
  "I am grateful for this new week. Describe a transformation you will create this week.",
  "I will accomplish all my to-dos this Monday. What is your favorite beverage to start the day and why?",
  "I am filled with gratitude for a new week. What brings you the most gratitude?",
  "A new day, a new week and many new opportunities are ahead of me. What do you look for in a fresh start?",
  "I will start this Monday with positive energy. Which things bring you the most positivity?",
  "Monday mornings are for clean slates and fresh starts. What type of outdoors experience brings you the most peace?",
  "I focus my vision on creating a life of true joy and prosperity. What makes you feel prosperous and successful?",
  "Happiness is always at my fingertips. What snack do you enjoy eating the most and why?",
  "I deserve to live a joyful, vibrant, passionate life. What are some of your life goals?",
  "I am worthy and deserving of my beautiful dreams. What is your dream you will bring to life?",
  "Today is a great day to be alive! What is something exhilarating you want to experience?",
  "I radiate love and self-confidence. What activity brings you the most self-confidence and why?",
  "I am humble yet confident. What is an experience that made you feel this way?",
  "I choose wholeness. What makes you feel whole and grounded?",
  "I celebrate all of who I am. What celebrations have you participated in recently?",
  "My imperfections make me beautiful. Describe them and how they make you special.",
  "I accept everything in my life. What are some blessings you are grateful for?",
  "I am at peace with myself. Talk about your most peaceful memory.",
  "I am cool, calm, and collected. What else are some of your positive traits?",
  "I am allowing myself to feel good. Share how you want to take care of yourself.",
];

const AffirmationsPage = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [selectedAffirmation, setSelectedAffirmation] = useState<Affirmation | null>(null);
  const [newResponse, setNewResponse] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: FirebaseUser | null) => {
      if (!user) {
        router.push('/');
      } else {
        setCurrentUser(user);
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchAffirmations = async () => {
      try {
        const affirmationsRef = collection(db, 'affirmations');
        const q = query(affirmationsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const affirmationsData: Affirmation[] = [];
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          affirmationsData.push({
            id: doc.id,
            userId: data.userId,
            username: data.username,
            content: data.content,
            createdAt: data.createdAt,
            userPhotoURL: data.userPhotoURL,
            responses: data.responses || [],
            likes: data.likes || []
          });
        }
        setAffirmations(affirmationsData);
      } catch (error) {
        console.error('Error fetching affirmations:', error);
        setError('Failed to load affirmations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAffirmations();
  }, [currentUser]);

  const createAffirmation = async (content: string, user: User) => {
    const newAffirmation: Affirmation = {
      id: uuidv4(),
      userId: user.id,
      username: user.username,
      content: content,
      createdAt: new Date(),
      userPhotoURL: user.photoURL || undefined,
      responses: [],
      likes: []
    };

    try {
      await addDoc(collection(db, "affirmations"), newAffirmation);
      setAffirmations(prev => [newAffirmation, ...prev]);
      setNewResponse("");
    } catch (error) {
      console.error("Error creating affirmation:", error);
    }
  };

  const handleSubmitResponse = async () => {
    if (!currentUser || !selectedAffirmation || !newResponse.trim()) return;

    try {
      const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', currentUser.uid)));
      const userData = userDoc.docs[0]?.data();

      const updatedResponses = [
        ...selectedAffirmation.responses,
        {
          id: Date.now().toString(),
          userId: currentUser.uid,
          username: userData?.username || 'Anonymous',
          content: newResponse,
          createdAt: new Date(),
          userPhotoURL: userData?.photoURL || '/default-avatar.svg'
        }
      ];

      const affirmationRef = doc(db, 'affirmations', selectedAffirmation.id);
      await updateDoc(affirmationRef, {
        responses: updatedResponses
      });

      setNewResponse('');
      setSelectedAffirmation({
        ...selectedAffirmation,
        responses: updatedResponses
      });
    } catch (error) {
      console.error('Error submitting response:', error);
      setError('Failed to submit response');
    }
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
              <span className="text-white text-sm">Welcome, {currentUser.displayName}</span>
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
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-[#6c5ce7]">Daily Affirmations</h1>
              <button
                onClick={() => createAffirmation(prompts[Math.floor(Math.random() * prompts.length)], { 
                  id: currentUser?.uid || '', 
                  username: currentUser?.displayName || 'Anonymous', 
                  photoURL: currentUser?.photoURL || undefined 
                })}
                className="px-4 py-2 bg-[#6c5ce7] text-white rounded-md hover:bg-[#5a4dc7] transition-colors"
              >
                Create New Affirmation
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6c5ce7]"></div>
                </div>
              ) : affirmations.length > 0 ? (
                affirmations.map((affirmation) => (
                  <div
                    key={affirmation.id}
                    className="bg-[#f6ebff] rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedAffirmation(affirmation)}
                  >
                    <h3 className="text-lg font-semibold text-[#6c5ce7] mb-2">
                      {affirmation.content}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {affirmation.responses.length} responses
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No affirmations yet. Create one to get started!
                </div>
              )}
            </div>
          </div>

          {/* Selected Affirmation Modal */}
          {selectedAffirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-[#6c5ce7]">
                    {selectedAffirmation.content}
                  </h2>
                  <button
                    onClick={() => setSelectedAffirmation(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4 mb-6">
                  {selectedAffirmation.responses.map((response) => (
                    <div key={response.id} className="bg-[#f6ebff] rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="relative w-8 h-8">
                          <Image
                            src={response.userPhotoURL || '/default-avatar.png'}
                            alt={`${response.username}'s profile picture`}
                            fill
                            className="rounded-full object-cover"
                          />
                        </div>
                        <span className="font-semibold text-[#6c5ce7]">
                          {response.username}
                        </span>
                      </div>
                      <p className="text-gray-700">{response.content}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <textarea
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6c5ce7] focus:border-transparent"
                  />
                  <button
                    onClick={handleSubmitResponse}
                    className="mt-2 px-4 py-2 bg-[#6c5ce7] text-white rounded-md hover:bg-[#5a4dc7] transition-colors"
                  >
                    Submit Response
                  </button>
                </div>
              </div>
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
};

export default AffirmationsPage;
