import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Force a session refresh by returning success
    // The NextAuth JWT callback will be triggered on next request
    return NextResponse.json({
      success: true,
      message: 'Session refresh triggered',
      email: session.user.email
    })

  } catch (error) {
    console.error('Session refresh error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh session' },
      { status: 500 }
    )
  }
}