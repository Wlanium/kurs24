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

    // Verify user can only access their own billing data
    if (session.user.email !== decodeURIComponent(params.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use user ID instead of email for backend API call
    const backendUrl = process.env.BACKEND_API_URL || 'http://kurs24-api:8000'
    console.log('💳 Legacy billing API called for:', params.email)

    // Get user ID from session or lookup by email
    const userId = (session.user as any).dbUserId
    let finalUserId: number

    if (!userId) {
      // Fallback to email lookup for older sessions
      console.log('💳 No dbUserId in session, falling back to email lookup')
      const userIdResponse = await fetch(`${backendUrl}/api/v1/users/email/${encodeURIComponent(params.email)}/id`)
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

    console.log('💳 Calling user-based billing API:', `${backendUrl}/api/v1/users/${finalUserId}/billing`)
    const response = await fetch(`${backendUrl}/api/v1/users/${finalUserId}/billing`)

    if (!response.ok) {
      return NextResponse.json({ error: 'Backend API error' }, { status: response.status })
    }

    const data = await response.json()
    console.log('💳 Legacy billing data received:', data.length, 'records')

    // Return data in the expected format for legacy compatibility
    return NextResponse.json({
      status: "success",
      customer_email: params.email,
      total_records: data.length,
      billing_history: data
    })

  } catch (error) {
    console.error('Billing API error:', error)

    // Return mock data as fallback
    return NextResponse.json({
      status: "success",
      customer_email: params.email,
      total_records: 0,
      billing_history: []
    })
  }
}