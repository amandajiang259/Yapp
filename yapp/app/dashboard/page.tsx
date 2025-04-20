"use client";

import { useEffect, useState } from "react";
import { auth, signOut, db } from "../authentication/firebase";
import { useRouter } from "next/navigation";
import { User } from 'firebase/auth';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
      if (!user) {
        router.push('/');
      } else {
        setUser(user);
        // Fetch user profile data
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setFirstName(userDoc.data().firstName);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  if (!user) {
    return null; // The useEffect will handle the redirect to login
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
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-[#6c5ce7] mb-4">Dashboard</h2>
            <p className="text-gray-600">Share your positive affirmations and creative stories here.</p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Example content cards */}
              <div className="bg-[#f6ebff] rounded-lg p-4 border border-[#ab9dd3]">
                <h3 className="text-[#6c5ce7] font-semibold mb-2">Create New Story</h3>
                <p className="text-gray-600 mb-4">Share your thoughts and experiences...</p>
                <button className="bg-[#68baa5] text-white px-4 py-2 rounded-md hover:bg-[#5aa594] transition-colors w-full">
                  Start Writing
                </button>
              </div>
              <div className="bg-[#f6ebff] rounded-lg p-4 border border-[#ab9dd3]">
                <h3 className="text-[#6c5ce7] font-semibold mb-2">Daily Affirmation</h3>
                <p className="text-gray-600 mb-4">Set your daily positive affirmation...</p>
                <button className="bg-[#68baa5] text-white px-4 py-2 rounded-md hover:bg-[#5aa594] transition-colors w-full">
                  Add Affirmation
                </button>
              </div>
              <div className="bg-[#f6ebff] rounded-lg p-4 border border-[#ab9dd3]">
                <h3 className="text-[#6c5ce7] font-semibold mb-2">Connect</h3>
                <p className="text-gray-600 mb-4">Find and connect with other users...</p>
                <button className="bg-[#68baa5] text-white px-4 py-2 rounded-md hover:bg-[#5aa594] transition-colors w-full">
                  Explore
                </button>
              </div>
            </div>
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