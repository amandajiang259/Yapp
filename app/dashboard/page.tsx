'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../authentication/firebase';
import { User } from 'firebase/auth';
import   { prompts }   from '../../library/prompt';
import  Banner  from '../components/Banner';


function generatePrompt(): string {
  const now = new Date();
  const oneJan = new Date(now.getFullYear(), 0, 1);

  const days = Math.floor((now.getTime() - oneJan.getTime()) / (1000 * 60 * 60 * 24));
  const week = Math.ceil((days + oneJan.getDay() + 1) / 7);
  const index = week % prompts.length;

  return prompts[index];
}


export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const [prompt, setPrompt] = useState<string | null>(null); 

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
        // Redirect to home if not authenticated
        router.push('/');
      }
    });
    const weeklyPrompt = generatePrompt();
    setPrompt(weeklyPrompt);
    return () => unsubscribe();
  }, [router]);

  if (!user) {
    return <div>Loading...</div>;
  }
  // const weeklyPrompt = generatePrompt();
  // setPrompt(weeklyPrompt);

  return ( // dahsbaord
    <div className="min-h-screen bg-indigo-500 text-white">
    <Banner /> {/* 👈 affirmation at the top */}
    <main className="p-8">
      <h1 className="text-3xl font-bold mb text-black">Dashboard</h1>
      <p className="text-md text-black">Signed in with {user.email || "guest"}!</p>
      {prompt && (
          <h2 className="text-center text-xl italic mb-4 text-white">{prompt}</h2>
        )}

    </main>
  </div>
  );
} 
// adjusted changes
// this is where any changes need to be made for the actual dashboard