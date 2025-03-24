import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth, signOut } from "../firebase";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/login"); // Redirect to login if not authenticated
      } else {
        setUser(user);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      {user && <p>Welcome, {user.displayName}!</p>}
      <button
        onClick={() => signOut(auth)}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md"
      >
        Logout
      </button>
    </div>
  );
}