"use client";

import { useEffect, useState } from "react";
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "./authentication/firebase";
import { useRouter } from "next/navigation";
import { User } from 'firebase/auth';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Auth Error:", error);
      if (error.code === 'auth/invalid-credential') {
        setError("Invalid email or password. Please register an account first if you haven't already.");
      } else if (error.code === 'auth/user-not-found') {
        setError("No account found with this email. Please register first.");
      } else if (error.code === 'auth/wrong-password') {
        setError("Incorrect password. Please try again.");
      } else if (error.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters long. Please choose a stronger password.");
      } else if (error.code === 'auth/email-already-in-use') {
        setError("This email already has an account associated with it. Please log into the account. If you forgot your password, click 'Forgot Password'.");
      } else {
        setError(error.message || "An error occurred during authentication");
      }
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Password reset email sent! Please check your inbox.");
      setIsForgotPassword(false);
    } catch (error: any) {
      console.error("Password Reset Error:", error);
      if (error.code === 'auth/user-not-found') {
        setError("No account found with this email. Please register first.");
      } else {
        setError(error.message || "An error occurred while sending the reset email");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Yapp</h1>
            <p className="text-gray-600">Connect with your friends</p>
          </div>

          {user ? (
            <div className="text-center">
              <p className="text-gray-800 mb-4">Welcome, {user.email}</p>
              <button
                onClick={handleLogout}
                className="w-full py-3 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <form onSubmit={isForgotPassword ? handleForgotPassword : handleAuth} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                  {successMessage}
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                  required
                />
              </div>
              {!isForgotPassword && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              )}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors font-medium"
              >
                {isForgotPassword ? "Send Reset Link" : (isRegistering ? "Create Account" : "Sign In")}
              </button>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {isRegistering
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Create one"}
                </button>
                {!isRegistering && !isForgotPassword && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot your password?
                  </button>
                )}
                {isForgotPassword && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(false)}
                    className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Back to Sign In
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}