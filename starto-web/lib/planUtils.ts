/**
 * Plan configuration and utility functions for the frontend.
 * Mirrors the backend PlanConfig.java logic.
 */

export enum Plan {
    EXPLORER = 'EXPLORER',
    TRIAL = 'TRIAL',
    SPRINT = 'SPRINT',
    BOOST = 'BOOST',
    PRO = 'PRO',
    PRO_PLUS = 'PRO_PLUS',
    GROWTH = 'GROWTH',
    ANNUAL = 'ANNUAL',
    CAPTAIN = 'CAPTAIN',
    CAPTAIN_PRO = 'CAPTAIN_PRO'
}

export const MAX_SIGNALS: Record<Plan, number> = {
    [Plan.EXPLORER]: 6,
    [Plan.TRIAL]: 5,
    [Plan.SPRINT]: 5,
    [Plan.BOOST]: 8,
    [Plan.PRO]: 10,
    [Plan.PRO_PLUS]: Infinity,
    [Plan.GROWTH]: Infinity,
    [Plan.ANNUAL]: Infinity,
    [Plan.CAPTAIN]: 10,
    [Plan.CAPTAIN_PRO]: Infinity
};

export const MAX_OFFERS: Record<Plan, number> = {
    [Plan.EXPLORER]: 3,
    [Plan.TRIAL]: 10,
    [Plan.SPRINT]: 20,
    [Plan.BOOST]: Infinity,
    [Plan.PRO]: Infinity,
    [Plan.PRO_PLUS]: Infinity,
    [Plan.GROWTH]: Infinity,
    [Plan.ANNUAL]: Infinity,
    [Plan.CAPTAIN]: Infinity,
    [Plan.CAPTAIN_PRO]: Infinity
};

export const MAX_AI_CALLS: Record<Plan, number> = {
    [Plan.EXPLORER]: 3,
    [Plan.TRIAL]: 5,
    [Plan.SPRINT]: 10,
    [Plan.BOOST]: 15,
    [Plan.PRO]: 20,
    [Plan.PRO_PLUS]: 30,
    [Plan.GROWTH]: Infinity,
    [Plan.ANNUAL]: Infinity,
    [Plan.CAPTAIN]: 20,
    [Plan.CAPTAIN_PRO]: Infinity
};

export const WHATSAPP_UNLOCK: Record<Plan, boolean> = {
    [Plan.EXPLORER]: false,
    [Plan.TRIAL]: true,
    [Plan.SPRINT]: true,
    [Plan.BOOST]: true,
    [Plan.PRO]: true,
    [Plan.PRO_PLUS]: true,
    [Plan.GROWTH]: true,
    [Plan.ANNUAL]: true,
    [Plan.CAPTAIN]: true,
    [Plan.CAPTAIN_PRO]: true
};

export function canPostSignal(plan: string | undefined, currentCount: number): boolean {
    const p = (plan?.toUpperCase() as Plan) || Plan.EXPLORER;
    const limit = MAX_SIGNALS[p] || 0;
    return currentCount < limit;
}

export function canSendOffer(plan: string | undefined, usedToday: number): boolean {
    const p = (plan?.toUpperCase() as Plan) || Plan.EXPLORER;
    const limit = MAX_OFFERS[p] || 0;
    return usedToday < limit;
}

export function hasWhatsappAccess(plan: string | undefined): boolean {
    const p = (plan?.toUpperCase() as Plan) || Plan.EXPLORER;
    return WHATSAPP_UNLOCK[p] || false;
}

export function getSignalLimit(plan: string | undefined): number {
    const p = (plan?.toUpperCase() as Plan) || Plan.EXPLORER;
    return MAX_SIGNALS[p] ?? 0;
}

export function getOfferLimit(plan: string | undefined): number {
    const p = (plan?.toUpperCase() as Plan) || Plan.EXPLORER;
    return MAX_OFFERS[p] ?? 0;
}
