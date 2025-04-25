import { useEffect, useState } from 'react';
import { isFollowing } from '../lib/followActions';

export const useIsFollowing = (targetUid: string) => {
    const [isFollowingUser, setIsFollowingUser] = useState<boolean | null>(null);

    useEffect(() => {
        const check = async () => {
            const result = await isFollowing(targetUid);
            setIsFollowingUser(result);
        };
        check();
    }, [targetUid]);

    return isFollowingUser;
};