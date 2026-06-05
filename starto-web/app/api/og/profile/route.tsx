import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const username = searchParams.get('username')
        
        if (!username) {
            return new Response('Username is required', { status: 400 })
        }

        // Fetch user data from our backend
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://startoindia.com'
        const response = await fetch(`${baseUrl}/api/users/profile/${username}`)
        
        if (!response.ok) {
            return new Response('Failed to fetch user', { status: 404 })
        }

        const data = await response.json()
        const user = data.data || data

        const name = user.name || user.username
        const role = user.role || 'Member'
        const city = user.city || 'Global'
        const avatarUrl = user.avatarUrl || `${baseUrl}/icon.png`

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#050505',
                        backgroundImage: 'radial-gradient(circle at 15% 50%, rgba(255, 255, 255, 0.08) 0%, transparent 50%), radial-gradient(circle at 85% 30%, rgba(255, 255, 255, 0.04) 0%, transparent 50%)',
                        fontFamily: 'sans-serif',
                        color: '#fff',
                    }}
                >
                    {/* Glassmorphism Card */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '48px',
                            padding: '80px',
                            width: '1040px',
                            height: '480px',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        }}
                    >
                        {/* Left Content - User Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '32px', marginBottom: '40px' }}>
                                <img
                                    src={avatarUrl}
                                    style={{
                                        width: '160px',
                                        height: '160px',
                                        borderRadius: '80px',
                                        objectFit: 'cover',
                                        border: '4px solid rgba(255,255,255,0.1)',
                                    }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <h1 style={{ fontSize: '72px', fontWeight: '800', letterSpacing: '-0.05em', margin: '0 0 8px 0', color: '#fff', lineHeight: 1.1 }}>
                                        {name}
                                    </h1>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <span style={{ fontSize: '32px', fontWeight: '500', color: '#a3a3a3', letterSpacing: '-0.02em' }}>{role}</span>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '3px', background: '#404040' }} />
                                        <span style={{ fontSize: '32px', fontWeight: '500', color: '#737373', letterSpacing: '-0.02em' }}>{city}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Abstract Badge/Metric Area (Optional for looks) */}
                            <div style={{ display: 'flex', gap: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '16px 32px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ fontSize: '24px', fontWeight: '600', color: '#fff' }}>Starto Member</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Content - Branding */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%' }}>
                            <img src={`${baseUrl}/icon.png`} style={{ width: '80px', height: '80px', opacity: 0.9 }} />
                            
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <span style={{ fontSize: '24px', fontWeight: '700', color: '#fff', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>Starto</span>
                                <span style={{ fontSize: '20px', fontWeight: '400', color: '#666' }}>startoindia.com</span>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        )
    } catch (e: any) {
        console.log(`${e.message}`)
        return new Response(`Failed to generate the image`, {
            status: 500,
        })
    }
}
