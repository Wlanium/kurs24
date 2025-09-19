import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get billing records using user ID from session
    const backendUrl = process.env.BACKEND_API_URL || 'http://api:8000'
    console.log('💳 Billing API called for user:', session.user.email)

    // Use user ID directly from session if available
    const userId = (session.user as any).dbUserId
    let finalUserId: number

    if (!userId) {
      // Fallback to email lookup for older sessions
      console.log('💳 No dbUserId in session, falling back to email lookup')
      const userIdResponse = await fetch(`${backendUrl}/api/v1/users/email/${encodeURIComponent(session.user.email!)}/id`)
      if (!userIdResponse.ok) {
        throw new Error(`Failed to get user ID: ${userIdResponse.status}`)
      }
      const userIdData = await userIdResponse.json()
      finalUserId = userIdData.user_id
      console.log('💳 User ID from fallback:', finalUserId)
    } else {
      finalUserId = userId
      console.log('💳 Using user ID from session:', finalUserId)
    }

    console.log('💳 Fetching billing from:', `${backendUrl}/api/v1/users/${finalUserId}/billing`)
    const response = await fetch(`${backendUrl}/api/v1/users/${finalUserId}/billing`)

    if (!response.ok) {
      console.error('💳 Backend billing API error:', response.status)
      return NextResponse.json({ error: 'Backend API error' }, { status: response.status })
    }

    const data = await response.json()
    console.log('💳 Billing data received:', data.length, 'records')

    // Return data in the format expected by the frontend
    return NextResponse.json({
      status: "success",
      customer_email: session.user.email,
      total_records: data.length,
      billing_history: data
    })

  } catch (error) {
    console.error('💳 Billing API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing data' },
      { status: 500 }
    )
  }
}