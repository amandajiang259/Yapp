"use client";

import ImageUploader from "@/components/ImageUploader";
import { useEffect, useState } from "react";
import { auth, signOut, db } from "../../authentication/firebase";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";
import Link from "next/link";
import Head from "next/head";
import { doc, getDoc, collection, addDoc, Timestamp } from "firebase/firestore";

export default function CreatePost() {
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
      if (!user) {
        router.push("/");
      } else {
        setUser(user);
        const userDoc = await getDoc(doc(db, "users", user.uid));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
  
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user?.uid, title, content }),
      });
  
      if (res.ok) {
        router.push("/dashboard");
      } else {
        const data = await res.json();
        console.error("Error:", data.error);
      }
    } catch (err) {
      console.error("Submission error:", err);
    }
  };

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Create Post</title>
      </Head>
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
                  <Link href="/dashboard" className="text-white hover:bg-[#ab9dd3] px-3 py-2 rounded-md text-sm font-medium transition-colors">Home</Link>
                  <Link href="/dashboard/search" className="text-white hover:bg-[#ab9dd3] px-3 py-2 rounded-md text-sm font-medium transition-colors">Search</Link>
                  <Link href="/dashboard/messages" className="text-white hover:bg-[#ab9dd3] px-3 py-2 rounded-md text-sm font-medium transition-colors">Messages</Link>
                  <Link href="/dashboard/profile" className="text-white hover:bg-[#ab9dd3] px-3 py-2 rounded-md text-sm font-medium transition-colors">Profile</Link>
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
        <main className="max-w-3xl mx-auto py-10 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-[#6c5ce7] mb-4">Create a New Post</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Title</label>
                <input
                  type="text"
                  className="w-full border border-gray-800 rounded-md p-2 text-gray-800"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Content</label>
                <textarea
                  className="w-full border border-gray-800 rounded-md p-2 h-40 text-gray-800"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-[#68baa5] text-white px-6 py-2 rounded-md hover:bg-[#5aa594] transition-colors font-medium"
              >
                Submit Post
              </button>
            </form>
            <div class-name="p-10">
              <ImageUploader />
            </div>
          </div>
        </main>

        {/* Bottom banner */}
        <div className="fixed bottom-0 left-0 right-0 bg-[#6c5ce7] text-white p-4 text-center shadow-lg">
          <p>Share your story with the world — your voice matters!</p>
        </div>
      </div>
    </>
  );
}
