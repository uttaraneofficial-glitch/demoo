// In your AuthProvider / Firebase auth listener file
import { onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { usersApi } from '@/lib/apiClient';

// Inside your useEffect:
useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        const { setAuth, clearAuth, setLoading, setInitialized, setFirebaseReady } = useAuthStore.getState();

        // ✅ Mark Firebase as initialized FIRST before any API calls
        setFirebaseReady(true);
        setInitialized(true);

        if (!firebaseUser) {
            clearAuth();
            return;
        }

        try {
            setLoading(true);
            const token = await firebaseUser.getIdToken(false);

            // Try to fetch existing user
            const { data: existingUser, status } = await usersApi.getMe(token);

            if (existingUser) {
                setAuth(firebaseUser, token, existingUser);
                return;
            }

            // ✅ Only register if user truly doesn't exist (404), not on other errors
            if (status === 404) {
                const { data: newUser, error } = await usersApi.register({
                    email: firebaseUser.email ?? '',
                    name: firebaseUser.displayName ?? '',
                    avatarUrl: firebaseUser.photoURL ?? null,
                }, token);

                if (newUser) {
                    setAuth(firebaseUser, token, newUser);
                } else {
                    console.error('[Auth] Register failed:', error);
                    clearAuth();
                }
            } else {
                // ✅ Don't retry on 400/401/500 — clear auth and stop
                console.error('[Auth] getMe failed with status:', status);
                clearAuth();
            }
        } catch (err) {
            console.error('[Auth] Auth flow error:', err);
            clearAuth();
        }
    });

    return () => unsubscribe();
}, []);
