import { create } from 'zustand'
import { connectionsApi, offersApi } from '@/lib/apiClient'
import { useAuthStore } from './useAuthStore'

export interface Connection {
    id: string;
    status: string;
    message?: string;
    createdAt: string;
    
    requesterId: string;
    requesterName: string;
    requesterUsername: string;
    requesterAvatarUrl?: string;
    requesterRole: string;
    
    receiverId: string;
    receiverName: string;
    receiverUsername: string;
    receiverAvatarUrl?: string;
    receiverRole: string;
    
    signalId?: string;
}

export interface Offer {
    id: string;
    signalId: string;
    signalTitle?: string;
    requesterId: string;
    receiverId: string;
    requesterUsername: string;
    receiverUsername: string;
    requesterName: string;
    receiverName: string;
    requesterAvatarUrl?: string;
    receiverAvatarUrl?: string;
    organizationName: string;
    portfolioLink: string;
    message: string;
    status: string;
    createdAt: string;
}

interface NetworkState {
    connections: Connection[];       // accepted connections
    pendingRequests: Connection[];   // incoming requests
    sentRequests: Connection[];      // outgoing requests
    offers: Offer[];
    
    sendRequest: (signalId: string | null, message: string, receiverId?: string, spaceId?: string | null) => Promise<void>;
    fetchRequests: () => Promise<void>;
    acceptRequest: (connectionId: string) => Promise<void>;
    rejectRequest: (connectionId: string) => Promise<void>;
    
    addOffer: (offer: Omit<Offer, 'id' | 'timestamp'>) => void;
    deleteOffer: (id: string) => void;
    acceptOffer: (id: string) => Promise<void>;
    rejectOffer: (id: string) => Promise<void>;
    clearAll: () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
    connections: [],
    pendingRequests: [],
    sentRequests: [],
    offers: [],

    sendRequest: async (signalId, message, receiverId, spaceId) => {
        try {
            const { error } = await connectionsApi.sendRequest(signalId, message, receiverId || '', spaceId);
            if (!error) {
                await get().fetchRequests();
                return;
            }
            throw new Error(error);
        } catch (e) {
            console.error('Failed to send request:', e);
            throw e;
        }
    },

    fetchRequests: async () => {
        const [pendingRes, sentRes, acceptedRes] = await Promise.all([
            connectionsApi.getPending(),
            connectionsApi.getSent(),
            connectionsApi.getAccepted()
        ]);

        if (pendingRes.data) set({ pendingRequests: pendingRes.data });
        if (sentRes.data) set({ sentRequests: sentRes.data });
        if (acceptedRes.data) set({ connections: acceptedRes.data });
    },

    fetchOffers: async () => {
        try {
            const { data } = await offersApi.getInbox();
            if (data) set({ offers: data });
        } catch (error) {
            console.error('Failed to fetch offers:', error);
        }
    },

    addOffer: async (offer) => {
        const previousOffers = get().offers;
        
        // 1. Optimistic Update
        const tempId = `temp-${Date.now()}`;
        const optimisticOffer = { 
            ...offer, 
            id: tempId, 
            status: 'PENDING',
            createdAt: new Date().toISOString()
        } as Offer;
        
        set({ offers: [...previousOffers, optimisticOffer] });

        try {
            // 2. Perform API Call
            const { data, error, status } = await offersApi.create(offer);
            
            if (error) {
                const err = new Error(error);
                (err as any).status = status;
                throw err;
            }
            
            // 3. Replace optimistic offer with real data from server
            if (data) {
                set((state) => ({ 
                    offers: state.offers.map(o => o.id === tempId ? data : o) 
                }));
            }
            return data;
        } catch (error) {
            // 4. Rollback on failure
            set({ offers: previousOffers });
            console.error('Failed to send offer:', error);
            throw error;
        }
    },

    fetchAccepted: async () => {
        const currentUser = useAuthStore.getState().user?.username;
        if (!currentUser) return;
        try {
            const { data } = await connectionsApi.getAccepted();
            if (data) {
                set({ connections: data });
            }
        } catch (error) {
            console.error('Failed to fetch connections:', error);
        }
    },

    acceptRequest: async (requestId) => {
        try {
            const { error } = await connectionsApi.accept(requestId);
            if (!error) {
                await get().fetchRequests();
                return;
            }
        } catch (error) {
            console.error('Failed to accept request:', error);
        }
        
        set(state => {
            const req = state.pendingRequests.find(r => r.id === requestId || r.requesterUsername === requestId);
            if (!req) return state;
            return {
                pendingRequests: state.pendingRequests.filter(r => r !== req),
                connections: [...state.connections, { ...req, status: 'ACCEPTED' }]
            };
        });
    },

    rejectRequest: async (requestId) => {
        // Optimistic update for both pending and accepted connections
        set(state => ({
            connections: state.connections.filter(c => c.id !== requestId),
            pendingRequests: state.pendingRequests.filter(r => r.id !== requestId)
        }));

        try {
            const { error } = await connectionsApi.reject(requestId);
            if (!error) {
                await get().fetchRequests();
                return;
            } else {
                // Rollback on error by refetching
                await get().fetchRequests();
            }
        } catch (error) {
            console.error('Failed to reject request:', error);
            await get().fetchRequests();
        }
    },

    acceptOffer: async (offerId) => {
        // Optimistic update
        set(state => ({
            offers: state.offers.map(o => o.id === offerId ? { ...o, status: 'ACCEPTED' } : o)
        }));

        try {
            const { error } = await offersApi.accept(offerId);
            if (!error) {
                await get().fetchRequests();
                await get().fetchOffers();
            } else {
                // Rollback or refetch on error
                await get().fetchOffers();
            }
        } catch (error) {
            console.error('Failed to accept offer:', error);
            await get().fetchOffers();
        }
    },

    rejectOffer: async (offerId) => {
        // Optimistic update
        set(state => ({
            offers: state.offers.map(o => o.id === offerId ? { ...o, status: 'REJECTED' } : o)
        }));

        try {
            const { error } = await offersApi.reject(offerId);
            if (!error) {
                await get().fetchOffers();
            } else {
                // Rollback on error
                await get().fetchOffers();
            }
        } catch (error) {
            console.error('Failed to reject offer:', error);
            await get().fetchOffers();
        }
    },

    deleteOffer: async (offerId) => {
        // Optimistic update
        set(state => ({
            offers: state.offers.filter(o => o.id !== offerId)
        }));

        try {
            const { error } = await offersApi.delete(offerId);
            if (!error) {
                await get().fetchOffers();
            } else {
                // Rollback on error
                await get().fetchOffers();
            }
        } catch (error) {
            console.error('Failed to delete offer:', error);
            await get().fetchOffers();
        }
    },
            
    clearAll: () => set({ connections: [], pendingRequests: [], sentRequests: [], offers: [] }),
}))
