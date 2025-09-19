import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user ID from session or lookup by email
    const backendUrl = process.env.BACKEND_API_URL || 'http://kurs24-api:8000'
    console.log('📄 User invoices API called for:', session.user.email)

    const userId = (session.user as any).dbUserId
    let finalUserId: number

    if (!userId) {
      // Fallback to email lookup for older sessions
      console.log('📄 No dbUserId in session, falling back to email lookup')
      const userIdResponse = await fetch(`${backendUrl}/api/v1/users/email/${encodeURIComponent(session.user.email!)}/id`)
      if (!userIdResponse.ok) {
        throw new Error(`Failed to get user ID: ${userIdResponse.status}`)
      }
      const userIdData = await userIdResponse.json()
      finalUserId = userIdData.user_id
      console.log('📄 User ID from fallback:', finalUserId)
    } else {
      finalUserId = userId
      console.log('📄 Using user ID from session:', finalUserId)
    }

    console.log('📄 Calling user-based invoices API:', `${backendUrl}/api/v1/users/${finalUserId}/invoices`)
    const response = await fetch(`${backendUrl}/api/v1/users/${finalUserId}/invoices`)

    if (!response.ok) {
      console.error('📄 Backend invoices API error:', response.status)
      return NextResponse.json({ error: 'Backend API error' }, { status: response.status })
    }

    const data = await response.json()
    console.log('📄 Invoice data received:', data.total_invoices, 'invoices')

    return NextResponse.json(data)

  } catch (error) {
    console.error('📄 Invoices API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}