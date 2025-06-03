import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { doc, runTransaction, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if it hasn't been initialized yet
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };

function removeUndefinedFields<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as T;
}

const handleFollow = async () => {
  if (!currentUserData || !user) return;

  try {
    const userRef = doc(db, 'users', user.id);
    const currentUserRef = doc(db, 'users', currentUserData.id);

    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const currentUserDoc = await transaction.get(currentUserRef);

      if (!userDoc.exists() || !currentUserDoc.exists()) {
        throw new Error('User documents not found');
      }

      const userData = userDoc.data() as UserData;
      const currentUserDataTx = currentUserDoc.data() as UserData;

      // Ensure arrays are valid and contain only strings
      const currentFollowers = Array.isArray(userData.followers)
        ? userData.followers.filter((id): id is string => typeof id === 'string')
        : [];
      const currentFollowing = Array.isArray(currentUserDataTx.following)
        ? currentUserDataTx.following.filter((id): id is string => typeof id === 'string')
        : [];

      if (isFollowing) {
        // Unfollow
        const updatedFollowers = currentFollowers.filter((id) => id !== currentUserData.id);
        const updatedFollowing = currentFollowing.filter((id) => id !== user.id);

        transaction.update(userRef, { followers: updatedFollowers });
        transaction.update(currentUserRef, { following: updatedFollowing });
        setIsFollowing(false);
      } else {
        // Follow
        const isAlreadyFollowing = currentFollowing.includes(user.id);
        if (!isAlreadyFollowing) {
          const updatedFollowers = [...new Set([...currentFollowers, currentUserData.id])];
          const updatedFollowing = [...new Set([...currentFollowing, user.id])];

          transaction.update(userRef, { followers: updatedFollowers });
          transaction.update(currentUserRef, { following: updatedFollowing });
          setIsFollowing(true);
        }
      }
    });

    // Refresh user data
    const updatedUserDoc = await getDoc(userRef);
    if (updatedUserDoc.exists()) {
      setUser(removeUndefinedFields({
        id: updatedUserDoc.id,
        ...updatedUserDoc.data()
      }) as UserData);
    }

    // Refresh current user data
    const updatedCurrentUserDoc = await getDoc(currentUserRef);
    if (updatedCurrentUserDoc.exists()) {
      setCurrentUserData(removeUndefinedFields({
        id: updatedCurrentUserDoc.id,
        ...updatedCurrentUserDoc.data()
      }) as UserData);
    }
  } catch (error: any) {
    console.error('Error updating follow status:', error);
    setError(error.message || 'Failed to update follow status');
  }
}; 