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
        const bio = data.bio || `Check out ${name}'s profile on Starto.`
        const avatarUrl = data.avatarUrl || 'https://starto.app/icon.png' // fallback icon

        return {
            title: `${name} (@${username}) - Starto Profile`,
            description: bio,
            openGraph: {
                title: `${name} (@${username}) - Starto Profile`,
                description: bio,
                url: `https://starto.app/profile/${username}`,
                siteName: 'Starto Ecosystem',
                images: [
                    {
                        url: avatarUrl,
                        width: 400,
                        height: 400,
                        alt: `${name}'s Avatar`,
                    }
                ],
                type: 'profile',
            },
            twitter: {
                card: 'summary_large_image',
                title: `${name} (@${username}) - Starto Profile`,
                description: bio,
                images: [avatarUrl],
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
