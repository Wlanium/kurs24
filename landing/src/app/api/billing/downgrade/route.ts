import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, targetPlan, currentPlan } = await request.json()

    if (!email || !targetPlan || !currentPlan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user can only downgrade their own plan
    if (session.user.email !== email) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Call backend API to schedule downgrade
    try {
      const backendUrl = process.env.BACKEND_API_URL || 'http://api:8000'
      console.log('🔽 Scheduling downgrade:', { email, currentPlan, targetPlan })

      const response = await fetch(`${backendUrl}/api/v1/billing/downgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          current_plan: currentPlan,
          target_plan: targetPlan,
          effective_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Backend downgrade error:', errorData)
        return NextResponse.json({
          error: errorData.detail || 'Downgrade failed'
        }, { status: response.status })
      }

      const result = await response.json()
      console.log('✅ Downgrade scheduled:', result)

      return NextResponse.json({
        success: true,
        message: `Downgrade zu ${targetPlan.toUpperCase()} Plan wurde eingeleitet`,
        effective_date: result.effective_date,
        current_plan: currentPlan,
        target_plan: targetPlan
      })

    } catch (error) {
      console.error('💥 Backend downgrade call failed:', error)
      return NextResponse.json({
        error: 'Backend service unavailable'
      }, { status: 503 })
    }

  } catch (error) {
    console.error('Downgrade API error:', error)
    return NextResponse.json(
      { error: 'Failed to process downgrade' },
      { status: 500 }
    )
  }
}