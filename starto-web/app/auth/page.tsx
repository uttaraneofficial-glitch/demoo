"use client"
import { useState, useEffect, useRef, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, AlertCircle, ArrowRight, CheckCircle, Eye, EyeOff } from 'lucide-react'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import CityAutocomplete from '@/components/CityAutocomplete'
import VerifiedAvatar from '@/components/feed/VerifiedAvatar'

import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

import { usersApi } from '@/lib/apiClient'
import { auth, firebaseConfigured } from '@/lib/firebase'
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendEmailVerification,
    sendPasswordResetEmail,
    applyActionCode,
    confirmPasswordReset,
    verifyPasswordResetCode
} from 'firebase/auth'

type AuthMode = 'login' | 'signup' | 'onboarding' | 'forgot_password' | 'reset_password'

const ROLES = ['founder', 'talent', 'mentor', 'investor']

function AuthFormContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { setAuth, isAuthenticated } = useAuthStore()

    const [mode, setMode] = useState<AuthMode>('login')

    // Show Firebase config banner only on client (after hydration) to avoid
    // SSR/client mismatch — server always renders false, client checks the real value.
    const [firebaseBannerVisible, setFirebaseBannerVisible] = useState(false)
    useEffect(() => {
        setFirebaseBannerVisible(!firebaseConfigured)
    }, [])

    // Shared fields
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [signupSuccess, setSignupSuccess] = useState(false)
    const [isWaitingForVerification, setIsWaitingForVerification] = useState(false)
    const [isCompletingRegistration, setIsCompletingRegistration] = useState(false)

    // Action handling state (for URL action parameters)
    const [isVerifyingAction, setIsVerifyingAction] = useState(false)
    const [resetEmail, setResetEmail] = useState('')
    const [oobCodeState, setOobCodeState] = useState('')
    const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' })

    // Sign-up extra fields
    const [name, setName] = useState('')
    const [gender, setGender] = useState('')
    const [role, setRole] = useState('')
    const [bio, setBio] = useState('')
    const [city, setCity] = useState('')
    const [lat, setLat] = useState<number | null>(null)
    const [lng, setLng] = useState<number | null>(null)
    const [address, setAddress] = useState('')
    const [phone, setPhone] = useState('')
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [isDetecting, setIsDetecting] = useState(false)

    const [forgotSuccess, setForgotSuccess] = useState(false)
    const [manualChecking, setManualChecking] = useState(false)
    const [resendingEmail, setResendingEmail] = useState(false)
    const [resendStatus, setResendStatus] = useState('')
    const checkPromiseRef = useRef<Promise<any> | null>(null)
    const isRegisteringRef = useRef(false)
    const checkVerificationRef = useRef<((isManual?: boolean) => Promise<void>) | null>(null)

    // Redirect authenticated users immediately to feed
    useEffect(() => {
        if (isAuthenticated && !isWaitingForVerification) {
            router.push('/dashboard')
        }
    }, [isAuthenticated, isWaitingForVerification, router])

    // Detect Firebase action codes from search parameters (email verification, password reset, etc.)
    useEffect(() => {
        if (!firebaseConfigured) return

        const modeParam = searchParams.get('mode')
        const oobCodeParam = searchParams.get('oobCode')

        const handleActionCode = async () => {
            if (!modeParam || !oobCodeParam) return

            setIsVerifyingAction(true)
            setError('')
            setActionMessage({ type: '', text: '' })

            try {
                if (modeParam === 'verifyEmail') {
                    // 1. Verify in Firebase
                    await applyActionCode(auth, oobCodeParam)

                    // 2. Refresh browser session if they are currently logged in
                    const currentUser = auth.currentUser
                    if (currentUser) {
                        await currentUser.reload()
                        const token = await currentUser.getIdToken(true)

                        // Sync with backend API
                        const { data: profile, error: apiError } = await usersApi.getMe(token)

                        if (apiError || !profile) {
                            setIsCompletingRegistration(true)
                            setMode('signup')
                            setError('Your email is verified. Please complete your registration below.')
                        } else {
                            setAuth(currentUser, token, profile as any)
                            router.push('/dashboard')
                        }
                    } else {
                        // Cross-tab notification: store a flag so the original signup tab
                        // can detect the verification instantly via the 'storage' event.
                        try {
                            localStorage.setItem('starto:email_verified', Date.now().toString())
                        } catch {}

                        setActionMessage({
                            type: 'success',
                            text: 'Your email has been verified successfully! Please log in to continue.'
                        })
                        setMode('login')
                    }
                } else if (modeParam === 'resetPassword') {
                    // 1. Verify code and fetch email
                    const emailAddress = await verifyPasswordResetCode(auth, oobCodeParam)
                    setResetEmail(emailAddress)
                    setOobCodeState(oobCodeParam)
                    setMode('reset_password')
                }
            } catch (err: any) {
                console.error("Firebase Action handling failed:", err)
                setActionMessage({
                    type: 'error',
                    text: firebaseErrorMessage(err) || 'The authentication link is invalid or has expired.'
                })
                setMode('login')
            } finally {
                setIsVerifyingAction(false)
            }
        }

        handleActionCode()
    }, [searchParams])

    const switchMode = (m: AuthMode) => {
        setMode(m)
        setError('')
        setSignupSuccess(false)
        setForgotSuccess(false)
        setIsCompletingRegistration(false)
        setEmail('')
        setPassword('')
        setName('')
        setGender('')
        setBio('')
        setCity('')
        setPhone('')
        setConfirmPassword('')
        setShowPassword(false)
        setShowConfirmPassword(false)
    }

    // ──────────── FORGOT PASSWORD ────────────
    const handleForgotEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            if (!email.trim()) {
                setError('Please enter your email address.')
                return
            }
            await sendPasswordResetEmail(auth, email.trim())
            setForgotSuccess(true)
        } catch (err: any) {
            setError(firebaseErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    // ──────────── CONFIRM PASSWORD RESET ────────────
    const handleResetPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            if (!password || !confirmPassword) {
                setError('Please fill in both password fields.')
                setLoading(false)
                return
            }
            if (password.length < 6) {
                setError('Password must be at least 6 characters long.')
                setLoading(false)
                return
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match.')
                setLoading(false)
                return
            }

            await confirmPasswordReset(auth, oobCodeState, password)

            setActionMessage({
                type: 'success',
                text: 'Your password has been successfully reset! Please log in with your new password.'
            })
            if (resetEmail) {
                setEmail(resetEmail)
            }
            switchMode('login')
        } catch (err: any) {
            setError(firebaseErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    // ──────────── FIREBASE ERROR MAPPER ────────────
    const firebaseErrorMessage = (err: any): string => {
        const code: string = err?.code ?? ''
        switch (code) {
            case 'auth/configuration-not-found':
                return 'Authentication service is not configured. Please contact support.'
            case 'auth/internal-error':
                return 'An internal error occurred. Please try again.'
            case 'auth/user-not-found':
                return 'No account found with this email address.'
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.'
            case 'auth/invalid-credential':
                return 'Invalid email or password. Please check your credentials.'
            case 'auth/user-disabled':
                return 'This account has been disabled. Please contact support.'
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please wait a few minutes and try again.'
            case 'auth/email-already-in-use':
                return 'An account with this email already exists. Try logging in instead.'
            case 'auth/invalid-email':
                return 'Please enter a valid email address.'
            case 'auth/weak-password':
                return 'Password must be at least 6 characters long.'
            case 'auth/operation-not-allowed':
                return 'Email/password sign-in is not enabled. Please contact support.'
            case 'auth/network-request-failed':
                return 'Network error. Please check your internet connection and try again.'
            case 'auth/invalid-action-code':
                return 'The link has expired or has already been used.'
            case 'auth/expired-action-code':
                return 'The link has expired. Please request a new one.'
            default:
                if (err?.message) {
                    return err.message.replace(/^Firebase:\s*/i, '').replace(/\s*\(auth\/.*\)\.?$/, '.')
                }
                return 'Something went wrong. Please try again.'
        }
    }

    // ──────────── BACKEND ERROR MAPPER ────────────
    const formatBackendError = (errString: string): string => {
        if (!errString) return '';
        const lowerErr = errString.toLowerCase();
        if (lowerErr.includes('users_phone_key') || lowerErr.includes('key (phone)') || lowerErr.includes('phone)=')) {
            return 'This phone number is already registered to another account.';
        }
        if (lowerErr.includes('users_email_key') || lowerErr.includes('key (email)') || lowerErr.includes('email)=')) {
            return 'This email address is already registered.';
        }
        if (lowerErr.includes('duplicate key value') || lowerErr.includes('already exists')) {
            return 'An account with these details already exists.';
        }
        if (lowerErr.includes('could not execute statement')) {
            return 'A database error occurred. Please try again later.';
        }
        if (lowerErr.includes('jwt') || lowerErr.includes('token')) {
            return 'Your session has expired. Please log in again.';
        }
        return errString;
    }

    // ──────────── LOGIN ────────────
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            // 1. Firebase Login
            const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password)
            const firebaseUser = userCredential.user

            if (!firebaseUser.emailVerified) {
                await sendEmailVerification(firebaseUser);
                setError('Please verify your email address. A new verification link has been sent to your email.');
                await auth.signOut();
                return;
            }

            const token = await firebaseUser.getIdToken()

            // 2. Fetch Profile from Backend
            const { data: profile, error: apiError } = await usersApi.getMe(token)

            if (apiError || !profile) {
                setIsCompletingRegistration(true)
                setMode('signup')
                setError('Your email is verified. Please complete your registration below.')
                return
            }

            // 3. Set Auth State & Redirect
            setAuth(firebaseUser, token, profile as any)
            router.push('/dashboard')
        } catch (err: any) {
            setError(firebaseErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    const checkVerification = async (isManual = false) => {
        if (isManual) {
            setError('')
            setResendStatus('')
        }

        if (isRegisteringRef.current) {
            return
        }

        // If there is already a check in flight, wait for it
        if (checkPromiseRef.current) {
            try {
                const result = await checkPromiseRef.current
                if (isManual && !result) {
                    setError('Email not verified yet. Please check your inbox and click the verification link.')
                }
            } catch (err) {
                if (isManual) {
                    setError('Failed to check verification status. Please try again.')
                }
            }
            return
        }

        const runCheck = async (isManual: boolean): Promise<boolean> => {
            const user = auth.currentUser
            if (!user) return false

            // ── TWO-LAYER VERIFICATION CHECK ──
            // Layer 1 (PRIMARY): user.reload() — calls Firebase's getAccountInfo endpoint
            //   directly (NOT the Secure Token Service). This returns the latest emailVerified
            //   status from Firebase Auth servers WITHOUT triggering token refresh rate limits.
            //   Token force-refresh (getIdToken(true)) is only called ONCE later, after
            //   verification succeeds, to get a fresh registration token.
            // Layer 2 (FALLBACK): Backend /api/auth/check-verification using Firebase Admin
            //   SDK's getUser(). Authoritative server-side check as backup.
            //
            // For manual checks only (isManual=true), also attempt getIdTokenResult(true) as
            // a third layer since it's a single user-triggered action, not polling.
            let isVerified = false

            // ── LAYER 1: Client-side reload (primary) ──
            // Uses getAccountInfo endpoint — separate from token minting, so NOT rate-limited.
            try {
                await user.reload()
                if (user.emailVerified) {
                    isVerified = true
                    console.log('[Verification] reload() reports: VERIFIED')
                }
            } catch (err) {
                console.warn('[Verification] reload() failed:', err)
            }

            // ── LAYER 2: Backend Admin SDK check (fallback) ──
            if (!isVerified) {
                try {
                    const { data } = await usersApi.checkVerification()
                    if (data && data.verified) {
                        isVerified = true
                        console.log('[Verification] Backend Admin SDK reports: VERIFIED')
                    }
                } catch (err) {
                    console.warn('[Verification] Backend check failed:', err)
                }
            }

            // ── LAYER 3: Token force-refresh (manual check only) ──
            // Only runs when user clicks "I have verified my email". Single action, so
            // won't trigger rate limits like polling would.
            if (!isVerified && isManual) {
                try {
                    const idTokenResult = await user.getIdTokenResult(true)
                    if (idTokenResult.claims.email_verified === true) {
                        isVerified = true
                        console.log('[Verification] Manual token claims reports: VERIFIED')
                    }
                } catch (err) {
                    console.warn('[Verification] Manual token claims check failed:', err)
                }
            }

            if (isVerified) {
                if (isRegisteringRef.current) return true
                isRegisteringRef.current = true

                try {
                    // Force-refresh the token ONCE for registration
                    const freshToken = await user.getIdToken(true)
                    
                    const { data: profile, error: apiError } = await usersApi.register({
                        email: email.trim(),
                        name: name.trim(),
                        role,
                        bio,
                        city,
                        lat,
                        lng,
                        address: address || city,
                        phone,
                        gender,
                        avatarUrl
                    } as any, freshToken)

                    if (apiError || !profile) {
                        setIsWaitingForVerification(false)
                        setError(formatBackendError(apiError || 'Account verified, but failed to sync with our servers.'))
                        isRegisteringRef.current = false
                        return true
                    }

                    setAuth(user, freshToken, profile as any)
                    setSignupSuccess(true)
                    setIsWaitingForVerification(false)
                    router.push('/dashboard')
                    return true
                } catch (err) {
                    isRegisteringRef.current = false
                    throw err
                }
            }
            return false
        }

        checkPromiseRef.current = runCheck(isManual)

        try {
            const isVerified = await checkPromiseRef.current
            if (isManual && !isVerified) {
                setError('Email not verified yet. Please check your inbox and click the verification link.')
            }
        } catch (err) {
            console.error("Verification check failed:", err)
            if (isManual) {
                setError('Failed to check verification status. Please try again.')
            }
        } finally {
            checkPromiseRef.current = null
        }
    }
    // Keep the ref in sync so the polling useEffect always has the latest function
    checkVerificationRef.current = checkVerification

    const handleResendEmail = async () => {
        setResendingEmail(true)
        setResendStatus('')
        setError('')
        try {
            const user = auth.currentUser
            if (user) {
                await sendEmailVerification(user)
                setResendStatus('Verification email resent successfully! Please check your inbox.')
            } else {
                setError('No active session found. Please reload and try signing up again.')
            }
        } catch (err: any) {
            setResendStatus(firebaseErrorMessage(err) || 'Failed to resend verification email.')
        } finally {
            setResendingEmail(false)
        }
    }

    // ─── Cross-tab localStorage communication ───
    // When the email verification link opens in a new tab and successfully
    // processes the verification, it stores a flag in localStorage.
    // This tab detects it via the 'storage' event and triggers an immediate check.

    // Poll and listen for visibility/focus/storage to check email verification status instantly
    // Uses checkVerificationRef to avoid stale closures — the effect only depends on
    // isWaitingForVerification, and always calls the latest checkVerification via the ref.
    useEffect(() => {
        if (!isWaitingForVerification) return

        let active = true
        let timer: NodeJS.Timeout

        const poll = async () => {
            if (!active) return
            await checkVerificationRef.current!()
            if (active) {
                timer = setTimeout(poll, 3000)
            }
        }

        // Run an immediate check on mount, then start regular polling
        poll()

        // Instantly check when user returns to the tab via visibility or focus
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkVerificationRef.current!()
            }
        }

        const handleFocus = () => {
            checkVerificationRef.current!()
        }

        // Cross-tab communication: detect when another tab stores the verification flag
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'starto:email_verified') {
                checkVerificationRef.current!()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        window.addEventListener('focus', handleFocus)
        window.addEventListener('storage', handleStorage)

        return () => {
            active = false
            clearTimeout(timer)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.removeEventListener('focus', handleFocus)
            window.removeEventListener('storage', handleStorage)
        }
    }, [isWaitingForVerification])

    // ──────────── SIGN UP ────────────
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            if (!name.trim() || !gender || !email.trim() || !role || !city.trim() || !phone) {
                setError('Please fill all required fields.')
                setLoading(false)
                return
            }

            // Completing registration for an already verified Firebase user
            if (isCompletingRegistration) {
                const currentUser = auth.currentUser;
                if (!currentUser) {
                    setError('Firebase session lost. Please log in again.');
                    setLoading(false);
                    return;
                }
                const token = await currentUser.getIdToken();
                const { data: profile, error: apiError } = await usersApi.register({
                    email: currentUser.email || email.trim(),
                    name: name.trim(),
                    role,
                    bio,
                    city,
                    lat,
                    lng,
                    address: address || city,
                    phone,
                    gender,
                    avatarUrl
                } as any, token)

                if (apiError || !profile) {
                    setError(formatBackendError(apiError || 'Failed to save profile.'));
                    setLoading(false);
                    return;
                }

                setAuth(currentUser, token, profile as any);
                router.push('/dashboard');
                return;
            }

            // Normal Flow (New User)
            if (!password) {
                setError('Password is required.')
                setLoading(false)
                return
            }

            // 1. Firebase Create User
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password)
            const firebaseUser = userCredential.user
            
            const token = await firebaseUser.getIdToken()

            // 2. Send Verification Email & Poll
            await sendEmailVerification(firebaseUser)
            setIsWaitingForVerification(true)
            setLoading(false)

            return;
        } catch (err: any) {
            setError(firebaseErrorMessage(err))
            setLoading(false)
        }
    }

    return (
        <div className="auth-theme min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white text-center selection:bg-white selection:text-black">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white/[0.05] border border-white/10 p-8 rounded-2xl shadow-xl"
            >
                <h1 className="text-4xl font-bold mb-2 tracking-tight">Starto</h1>
                <p className="text-gray-400 mb-8 text-sm">Where Ecosystems Connect.</p>

                {isVerifyingAction ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-10"
                    >
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Verifying Link</h2>
                        <p className="text-gray-400 mb-6 px-4">
                            Please wait while we process your request...
                        </p>
                    </motion.div>
                ) : isWaitingForVerification ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-10"
                    >
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-6">
                            <svg className="w-8 h-8 text-primary animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Verify your email</h2>
                        <p className="text-gray-400 mb-6 px-4">
                            We&apos;ve sent a verification link to <span className="text-white font-medium">{email}</span>. 
                            Please check your inbox (and spam folder) and click the link to continue.
                        </p>
                        <div className="flex flex-col items-center gap-4 w-full">
                            <div className="flex items-center gap-2 text-sm text-primary">
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                Waiting for verification...
                            </div>
                            
                            <button
                                type="button"
                                disabled={manualChecking || resendingEmail}
                                onClick={async () => {
                                    setManualChecking(true)
                                    await checkVerification(true)
                                    setManualChecking(false)
                                }}
                                className="w-full mt-2 bg-white text-black py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all disabled:opacity-50 text-sm"
                            >
                                {manualChecking ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                        Checking status...
                                    </>
                                ) : (
                                    'I have verified my email'
                                )}
                            </button>

                            {error && (
                                <p className="text-red-500 text-xs flex items-center justify-center gap-1 font-medium mt-2 max-w-sm text-center">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
                                </p>
                            )}

                            <div className="mt-4 pt-4 border-t border-white/5 w-full flex flex-col items-center gap-2">
                                <button
                                    type="button"
                                    disabled={resendingEmail || manualChecking}
                                    onClick={handleResendEmail}
                                    className="text-xs text-gray-400 hover:text-white underline transition-colors disabled:opacity-50"
                                >
                                    {resendingEmail ? 'Sending new link...' : "Didn't get the email? Resend verification link"}
                                </button>
                                {resendStatus && (
                                    <p className="text-xs text-green-400 font-medium text-center">{resendStatus}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <>
                        {/* Firebase misconfiguration warning — visible only on client after hydration */}
                        {firebaseBannerVisible && (
                            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg mb-6 text-left">
                                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs font-semibold text-red-400">Firebase not configured</p>
                                    <p className="text-xs text-red-300/80 mt-0.5">
                                        One or more <code className="bg-red-500/20 px-1 rounded">NEXT_PUBLIC_FIREBASE_*</code> env vars
                                        are missing from <code className="bg-red-500/20 px-1 rounded">.env.local</code>.
                                        Check the browser console for the exact missing key, then restart the dev server.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Tabs — Hide when resetting password */}
                        {mode !== 'reset_password' && (
                            <div className="flex border-b border-white/10 mb-8">
                                <button
                                    onClick={() => switchMode('login')}
                                    className={`flex-1 pb-4 text-sm font-medium transition-colors ${mode === 'login' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => switchMode('signup')}
                                    className={`flex-1 pb-4 text-sm font-medium transition-colors ${mode === 'signup' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    Sign Up
                                </button>
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {/* ──── LOGIN ──── */}
                            {mode === 'login' && (
                                <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 text-left">
                                    {signupSuccess && (
                                        <div className="flex items-start gap-2 p-3 bg-white/10 border border-white/20 rounded-lg mb-2">
                                            <CheckCircle className="w-4 h-4 text-white mt-0.5 shrink-0" />
                                            <p className="text-xs text-white/90 leading-relaxed">Account created! Please login with your new credentials.</p>
                                        </div>
                                    )}
                                    {actionMessage.text && (
                                        <div className={`flex items-start gap-2 p-3 border rounded-lg mb-2 text-left ${
                                            actionMessage.type === 'success' 
                                                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                                        }`}>
                                            {actionMessage.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                                            <p className="text-xs leading-relaxed">{actionMessage.text}</p>
                                        </div>
                                    )}
                                    <form onSubmit={handleLogin} className="space-y-4">
                                        <div>
                                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email</label>
                                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 focus:bg-white/10 transition-colors" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Password</label>
                                            <div className="auth-input-container">
                                                <input 
                                                    type={showPassword ? "text" : "password"} 
                                                    value={password} 
                                                    onChange={e => setPassword(e.target.value)} 
                                                    required 
                                                    className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 focus:bg-white/10 transition-colors pr-12" 
                                                />
                                                <div className="auth-input-icon mt-1" onClick={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </div>
                                            </div>
                                        </div>
                                        {error && <p className="text-red-500 text-xs flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" /> {error}</p>}
                                        <button disabled={loading} type="submit" className="w-full bg-white text-black py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-200 transition-all mt-4 disabled:opacity-50">
                                            {loading ? 'Logging in...' : 'Login'}
                                            {!loading && <ArrowRight className="w-4 h-4" />}
                                        </button>
                                    </form>
                                    <p className="text-center text-xs text-gray-500 mt-4">
                                        <button type="button" onClick={() => switchMode('forgot_password')} className="text-gray-400 hover:text-white underline mb-3 block w-full text-center hover:opacity-80">Forgot Password?</button>
                                        Don&apos;t have an account?{' '}
                                        <button type="button" onClick={() => switchMode('signup')} className="text-gray-300 hover:text-white underline">Sign up</button>
                                    </p>
                                </motion.div>
                            )}

                            {/* ──── FORGOT PASSWORD ──── */}
                            {mode === 'forgot_password' && !forgotSuccess && (
                                <motion.div key="forgot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 text-left">
                                    <h2 className="text-xl font-bold text-white mb-2 text-center">Reset Password</h2>
                                    
                                    <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                                        <p className="text-sm text-gray-400 text-center mb-4">Enter your registered email to receive a password reset link.</p>
                                        <div>
                                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email Address</label>
                                            <input 
                                                type="email" 
                                                value={email} 
                                                onChange={e => setEmail(e.target.value)} 
                                                required 
                                                className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 focus:bg-white/10 transition-colors" 
                                                placeholder="your@email.com"
                                            />
                                        </div>
                                        {error && <p className="text-red-500 text-xs flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" /> {error}</p>}
                                        <button disabled={loading} type="submit" className="w-full bg-white text-black py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-200 transition-all mt-4 disabled:opacity-50">
                                            {loading ? 'Sending...' : 'Send Reset Link'}
                                            {!loading && <ArrowRight className="w-4 h-4" />}
                                        </button>
                                        <button type="button" onClick={() => switchMode('login')} className="w-full text-center text-xs text-gray-400 hover:text-white mt-4">Back to Login</button>
                                    </form>
                                </motion.div>
                            )}

                            {/* ──── SUCCESS AFTER FORGOT PASSWORD ──── */}
                            {mode === 'forgot_password' && forgotSuccess && (
                                <motion.div key="forgot-success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center space-y-4 py-4">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle className="w-8 h-8 text-black" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Reset Link Sent!</h2>
                                    <p className="text-sm text-gray-400">If an account exists with <span className="text-white font-medium">{email}</span>, you will receive a password reset link shortly. Please check your inbox and spam folder.</p>
                                    <button
                                        onClick={() => switchMode('login')}
                                        className="w-full bg-white text-black py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-200 transition-all mt-4"
                                    >
                                        Go to Login <ArrowRight className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            )}

                            {/* ──── DYNAMIC RESET PASSWORD FORM ──── */}
                            {mode === 'reset_password' && (
                                <motion.div key="reset-password-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 text-left">
                                    <h2 className="text-xl font-bold text-white mb-2 text-center">Set New Password</h2>
                                    {resetEmail && (
                                        <p className="text-xs text-gray-400 text-center mb-4">
                                            Resetting password for <span className="text-white font-medium">{resetEmail}</span>
                                        </p>
                                    )}
                                    <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                                        <div>
                                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">New Password</label>
                                            <div className="auth-input-container">
                                                <input 
                                                    type={showPassword ? "text" : "password"} 
                                                    value={password} 
                                                    onChange={e => setPassword(e.target.value)} 
                                                    required 
                                                    className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 focus:bg-white/10 transition-colors pr-12" 
                                                    placeholder="Min 6 characters"
                                                />
                                                <div className="auth-input-icon mt-1" onClick={() => setShowPassword(!showPassword)}>
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Confirm New Password</label>
                                            <div className="auth-input-container">
                                                <input 
                                                    type={showConfirmPassword ? "text" : "password"} 
                                                    value={confirmPassword} 
                                                    onChange={e => setConfirmPassword(e.target.value)} 
                                                    required 
                                                    className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 focus:bg-white/10 transition-colors pr-12" 
                                                    placeholder="Repeat password"
                                                />
                                                <div className="auth-input-icon mt-1" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </div>
                                            </div>
                                        </div>
                                        {error && <p className="text-red-500 text-xs flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" /> {error}</p>}
                                        <button disabled={loading} type="submit" className="w-full bg-white text-black py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-200 transition-all mt-4 disabled:opacity-50">
                                            {loading ? 'Updating Password...' : 'Save Password'}
                                            {!loading && <ArrowRight className="w-4 h-4" />}
                                        </button>
                                        <button type="button" onClick={() => switchMode('login')} className="w-full text-center text-xs text-gray-400 hover:text-white mt-4">Cancel</button>
                                    </form>
                                </motion.div>
                            )}

                            {/* ──── SIGN UP ──── */}
                            {mode === 'signup' && !signupSuccess && (
                                <motion.form key="signup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSignup} className="space-y-4 text-left">
                                    <div>
                                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Full Name <span className="text-red-400">*</span></label>
                                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 focus:bg-white/10 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Gender <span className="text-red-400">*</span></label>
                                        <select value={gender} onChange={e => setGender(e.target.value)} required className={`w-full mt-2 bg-[#111] border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-white/40 transition-colors appearance-none ${gender === '' ? 'text-gray-500' : 'text-white'}`}>
                                            <option value="" disabled hidden>Select Gender</option>
                                            <option value="Male" className="text-white">Male</option>
                                            <option value="Female" className="text-white">Female</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Role <span className="text-red-400">*</span></label>
                                        <select value={role} onChange={e => setRole(e.target.value)} required className={`w-full mt-2 bg-[#111] border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-white/40 transition-colors appearance-none ${role === '' ? 'text-gray-500' : 'text-white'}`}>
                                            <option value="" disabled hidden>Select a role</option>
                                            {ROLES.map(r => <option key={r} value={r} className="text-white">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                                        </select>
                                        <p className="text-[10px] text-yellow-500/80 mt-1.5 flex items-center gap-1 font-medium italic">
                                            <AlertCircle className="w-3 h-3" /> Note: Your role is permanent and cannot be changed later.
                                        </p>
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Location (City) <span className="text-red-400">*</span></label>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    if ("geolocation" in navigator) {
                                                        setIsDetecting(true);
                                                        navigator.geolocation.getCurrentPosition(async (pos) => {
                                                            const { latitude, longitude } = pos.coords;
                                                            setLat(latitude);
                                                            setLng(longitude);
                                                            try {
                                                                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                                                                const data = await res.json();
                                                                if (data.address) {
                                                                    const addr = data.address;
                                                                    const cityName = addr.city || addr.town || addr.village || addr.state || '';
                                                                    const fullAddr = data.display_name || [addr.suburb, addr.city, addr.state, addr.country].filter(Boolean).join(', ');
                                                                    setCity(cityName);
                                                                    setAddress(fullAddr);
                                                                } else {
                                                                    setCity('Selected Location');
                                                                    setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                                                                }
                                                            } catch (err) {
                                                                setCity('Selected Location');
                                                                setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                                                            }
                                                            setIsDetecting(false);
                                                        }, () => setIsDetecting(false));
                                                    }
                                                }}
                                                className="text-[10px] font-bold text-primary uppercase hover:underline"
                                            >
                                                {isDetecting ? 'Detecting...' : 'Use my current location'}
                                            </button>
                                        </div>
                                        <CityAutocomplete 
                                            value={address || city} 
                                            onChange={(name, lt, lg, fullAddr) => {
                                                setCity(name);
                                                if (lt) setLat(lt);
                                                if (lg) setLng(lg);
                                                if (fullAddr) setAddress(fullAddr);
                                            }} 
                                            inputClassName="bg-white/5 border-white/10 text-white focus:border-white/40 focus:bg-white/10"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 block">Select Avatar</label>
                                        <div className="grid grid-cols-4 gap-3">
                                            {[1, 2, 3, 4].map(num => {
                                                const url = `/avatars/avatar${num}.svg`;
                                                const isSelected = avatarUrl === url;
                                                return (
                                                    <button 
                                                        key={num}
                                                        type="button"
                                                        onClick={() => setAvatarUrl(isSelected ? null : url)}
                                                        className={`aspect-square rounded-xl border p-2 flex items-center justify-center transition-all bg-white/[0.02] ${isSelected ? 'border-white bg-white/10 scale-95' : 'border-white/10 hover:border-white/30'}`}
                                                    >
                                                        <VerifiedAvatar username="Pre" avatarUrl={url} size="w-12 h-12" />
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Phone Number <span className="text-red-400">*</span></label>
                                        <PhoneInput
                                            placeholder="Enter phone number"
                                            defaultCountry="IN"
                                            value={phone}
                                            onChange={(val) => setPhone(val || '')}
                                            className="phone-input-custom"
                                        />
                                        {phone && phone.startsWith('+91') && phone.length > 3 && !/^\+91[6-9]\d{9}$/.test(phone) && (
                                            <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> 
                                                {phone.length < 13 ? "Enter 10 digits" : "Valid India numbers start with 6-9"}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Bio <span className="text-gray-600">(optional)</span></label>
                                        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={2} className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 focus:bg-white/10 transition-colors resize-none" />
                                    </div>
                                    {!isCompletingRegistration && (
                                        <div className="border-t border-white/10 pt-4">
                                            <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wider">Create your credentials</p>
                                            <div>
                                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email <span className="text-red-400">*</span></label>
                                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 focus:bg-white/10 transition-colors" />
                                            </div>
                                            <div className="mt-4">
                                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Password <span className="text-red-400">*</span></label>
                                                <div className="auth-input-container">
                                                    <input 
                                                        type={showPassword ? "text" : "password"} 
                                                        value={password} 
                                                        onChange={e => setPassword(e.target.value)} 
                                                        required 
                                                        className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 focus:bg-white/10 transition-colors pr-12" 
                                                    />
                                                    <div className="auth-input-icon mt-1" onClick={() => setShowPassword(!showPassword)}>
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4">
                                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Confirm Password <span className="text-red-400">*</span></label>
                                                <div className="auth-input-container">
                                                    <input 
                                                        type={showConfirmPassword ? "text" : "password"} 
                                                        value={confirmPassword} 
                                                        onChange={e => setConfirmPassword(e.target.value)} 
                                                        required 
                                                        className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/40 focus:bg-white/10 transition-colors pr-12" 
                                                    />
                                                    <div className="auth-input-icon mt-1" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {isCompletingRegistration && (
                                        <div className="border-t border-white/10 pt-4">
                                            <div>
                                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email (Verified) <span className="text-red-400">*</span></label>
                                                <input type="email" value={email} disabled className="w-full mt-2 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed" />
                                            </div>
                                        </div>
                                    )}

                                    {error && <p className="text-red-500 text-xs flex items-center gap-1 font-medium"><AlertCircle className="w-3 h-3" /> {error}</p>}
                                    <button disabled={loading} type="submit" className="w-full bg-white text-black py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-200 transition-all mt-4 disabled:opacity-50">
                                        <Mail className="w-5 h-5" />
                                        {loading ? (isCompletingRegistration ? 'Saving profile...' : 'Creating account...') : (isCompletingRegistration ? 'Complete Registration' : 'Create Account')}
                                    </button>
                                </motion.form>
                            )}

                            {/* ──── SUCCESS AFTER SIGNUP ──── */}
                            {mode === 'signup' && signupSuccess && (
                                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center space-y-4 py-4">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle className="w-8 h-8 text-black" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Account Created!</h2>
                                    <p className="text-sm text-gray-400">Your account has been set up. Please login now with the email and password you just created.</p>
                                    <button
                                        onClick={() => { switchMode('login'); setSignupSuccess(true); }}
                                        className="w-full bg-white text-black py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-gray-200 transition-all mt-4"
                                    >
                                        Go to Login <ArrowRight className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                )}
            </motion.div>
        </div>
    )
}

export default function AuthPage() {
    return (
        <Suspense fallback={
            <div className="auth-theme min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white text-center select-none">
                <div className="max-w-md w-full bg-white/[0.05] border border-white/10 p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400 text-sm">Loading Starto Authentication...</p>
                </div>
            </div>
        }>
            <AuthFormContent />
        </Suspense>
    )
}
