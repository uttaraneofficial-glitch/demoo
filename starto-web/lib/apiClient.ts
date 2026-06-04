import { getAuth } from "firebase/auth";


/**
 * Starto API Client
 * Centralized HTTP client for all backend calls.
 *
 * In browser (CSR) dev mode: uses a relative URL ("") so requests like /api/signals
 * are transparently proxied by Next.js to NEXT_PUBLIC_API_BASE_URL (see next.config.js
 * rewrites). This completely eliminates cross-origin (CORS) issues in local dev.
 *
 * In SSR (Node.js) or production browser: uses the absolute NEXT_PUBLIC_API_BASE_URL
 * so requests reach the backend directly.
 */

const BASE_URL =
    typeof window !== 'undefined' && process.env.NODE_ENV === 'development'
        ? ''  // CSR dev: relative URL → proxied by Next.js → backend (no CORS)
        : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080');

/**
 * Custom fetch wrapper with automatic Firebase Auth header injection.
 */
export async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {},
    overrideToken?: string
): Promise<{ data: T | null; error: string | null; status: number }> {
    try {
        const headers = new Headers(options.headers || {});
        const method = options.method || 'GET';
        
        if (!headers.has('Content-Type') && method !== 'GET') {
            headers.set('Content-Type', 'application/json');
        }

        // Auto-inject Firebase ID Token if user is logged in
        let token = overrideToken;
        const skipAuth = headers.get('X-Skip-Auth') === 'true';
        headers.delete('X-Skip-Auth');

        if (!token && !skipAuth && typeof window !== 'undefined') {
            const auth = getAuth();
            if (auth.currentUser) {
                try {
                    token = await auth.currentUser.getIdToken(false);
                } catch (e) {
                    console.error('[apiFetch] Failed to get Firebase token:', e);
                }
            }
            // NO localStorage fallback — stale tokens cause 400/401 loops
        }

        if (token && !skipAuth) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        const url = `${BASE_URL}${endpoint}`;
        console.log(`[apiFetch] Calling: ${url}`, options);

        const fetchOptions: RequestInit = {
            ...options,
            method,
            headers,
        };

        // Strict enforcement: GET requests must NOT have a body
        if (method === 'GET') {
            delete (fetchOptions as any).body;
        }

        const response = await fetch(url, fetchOptions);

        const status = response.status;
        
        // Handle 204 No Content
        if (status === 204) {
            return { data: null, error: null, status };
        }

        const text = await response.text();
        let data: any = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch (e) {
            data = text;
        }

        if (!response.ok) {
            return {
                data: null,
                error: (data && typeof data === 'object') ? (data.error || data.message || response.statusText) : (data || response.statusText),
                status
            };
        }

        return { data: data as T, error: null, status };
    } catch (err: any) {
        console.error(`API Fetch Error [${endpoint}]:`, err);
        return { data: null, error: err.message || 'Network request failed', status: 0 };
    }
}

// ─── Data Interfaces ─────────────────────────────────────────────────────────

export interface ApiUnifiedPost {
    id: string;
    type: string; // "SIGNAL" or "SPACE" or "need" | "help"
    title: string;
    description: string;
    category: string;
    username: string;
    userId: string;
    userPlan: string;
    userIsVerified?: boolean;
    userRole?: string;
    createdAt: string;
    avatarUrl?: string | null;
    
    // Signal stats
    viewCount?: number;
    responseCount?: number;
    offerCount?: number;
    
    // Space specifics
    spaceType?: string;
    address?: string;
    city?: string;
    state?: string;
    contact?: string;
    website?: string;
    lat?: number | null;
    lng?: number | null;
}

export interface ApiSignal extends ApiUnifiedPost {
    seeking?: string;
    stage?: string;
    compensation?: string;
    visibility?: string;
    signalStrength?: string;
    timelineDays?: number;
    isBoosted?: boolean;
    expiresAt?: string;
}

export interface ApiUser {
    id: string;
    firebaseUid: string;
    email: string;
    name: string;
    username: string;
    phone: string;
    role: string;
    bio: string | null;
    gender: string | null;
    avatarUrl: string | null;
    city: string | null;
    state: string | null;
    country: string;
    industry: string | null;
    subIndustry: string | null;
    websiteUrl: string | null;
    linkedinUrl: string | null;
    twitterUrl: string | null;
    githubUrl: string | null;
    lat: number | null;
    lng: number | null;
    fcmToken?: string | null;
    plan: string;
    planExpiresAt?: string | null;
    signalCount?: number;
    networkSize?: number;
}

export interface ApiComment {
    id: string;
    content: string;
    username: string;
    avatarUrl?: string;
    createdAt: string;
    replies?: ApiComment[];
}

export interface ApiExploreRequest {
    location: string;
    industry: string;
    budget: number;
    stage: string;
    targetCustomer: string;
}

export interface ApiExploreResponse {
    marketDemand: {
        score: number;
        drivers: string[];
        sources: string[];
        growthIndex?: string;
        marketSaturation?: string;
        marketSummary?: string;
    };
    competitors: {
        name: string;
        location: string;
        stage: string;
        description: string;
        threatLevel: string;
    }[];
    risks: {
        title: string;
        description: string;
        severity: string;
        mitigation: string;
    }[];
    budgetFeasibility: {
        canBuild: string[];
        actualNeed: string[];
        verdict: string;
    };
    actionPlan: {
        range: string;
        estimatedBudget?: string;
        goal?: string;
        tasks: string[];
    }[];
}

export interface CreateSignalPayload {
    type: 'need' | 'help';
    title: string;
    description: string;
    category: string;
    seeking: string;
    stage: string;
    city: string;
    state: string;
    lat?: number;
    lng?: number;
    timelineDays: number;
    address?: string;
    signalStrength: string;
}

// ─── Signal API ──────────────────────────────────────────────────────────────

export const signalsApi = {
    /** GET /api/signals — public */
    getAll: (params?: { city?: string; seeking?: string; username?: string; userId?: string; page?: number }) => {
        const qs = params
            ? '?' + Object.entries(params)
                .filter(([, v]) => v != null)
                .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
                .join('&')
            : '';
        return apiFetch<ApiUnifiedPost[] | { content: ApiUnifiedPost[] }>(`/api/signals${qs}`).then(res => {
            console.log('signalsApi.getAll response:', res);
            if (res.data && typeof res.data === 'object' && !Array.isArray(res.data) && 'content' in res.data) {
                return { ...res, data: (res.data as any).content as ApiUnifiedPost[] };
            }
            return res as { data: ApiUnifiedPost[] | null; error: string | null; status: number };
        });
    },

    /** GET /api/signals/my — requires auth */
    getMine: (category?: string) =>
        apiFetch<{ signals: ApiSignal[]; spaces: any[] }>(`/api/signals/my${category ? `?category=${category}` : ''}`),

    /** GET /api/signals/:id — public */
    getById: (id: string) =>
        apiFetch<ApiSignal>(`/api/signals/${id}`),

    /** GET /api/signals/cities — returns unique cities from signals and spaces */
    getCities: () =>
        apiFetch<string[]>('/api/signals/cities'),

    /** POST /api/signals — requires Firebase auth token */
    create: (payload: CreateSignalPayload) =>
        apiFetch<ApiSignal>('/api/signals', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    /** DELETE /api/signals/:id — requires auth */
    delete: (id: string) =>
        apiFetch<void>(`/api/signals/${id}`, { method: 'DELETE' }),

    /** POST /api/signals/spaces — requires auth */
    createSpace: (payload: { name: string; type: string; city: string; state: string; address: string; description: string; lat: number; lng: number; contact?: string; website?: string }) =>
        apiFetch<any>('/api/signals/spaces', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    /** PUT /api/signals/:id — requires auth */
    update: (id: string, payload: Partial<CreateSignalPayload>) =>
        apiFetch<ApiSignal>(`/api/signals/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        }),

    /** GET /api/signals/:id/insights — owner only */
    getInsights: (id: string) =>
        apiFetch<any>(`/api/signals/${id}/insights`),

    /** GET /api/signals/nearby — returns { signals, nearbySpaces, users } */
    getNearby: (lat: number, lng: number, radiusKm: number = 25, role: string = 'all') => 
        apiFetch<{
            signals: ApiSignal[];
            nearbySpaces: any[];
            users: ApiUser[];
            latitude: number;
            longitude: number;
        }>(`/api/signals/nearby?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}&radiusKm=${radiusKm}&role=${role}&_t=${Date.now()}`, {
            headers: { 'X-Skip-Auth': 'true' }
        }),

    /** GET /api/signals/spaces — public */
    getSpaces: (lat: number, lng: number, radiusKm: number = 10) =>
        apiFetch<any[]>(`/api/signals/spaces?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`),

};

// ─── User API ────────────────────────────────────────────────────────────────

export const usersApi = {
    /** GET /api/users/:username — public */
    getByUsername: (username: string) =>
        apiFetch<ApiUser>(`/api/users/${username}`),

    /** GET /api/auth/me — requires auth */
    getMe: (overrideToken?: string) =>
        apiFetch<ApiUser>('/api/auth/me', {}, overrideToken),

    /** POST /api/auth/register — requires auth (Firebase token in header) */
    register: (payload: Partial<ApiUser>, overrideToken?: string) =>
        apiFetch<ApiUser>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        }, overrideToken),

    /** GET /api/auth/check-verification — uses Firebase Admin SDK to definitively check email verification, bypassing client-side caching */
    checkVerification: (overrideToken?: string) =>
        apiFetch<{ verified: boolean }>('/api/auth/check-verification', {}, overrideToken),

    /** PUT /api/users/profile — requires auth */
    updateProfile: (payload: Partial<ApiUser>) =>
        apiFetch<ApiUser>('/api/users/profile', {
            method: 'PUT',
            body: JSON.stringify(payload),
        }),

    /** POST /api/users/heartbeat — requires auth */
    heartbeat: () =>
        apiFetch<void>('/api/users/heartbeat', { method: 'POST' }),

    /** POST /api/users/logout — requires auth */
    logout: () =>
        apiFetch<void>('/api/users/logout', { method: 'POST' }),

    /** GET /api/users/check-username — public */
    checkUsername: (username: string, role: string) =>
        apiFetch<{ available: boolean; username: string; message?: string }>(`/api/users/check-username?username=${username}&role=${role}`),

    /** GET /api/users/plan-status — requires auth */
    getPlanStatus: () =>
        apiFetch<any>('/api/users/plan-status'),

    /** DELETE /api/users/me — requires auth */
    deleteAccount: () =>
        apiFetch<void>('/api/users/me', { method: 'DELETE' }),
};

// ─── Comment API ─────────────────────────────────────────────────────────────

export const commentsApi = {
    /** GET /api/signals/:signalId/comments — public */
    getForSignal: (signalId: string) =>
        apiFetch<ApiComment[]>(`/api/comments/signal/${signalId}`),

    /** POST /api/signals/:signalId/comments — requires auth */
    post: (signalId: string, content: string) =>
        apiFetch<ApiComment>(`/api/comments/signal/${signalId}`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        }),

    /** POST /api/signals/:signalId/comments/:parentId/reply — requires auth */
    postReply: (signalId: string, parentId: string, content: string) =>
        apiFetch<ApiComment>(`/api/comments/signal/${signalId}/${parentId}/reply`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        }),

    /** DELETE /api/signals/:signalId/comments/:commentId — requires auth */
    delete: (signalId: string, commentId: string) =>
        apiFetch<void>(`/api/comments/signal/${signalId}/${commentId}`, { method: 'DELETE' }),
};

// ─── Connection API ──────────────────────────────────────────────────────────
export const connectionsApi = {
    /** POST /api/connections/request */
    sendRequest: (signalId: string | null, message: string, receiverId: string, spaceId: string | null = null) =>
        apiFetch<any>('/api/connections/request', {
            method: 'POST',
            body: JSON.stringify({ signalId, message, receiverId, spaceId }),
        }),

    /** GET /api/connections/pending — incoming for founder */
    getPending: () =>
        apiFetch<any[]>('/api/connections/pending'),

    /** GET /api/connections/sent — outgoing for talent */
    getSent: () =>
        apiFetch<any[]>('/api/connections/sent'),

    /** GET /api/connections/accepted */
    getAccepted: () =>
        apiFetch<any[]>('/api/connections/accepted'),

    /** GET /api/connections/user/:userId/accepted */
    getAcceptedForUser: (userId: string) =>
        apiFetch<any[]>(`/api/connections/user/${userId}/accepted`),

    /** PUT /api/connections/:id/accept */
    accept: (id: string) =>
        apiFetch<any>(`/api/connections/${id}/accept`, { method: 'PUT' }),

    /** PUT /api/connections/:id/reject */
    reject: (id: string) =>
        apiFetch<any>(`/api/connections/${id}/reject`, { method: 'PUT' }),

    /** GET /api/connections/:id/whatsapp */
    getWhatsappLink: (id: string) =>
        apiFetch<{ whatsappUrl: string }>(`/api/connections/${id}/whatsapp`),
};

// ─── Offer API ───────────────────────────────────────────────────────────────
export const offersApi = {
    /** POST /api/offers/request */
    create: (payload: { signalId: string; organizationName: string; portfolioLink: string; message: string }) =>
        apiFetch<any>('/api/offers/request', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    /** GET /api/offers/inbox */
    getInbox: () =>
        apiFetch<any[]>('/api/offers/inbox'),

    /** GET /api/offers/sent */
    getSent: () =>
        apiFetch<any[]>('/api/offers/sent'),

    /** GET /api/offers/:id/whatsapp */
    getWhatsappLink: (id: string) =>
        apiFetch<{ whatsappUrl: string }>(`/api/offers/${id}/whatsapp`),

    /** POST /api/offers/:id/accept */
    accept: (id: string) =>
        apiFetch<any>(`/api/offers/${id}/accept`, { method: 'POST' }),

    /** POST /api/offers/:id/reject */
    reject: (id: string) =>
        apiFetch<any>(`/api/offers/${id}/reject`, { method: 'POST' }),

    /** DELETE /api/offers/:id */
    delete: (id: string) =>
        apiFetch<any>(`/api/offers/${id}`, { method: 'DELETE' }),
};

// ─── Notification API ────────────────────────────────────────────────────────
export const notificationsApi = {
    /** GET /api/notifications */
    getAll: () =>
        apiFetch<any[]>('/api/notifications'),

    /** PUT /api/notifications/:id/read */
    markAsRead: (id: string) =>
        apiFetch<void>(`/api/notifications/${id}/read`, { method: 'PUT' }),

    /** PUT /api/notifications/read-all */
    markAllAsRead: () =>
        apiFetch<void>('/api/notifications/read-all', { method: 'PUT' }),

    /** GET /api/notifications/unread-count */
    getUnreadCount: () =>
        apiFetch<{ count: number }>('/api/notifications/unread-count'),
};

// ─── Subscription API ────────────────────────────────────────────────────────
export const subscriptionsApi = {
    /** GET /api/subscriptions/plans */
    getPlans: () =>
        apiFetch<any[]>('/api/subscriptions/plans'),

    /** GET /api/subscriptions/status */
    getStatus: () =>
        apiFetch<any>('/api/subscriptions/status'),

    /** POST /api/subscriptions/create-order */
    createOrder: (plan: string) =>
        apiFetch<any>('/api/subscriptions/create-order', {
            method: 'POST',
            body: JSON.stringify({ plan }),
        }),

    /** POST /api/subscriptions/verify */
    verify: (payload: { razorpayOrderId?: string; razorpaySubscriptionId?: string; razorpayPaymentId: string; razorpaySignature: string }) =>
        apiFetch<any>('/api/subscriptions/verify', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    /** GET /api/subscriptions/history */
    getHistory: () =>
        apiFetch<any[]>('/api/subscriptions/history'),

    /** POST /api/subscriptions/upgrade */
    upgrade: (plan: string) =>
        apiFetch<any>('/api/subscriptions/upgrade', {
            method: 'POST',
            body: JSON.stringify({ plan }),
        }),
};

// ─── Explore API ─────────────────────────────────────────────────────────────
export const exploreApi = {
    /** POST /api/explore/analyze */
    analyze: (payload: ApiExploreRequest) =>
        apiFetch<ApiExploreResponse>('/api/explore/analyze', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    /** GET /api/explore/usage */
    getUsage: () =>
        apiFetch<{ used: number; limit: number; remaining: number }>('/api/explore/usage'),

    /** GET /api/explore/reports */
    getReports: () =>
        apiFetch<any[]>('/api/explore/reports'),
};

// ─── Search API ──────────────────────────────────────────────────────────────
export const searchApi = {
    /** GET /api/search?q=query */
    search: (query: string) =>
        apiFetch<any>(`/api/search?q=${encodeURIComponent(query)}`),
};

export const subscriptionApi = {
    /** GET /api/subscriptions/plans — public */
    getPlans: () =>
        apiFetch<any[]>('/api/subscriptions/plans'),

    /** POST /api/subscriptions/create-order — requires auth */
    createOrder: (plan: string) =>
        apiFetch<any>('/api/subscriptions/create-order', {
            method: 'POST',
            body: JSON.stringify({ plan }),
        }),

    /** POST /api/subscriptions/verify — requires auth */
    verifyPayment: (payload: { razorpayOrderId?: string; razorpaySubscriptionId?: string; razorpayPaymentId: string; razorpaySignature: string }) =>
        apiFetch<string>('/api/subscriptions/verify', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),

    /** GET /api/subscriptions/status — requires auth */
    getStatus: () =>
        apiFetch<any>('/api/subscriptions/status'),

    /** POST /api/subscriptions/activate-coupon — requires auth */
    activateCoupon: (plan: string, couponCode: string) =>
        apiFetch<any>('/api/subscriptions/activate-coupon', {
            method: 'POST',
            body: JSON.stringify({ plan, couponCode }),
        }),
};

// ─── Reviews API ─────────────────────────────────────────────────────────────
export const reviewsApi = {
    add: (userId: string, rating: number, comment: string) =>
        apiFetch<any>(`/api/reviews/${userId}`, {
            method: 'POST',
            body: JSON.stringify({ rating, comment })
        }),
    getForUser: (userId: string) =>
        apiFetch<any[]>(`/api/reviews/${userId}`),
    getSummary: (userId: string) =>
        apiFetch<{ averageRating: number; totalReviews: number }>(`/api/reviews/${userId}/summary`)
};

// ─── Contact API ─────────────────────────────────────────────────────────────
export const contactApi = {
    /** POST /api/contact */
    sendInquiry: (payload: { name: string; email: string; message: string }) =>
        apiFetch<any>('/api/contact', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
};

// ─── Admin API ───────────────────────────────────────────────────────────────
export const adminApi = {
    /** GET /api/admin/users — admin only */
    getUsers: () =>
        apiFetch<ApiUser[]>('/api/admin/users'),
    
    /** GET /api/admin/stats — admin only */
    getStats: () =>
        apiFetch<{ totalUsers: number }>('/api/admin/stats'),
};

export const promoCodesApi = {
    /** GET /api/admin/promo-codes */
    getAll: (params?: { status?: string; search?: string }) => {
        const qs = params
            ? '?' + Object.entries(params)
                .filter(([, v]) => v != null)
                .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
                .join('&')
            : '';
        return apiFetch<any[]>(`/api/admin/promo-codes${qs}`);
    },

    /** POST /api/admin/promo-codes/generate */
    generate: (count: number) =>
        apiFetch<any[]>('/api/admin/promo-codes/generate', {
            method: 'POST',
            body: JSON.stringify({ count }),
        }),

    /** PUT /api/admin/promo-codes/:id/status */
    updateStatus: (id: string, status: string) =>
        apiFetch<any>(`/api/admin/promo-codes/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        }),

    /** DELETE /api/admin/promo-codes/:id */
    delete: (id: string) =>
        apiFetch<void>(`/api/admin/promo-codes/${id}`, { method: 'DELETE' }),

    /** GET /api/admin/promo-codes/stats */
    getStats: () =>
        apiFetch<any>('/api/admin/promo-codes/stats'),
};

export async function getAuthToken(): Promise<string | null> {
  const user = getAuth().currentUser;
  if (!user) return null;
  return await user.getIdToken();
}
