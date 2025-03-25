'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../authentication/firebase';
import { User } from 'firebase/auth';

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      if (user) {
        setUser(user);
      } else {
        // Redirect to home if not authenticated
        router.push('/');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-indigo-500">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <h2 className= "text-center text-3xl fontbold mb-4">I grow more confident and stronger each day.</h2> 
      
      <p>Welcome, {user.email}!</p>
      {/* Add your dashboard content here */}
    </div>
  );
} 
// this is where any changes need to be made for the actual dashboard