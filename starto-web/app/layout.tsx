import './globals.css';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import AuthProvider from '@/components/AuthProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/components/ThemeProvider';

export const dynamic = 'force-dynamic'

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#F5F4F0' },
        { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' }
    ]
}

export const metadata: Metadata = {
    title: 'Starto V3',
    description: 'Unified Growth Ecosystem Platform',
    icons: {
        icon: [
            { url: '/icon.png', type: 'image/png' },
            { url: '/favicon.ico', type: 'image/x-icon' }
        ]
    }
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300;1,9..40,400&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
            </head>
            <body className="overflow-x-hidden">
                {/* Fix #7: top-level ErrorBoundary prevents blank screen on unhandled render errors */}
                <ErrorBoundary>
                    <AuthProvider>
                        <ThemeProvider>
                            {children}
                        </ThemeProvider>
                    </AuthProvider>
                </ErrorBoundary>
                <Script
                    src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry,places`}
                    strategy="beforeInteractive"
                />
                <Script
                    src="https://checkout.razorpay.com/v1/checkout.js"
                    strategy="lazyOnload"
                />
            </body>
        </html>
    );
}
