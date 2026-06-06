"use client";

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { usersApi } from '@/lib/apiClient';
import { auth } from '@/lib/firebase';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
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

                if (existingUser && !(existingUser as any).pending) {
                    setAuth(firebaseUser, token, existingUser as any);
                    return;
                }

                if (existingUser && (existingUser as any).pending) {
                    console.warn('[Auth] User verified in Firebase but pending backend registration.');
                    clearAuth();
                    setLoading(false);
                    return;
                }

                // ✅ Only register if user truly doesn't exist (404), not on other errors
                if (status === 404) {
                    // User is in Firebase but not in backend
                    console.warn('[Auth] User in Firebase but not in backend. Waiting for manual registration.');
                    setLoading(false);
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

    return <>{children}</>;
}
