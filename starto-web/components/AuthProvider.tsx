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
                // User is in Firebase but not in backend (e.g., halfway through signup)
                // Do NOT auto-register here. Let auth/page.tsx handle the explicit registration.
                console.warn('[Auth] User in Firebase but not in backend. Waiting for manual registration.');
                setLoading(false);
                // We do NOT clearAuth() because we need the firebase session active for signup to complete.
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
