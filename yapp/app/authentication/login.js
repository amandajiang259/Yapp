import { useState, useEffect } from "react";
import { auth, provider, signInWithPopup, signOut } from "../firebase";
import { useRouter } from "next/router";

export default function LoginPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("User:", result.user);
      router.push("/dashboard"); // Redirect to dashboard after login
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-6 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4">{user ? `Welcome, ${user.displayName}` : "Login"}</h1>
        {user ? (
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-md"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Sign in with Google
          </button>
        )}
      </div>
    </div>
  );
}
