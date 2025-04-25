'use client';

import { useState, useEffect } from 'react';
import { db } from '../../authentication/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { auth } from '../../authentication/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Affirmation {
  id: string;
  text: string;
  userId: string;
  username: string;
  createdAt: any;
  likes: number;
}

const AFFIRMATIONS = [
  "I am capable of achieving my goals.",
  "Every day is a new opportunity to grow.",
  "I choose to focus on what I can control.",
  "I am worthy of love and respect.",
  "My challenges help me grow stronger.",
  "I believe in my ability to succeed.",
  "I am grateful for all that I have.",
  "I radiate positive energy.",
  "I am enough just as I am.",
  "I trust the journey of my life."
];

export default function Affirmations() {
  const router = useRouter();
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [newAffirmation, setNewAffirmation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [firstName, setFirstName] = useState<string>('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/');
      } else {
        setCurrentUser(user);
        // Fetch user profile data
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setFirstName(userDoc.data().firstName);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!currentUser) return;

    // Fetch affirmations
    const affirmationsRef = collection(db, 'affirmations');
    const q = query(affirmationsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const affirmationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Affirmation[];
      setAffirmations(affirmationsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAffirmation.trim() || !currentUser) return;

    try {
      const affirmationsRef = collection(db, 'affirmations');
      await addDoc(affirmationsRef, {
        text: newAffirmation,
        userId: currentUser.uid,
        username: currentUser.displayName || 'Anonymous',
        createdAt: serverTimestamp(),
        likes: 0
      });

      setNewAffirmation('');
    } catch (error) {
      console.error('Error adding affirmation:', error);
    }
  };

  const handleRandomAffirmation = () => {
    const randomIndex = Math.floor(Math.random() * AFFIRMATIONS.length);
    setNewAffirmation(AFFIRMATIONS[randomIndex]);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

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
              <span className="text-white text-sm">Welcome, {firstName}</span>
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
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold text-[#6c5ce7] mb-8">Daily Affirmations</h1>
        
        {/* Share Affirmation Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#6c5ce7] mb-4">Share Your Affirmation</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex space-x-4">
              <input
                type="text"
                value={newAffirmation}
                onChange={(e) => setNewAffirmation(e.target.value)}
                placeholder="Write your positive affirmation..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#6c5ce7]"
              />
              <button
                type="button"
                onClick={handleRandomAffirmation}
                className="px-4 py-2 bg-[#68baa5] text-white rounded-lg hover:bg-[#5aa594] transition-colors"
              >
                Random
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#6c5ce7] text-white rounded-lg hover:bg-[#5a4dc7] transition-colors"
              >
                Share
              </button>
            </div>
          </form>
        </div>

        {/* Affirmations List */}
        <div className="space-y-4">
          {affirmations.map((affirmation) => (
            <div
              key={affirmation.id}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <p className="text-lg text-gray-800 mb-2">{affirmation.text}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>By {affirmation.username}</span>
                <span>
                  {new Date(affirmation.createdAt?.toDate()).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#6c5ce7] text-white p-4 text-center shadow-lg">
        <p>Welcome to Yapp! Share your positive affirmations and creative stories!</p>
      </div>
    </div>
  );
} 