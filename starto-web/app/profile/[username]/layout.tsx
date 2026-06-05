import { Metadata, ResolvingMetadata } from 'next'

type Props = {
    params: { username: string }
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const username = params.username

    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
        
        // Fetch user data directly to avoid Firebase client SDK issues in Server Component
        const res = await fetch(`${baseUrl}/api/users/username/${username}`, {
            next: { revalidate: 60 } // Cache for 60 seconds
        })
        
        if (!res.ok) {
            return {
                title: 'User Profile - Starto',
                description: 'View user profile on Starto ecosystem.'
            }
        }
        
        const data = await res.json()
        const name = data.name || username
        const role = data.role || 'Member'
        const bio = data.bio || `Check out ${name}'s profile on Starto.`
        const avatarUrl = data.avatarUrl || 'https://starto.app/icon.png' // fallback icon

        const ogImageUrl = `https://startoindia.com/api/og/profile?username=${username}`

        return {
            title: `${name} (@${username}) - Starto Profile`,
            description: bio,
            openGraph: {
                title: `${name} (@${username}) - Starto Profile`,
                description: bio,
                url: `https://startoindia.com/profile/${username}`,
                siteName: 'Starto Ecosystem',
                images: [
                    {
                        url: ogImageUrl,
                        width: 1200,
                        height: 630,
                        alt: `${name}'s Starto Profile Badge`,
                    }
                ],
                type: 'profile',
            },
            twitter: {
                card: 'summary_large_image',
                title: `${name} (@${username}) - Starto Profile`,
                description: bio,
                images: [ogImageUrl],
                creator: `@${username}`,
            },
        }
    } catch (error) {
        return {
            title: 'User Profile - Starto',
        }
    }
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
