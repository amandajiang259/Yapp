'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../authentication/firebase';
import { User } from 'firebase/auth';
import  Banner  from '../components/Banner';
export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

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

    return () => unsubscribe();
  }, [router]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return ( // dahsbaord
    <div className="min-h-screen bg-indigo-500 text-white">
    <Banner /> {/* 👈 affirmation at the top */}
    <main className="p-8">
      <h1 className="text-3xl font-bold mb text-black">Dashboard</h1>
      <p className="text-md text-black">Signed in with {user.email || "guest"}!</p>
      <h2 className="text-center text-2xl italic mb-4">You are growing more confident and capable every day.</h2>

    </main>
  </div>
  );
} 
// adjusted changes
// this is where any changes need to be made for the actual dashboard