import { Metadata, ResolvingMetadata } from 'next'

type Props = {
    params: { id: string }
}

export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const id = params.id

    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'
        
        // Fetch signal data directly
        const res = await fetch(`${baseUrl}/api/signals/${id}`, {
            next: { revalidate: 60 }
        })
        
        if (!res.ok) {
            return {
                title: 'Starto Signal',
                description: 'View this signal on the Starto ecosystem.'
            }
        }
        
        const data = await res.json()
        const title = data.title || 'Starto Signal'
        const description = data.description || 'Check out this signal on Starto.'
        const category = data.category || 'General'
        
        // Next.js requires absolute URLs for og:image
        let avatarUrl = 'https://starto.app/icon.png'
        if (data.username) {
            const userRes = await fetch(`${baseUrl}/api/users/username/${data.username}`, { next: { revalidate: 300 }})
            if (userRes.ok) {
                const userData = await userRes.json()
                if (userData.avatarUrl) {
                    avatarUrl = userData.avatarUrl
                }
            }
        }

        return {
            title: `${title} - Starto Signal`,
            description: description,
            openGraph: {
                title: `${title} - Starto Signal`,
                description: description,
                url: `https://starto.app/signals/${id}`,
                siteName: 'Starto Ecosystem',
                images: [
                    {
                        url: avatarUrl,
                        width: 800,
                        height: 400,
                        alt: title,
                    }
                ],
                type: 'article',
                authors: data.username ? [data.username] : [],
                tags: [category],
            },
            twitter: {
                card: 'summary_large_image',
                title: `${title} - Starto Signal`,
                description: description,
                images: [avatarUrl],
                creator: data.username ? `@${data.username}` : undefined,
            },
        }
    } catch (error) {
        return {
            title: 'Starto Signal',
        }
    }
}

export default function SignalLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
