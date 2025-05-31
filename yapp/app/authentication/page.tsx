"use client";

import { useState, useEffect } from "react";
import { auth, provider, signInWithPopup, signOut } from "./firebase";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        router.push("/dashboard");
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("User:", result.user);
      router.push("/dashboard");
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out");
      router.push("/");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6ebff] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#6c5ce7] mb-2">Welcome to Yapp</h1>
          <p className="text-gray-600">Share your positive affirmations and creative stories!</p>
        </div>
        
        {user ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <Image
                src={user.photoURL || '/default-avatar.svg'}
                alt="Profile"
                width={40}
                height={40}
                className="rounded-full"
              />
              <span className="text-gray-700">{user.displayName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-[#68baa5] text-white rounded-md hover:bg-[#5aa594] transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="w-full px-4 py-2 bg-[#6c5ce7] text-white rounded-md hover:bg-[#5a4bc7] transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <Image
              src="/google-icon.svg"
              alt="Google"
              width={20}
              height={20}
            />
            <span>Sign in with Google</span>
          </button>
        )}
      </div>
    </div>
  );
} 