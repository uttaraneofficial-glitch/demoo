"use client"
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, AlertCircle, ArrowRight, CheckCircle, Eye, EyeOff } from 'lucide-react'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import CityAutocomplete from '@/components/CityAutocomplete'
import VerifiedAvatar from '@/components/feed/VerifiedAvatar'

import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useSignalStore } from '@/store/useSignalStore'
import { usersApi } from '@/lib/apiClient'
import { auth, firebaseConfigured } from '@/lib/firebase'
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    sendEmailVerification,
    sendPasswordResetEmail
} from 'firebase/auth'

type AuthMode = 'login' | 'signup' | 'onboarding' | 'forgot_password'

const ROLES = ['founder', 'talent', 'mentor', 'investor']

export default function AuthPage() {
    const router = useRouter()
    const { setAuth } = useAuthStore()

    const [mode, setMode] = useState<AuthMode>('login')

        // Show Firebase config banner only on client (after hydration) to avoid
    // SSR/client mismatch — server always renders false, client checks the real value.
    const [firebaseBannerVisible, setFirebaseBannerVisible] = useState(false)
    useEffect(() => {
        setFirebaseBannerVisible(!firebaseConfigured)
        
        // 🚀 NEW: Background ping to wake up the backend (e.g. Railway) 
        // to avoid cold-start delays during signup registration
        usersApi.checkUsername('wakeup-ping', 'founder').catch(() => {});
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

    // ──────────── FIREBASE ERROR MAPPER ────────────
    // Maps Firebase Auth error codes to user-friendly messages.
    // Prevents raw strings like "Firebase: Error (auth/configuration-not-found)"
    // from being shown to end users.
    const firebaseErrorMessage = (err: any): string => {
        const code: string = err?.code ?? ''
        switch (code) {
            // Configuration / setup
            case 'auth/configuration-not-found':
                return 'Authentication service is not configured. Please contact support.'
            case 'auth/internal-error':
                return 'An internal error occurred. Please try again.'
            // Login errors
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
            // Signup errors
            case 'auth/email-already-in-use':
                return 'An account with this email already exists. Try logging in instead.'
            case 'auth/invalid-email':
                return 'Please enter a valid email address.'
            case 'auth/weak-password':
                return 'Password must be at least 6 characters long.'
            case 'auth/operation-not-allowed':
                return 'Email/password sign-in is not enabled. Please contact support.'
            // Network
            case 'auth/network-request-failed':
                return 'Network error. Please check your internet connection and try again.'
            default:
                // Fallback: strip the raw Firebase prefix for any unhandled codes
                if (err?.message) {
                    return err.message.replace(/^Firebase:\s*/i, '').replace(/\s*\(auth\/.*\)\.?$/, '.')
                }
                return 'Something went wrong. Please try again.'
        }
    }

    // ──────────── BACKEND ERROR MAPPER ────────────
    // Maps raw SQL exceptions from the Spring Boot backend to user-friendly messages.
    const formatBackendError = (errString: string): string => {
        if (!errString) return '';
        const lowerErr = errString.toLowerCase();
        if (lowerErr.includes('users_phone_key')) {
            return 'This phone number is already registered to another account.';
        }
        if (lowerErr.includes('users_email_key')) {
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
                // User is in Firebase, verified, but missing from backend DB (dropped off during signup)
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

                if (apiError) {
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

            let isVerified = false;

            const checkVerificationAndRegister = async () => {
                if (isVerified) return true;
                try {
                    const currentUser = auth.currentUser;
                    if (currentUser) {
                        await currentUser.reload();
                        if (currentUser.emailVerified) {
                            isVerified = true;
                            // Get fresh token after verification
                            const freshToken = await currentUser.getIdToken(true);
                            
                            // 3. Register in Backend ONLY AFTER VERIFIED
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
                                setIsWaitingForVerification(false);
                                setError(formatBackendError(apiError || 'Account verified, but failed to sync with our servers.'));
                                return true;
                            }

                            setAuth(currentUser, freshToken, profile as any)
                            setSignupSuccess(true)
                            setIsWaitingForVerification(false)
                            setTimeout(() => {
                            router.push('/dashboard')
                            }, 1000)
                            return true;
                        }
                    }
                } catch (err) {
                    console.error("Polling error:", err)
                }
                return false;
            };

            const pollInterval = setInterval(async () => {
                const done = await checkVerificationAndRegister();
                if (done) {
                    clearInterval(pollInterval);
                    cleanupListeners();
                }
            }, 3000);

            const onVisibilityOrFocus = async () => {
                // Immediately check when tab becomes visible or focused
                if (document.visibilityState === 'visible') {
                    const done = await checkVerificationAndRegister();
                    if (done) {
                        clearInterval(pollInterval);
                        cleanupListeners();
                    }
                }
            };

            const cleanupListeners = () => {
                window.removeEventListener('focus', onVisibilityOrFocus);
                document.removeEventListener('visibilitychange', onVisibilityOrFocus);
            };

            window.addEventListener('focus', onVisibilityOrFocus);
            document.addEventListener('visibilitychange', onVisibilityOrFocus);

            // Prevent the finally block from firing and removing loading state if something else happened.
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

                {isWaitingForVerification ? (
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
                            We've sent a verification link to <span className="text-white font-medium">{email}</span>. 
                            Please check your inbox (and spam folder) and click the link to continue.
                        </p>
                        <div className="flex items-center gap-2 text-sm text-primary">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            Waiting for verification...
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

                {/* Tabs */}
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
                                                onClick={() => setAvatarUrl(url)}
                                                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                                                    isSelected ? 'border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]' : 'border-white/5 grayscale hover:grayscale-0'
                                                }`}
                                            >
                                                <VerifiedAvatar 
                                                    username={name || 'User'}
                                                    avatarUrl={url}
                                                    size="w-full h-full"
                                                    className="!rounded-none"
                                                />
                                                {isSelected && <div className="absolute inset-0 bg-primary/20 flex items-center justify-center z-10"><CheckCircle className="w-5 h-5 text-black" /></div>}
                                            </button>
                                        );
                                    })}
                                    <button 
                                        type="button"
                                        onClick={() => setAvatarUrl(null)}
                                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all flex flex-col items-center justify-center text-[10px] font-bold uppercase ${
                                            !avatarUrl ? 'border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.2)]' : 'border-white/5 text-gray-500 hover:border-white/20'
                                        }`}
                                    >
                                        Initials
                                        {!avatarUrl && <CheckCircle className="w-4 h-4 mt-1" />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-2 uppercase font-bold tracking-tight">
                                    {avatarUrl ? 'Selected Platform Avatar' : 'No selection — using Letter DP instead'}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Mobile Number <span className="text-red-400">*</span></label>
                                <PhoneInput
                                    international
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
