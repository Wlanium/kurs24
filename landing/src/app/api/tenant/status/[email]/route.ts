import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user can only access their own tenant status
    if (session.user.email !== decodeURIComponent(params.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Call backend API using internal Docker network
    const backendUrl = process.env.BACKEND_API_URL || 'http://api:8000'
    const response = await fetch(`${backendUrl}/api/v1/tenant/status/${params.email}`)

    if (!response.ok) {
      return NextResponse.json({ error: 'Backend API error' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Tenant status API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenant status' },
      { status: 500 }
    )
  }
}