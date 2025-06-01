import {
    doc,
    setDoc,
    getDoc,
    deleteDoc,
    serverTimestamp,
    DocumentReference,
    WithFieldValue,
} from 'firebase/firestore';
import { db, auth } from './firebase';

export const followUser = async (targetUid: string): Promise<void> => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid || currentUid === targetUid) return;

    const ref = doc(
        db,
        'followers',
        currentUid,
        'following',
        targetUid
    ) as DocumentReference<WithFieldValue<{ followedAt: any }>>;

    await setDoc(ref, { followedAt: serverTimestamp() });
};
/**
 * Unfollow a user by deleting the document
 */
export const unfollowUser = async (targetUid: string): Promise<void> => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid || currentUid === targetUid) return;

    const ref = doc(db, 'followers', currentUid, 'following', targetUid);
    await deleteDoc(ref);
};

/**
 * Check if the current user is following another user
 */
export const isFollowing = async (targetUid: string): Promise<boolean> => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid || currentUid === targetUid) return false;

    const ref = doc(db, 'followers', currentUid, 'following', targetUid);
    const snap = await getDoc(ref);

    return snap.exists();
};
