"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '../../firebase';
import CreatePostButton from './CreatePostButton';

interface NavigationProps {
  firstName?: string;
}

export default function Navigation({ firstName }: NavigationProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
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
            <div className="hidden md:flex items-center space-x-4">
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
            <CreatePostButton />
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-white text-sm">Welcome, {firstName || 'User'}</span>
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
  );
} 