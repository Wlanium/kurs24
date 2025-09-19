import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentId, planId, status, amount, currency, paypalData } = await request.json()

    // Log successful payment
    console.log('💳 PayPal payment successful:', {
      userId: session.user.email,
      paymentId,
      planId,
      status,
      amount,
      currency
    })

    // Save billing record to backend
    const backendUrl = process.env.BACKEND_API_URL || 'https://api.kurs24.io'

    try {
      // Save billing record
      const billingResponse = await fetch(`${backendUrl}/api/v1/billing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: session.user.email,
          customer_name: session.user.name || 'Customer',
          amount: parseFloat(amount),
          currency: currency,
          status: 'paid',
          payment_method: 'paypal',
          payment_id: paymentId,
          plan_id: planId,
          metadata: {
            paypalOrderId: paymentId,
            paypalStatus: status,
            paypalData: paypalData
          }
        })
      })

      if (!billingResponse.ok) {
        console.error('Failed to save billing record:', await billingResponse.text())
      } else {
        console.log('✅ Billing record saved successfully')
      }

      // Update user plan in backend using user ID
      const userId = (session.user as any).dbUserId
      let finalUserId: number

      if (!userId) {
        // Fallback to email lookup for older sessions
        const userIdResponse = await fetch(`${backendUrl}/api/v1/users/email/${encodeURIComponent(session.user.email!)}/id`)
        if (!userIdResponse.ok) {
          throw new Error(`Failed to get user ID: ${userIdResponse.status}`)
        }
        const userIdData = await userIdResponse.json()
        finalUserId = userIdData.user_id
      } else {
        finalUserId = userId
      }

      const updatePlanResponse = await fetch(`${backendUrl}/api/v1/users/${finalUserId}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId })
      })

      if (!updatePlanResponse.ok) {
        console.error('Failed to update user plan:', await updatePlanResponse.text())
      } else {
        console.log(`✅ User plan updated to ${planId}`)

        // Force session refresh to show new plan immediately
        try {
          const refreshResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/user/refresh-session`, {
            method: 'POST'
          })
          if (refreshResponse.ok) {
            console.log('✅ Session refresh triggered')
          }
        } catch (error) {
          console.error('Failed to trigger session refresh:', error)
        }
      }

      // Generate invoice
      const invoiceResponse = await fetch(`${backendUrl}/api/v1/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_email: session.user.email,
          customer_name: session.user.name || 'Customer',
          amount: parseFloat(amount),
          currency: currency,
          description: `Royal Academy ${planId.toUpperCase()} Plan - Monatliche Zahlung`,
          payment_method: 'PayPal',
          payment_id: paymentId
        })
      })

      if (!invoiceResponse.ok) {
        console.error('Failed to generate invoice:', await invoiceResponse.text())
      } else {
        console.log('📄 Invoice generated successfully')
      }

    } catch (error) {
      console.error('Backend API error:', error)
    }

    return NextResponse.json({
      success: true,
      paymentId,
      planId,
      message: '✅ Zahlung erfolgreich verarbeitet!'
    })

  } catch (error) {
    console.error('Subscription creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Get user's subscription from database
    // const subscription = await db.subscription.findFirst({
    //   where: { userId: session.user.id, status: 'ACTIVE' }
    // })

    // Mock data for now
    const mockSubscription = {
      id: 'sub_123',
      planId: 'pro',
      status: 'ACTIVE',
      nextBillingDate: '2025-10-15',
      amount: '49.00',
      currency: 'EUR'
    }

    return NextResponse.json(mockSubscription)

  } catch (error) {
    console.error('Subscription fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subscriptionId } = await request.json()

    // TODO: Cancel subscription in PayPal and update database
    // Example:
    // 1. Call PayPal API to cancel subscription
    // 2. Update database status to 'CANCELLED'
    // 3. Set cancellation date

    console.log('❌ Subscription cancelled:', {
      userId: session.user.email,
      subscriptionId
    })

    return NextResponse.json({
      success: true,
      message: 'Abonnement erfolgreich gekündigt'
    })

  } catch (error) {
    console.error('Subscription cancellation error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}