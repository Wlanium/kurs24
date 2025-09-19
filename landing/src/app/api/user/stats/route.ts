import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Stats API called')
    const session = await getServerSession()
    console.log('📊 Session:', !!session, 'User:', !!session?.user, 'Email:', session?.user?.email)

    if (!session?.user) {
      console.log('📊 No session or user, returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's current plan directly from backend plan endpoint
    const backendUrl = process.env.BACKEND_API_URL || 'http://api:8000'
    console.log('📊 Stats API using backend URL:', backendUrl)
    let currentPlan = 'free'
    let subdomain = undefined
    let subdomainStatus = 'none' as 'none' | 'provisioning' | 'active' | 'suspended'
    let nextBilling = undefined
    let userAvatar = '👤'

    try {
      // Use user ID directly from session (no more email lookups!)
      const userId = (session.user as any).dbUserId
      if (!userId) {
        // Fallback to email lookup for older sessions
        console.log('📊 No dbUserId in session, falling back to email lookup')
        const userIdResponse = await fetch(`${backendUrl}/api/v1/users/email/${encodeURIComponent(session.user.email!)}/id`)
        if (!userIdResponse.ok) {
          throw new Error(`Failed to get user ID: ${userIdResponse.status}`)
        }
        const userIdData = await userIdResponse.json()
        const userIdFallback = userIdData.user_id
        console.log('📊 User ID from fallback:', userIdFallback)
        var finalUserId = userIdFallback
      } else {
        console.log('📊 Using user ID from session:', userId)
        var finalUserId = userId
      }

      // Get current plan using user ID (more efficient)
      console.log('📊 About to fetch plan from:', `${backendUrl}/api/v1/users/${finalUserId}/plan`)
      const planResponse = await fetch(`${backendUrl}/api/v1/users/${finalUserId}/plan`)
      console.log('📊 Plan response status:', planResponse.status)
      if (planResponse.ok) {
        const planData = await planResponse.json()
        currentPlan = planData.plan || 'free'
        console.log('📊 Current plan from backend:', currentPlan)
      } else {
        console.log('📊 Plan fetch failed with status:', planResponse.status)
      }

      // Get user avatar using user ID (more efficient)
      console.log('📊 About to fetch avatar from:', `${backendUrl}/api/v1/users/${finalUserId}/avatar`)
      const avatarResponse = await fetch(`${backendUrl}/api/v1/users/${finalUserId}/avatar`)
      console.log('📊 Avatar response status:', avatarResponse.status)
      if (avatarResponse.ok) {
        const avatarData = await avatarResponse.json()
        userAvatar = avatarData.avatar || '👤'
        console.log('📊 User avatar from backend:', userAvatar)
      } else {
        console.log('📊 Avatar fetch failed with status:', avatarResponse.status)
      }

      // Get billing records for next billing date using user ID
      const billingResponse = await fetch(`${backendUrl}/api/v1/users/${finalUserId}/billing`)
      if (billingResponse.ok) {
        const billingRecords = await billingResponse.json()
        console.log('📊 Billing records:', billingRecords.length, 'found')
        console.log('📊 All billing records:', billingRecords.map((r: any) => ({
          id: r.id,
          billing_date: r.billing_date,
          status: r.status,
          plan: r.plan
        })))

        if (billingRecords && billingRecords.length > 0) {
          const now = new Date()

          // First, look for future billing records (scheduled renewals)
          const futureBilling = billingRecords
            .filter((r: any) => new Date(r.billing_date) > now)
            .sort((a: any, b: any) => new Date(a.billing_date).getTime() - new Date(b.billing_date).getTime())[0]

          if (futureBilling) {
            nextBilling = new Date(futureBilling.billing_date).toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            })
            console.log('📊 Found future billing record:', nextBilling)
          } else {
            // Fallback: calculate from most recent paid billing
            const activeBilling = billingRecords.find((r: any) => r.status === 'paid' || r.status === 'completed')
            console.log('📊 Active billing found:', !!activeBilling)
            if (activeBilling) {
              // Calculate next billing (30 days from last payment)
              const lastPayment = new Date(activeBilling.created_at)
              const nextDate = new Date(lastPayment)
              nextDate.setDate(nextDate.getDate() + 30)
              nextBilling = nextDate.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })
              console.log('📊 Calculated next billing:', nextBilling)
            } else if (currentPlan === 'basis') {
              // If BASIS plan but no billing records, set default next billing (30 days from now)
              const nextDate = new Date()
              nextDate.setDate(nextDate.getDate() + 30)
              nextBilling = nextDate.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })
              console.log('📊 Default next billing for BASIS plan:', nextBilling)
            }
          }
        } else if (currentPlan === 'basis') {
          // If BASIS plan but no billing records, set default next billing
          const nextDate = new Date()
          nextDate.setDate(nextDate.getDate() + 30)
          nextBilling = nextDate.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
          console.log('📊 Default next billing for BASIS plan (no records):', nextBilling)
        }
      }

      // Get subdomain status if user has a paid plan
      if (currentPlan !== 'free') {
        console.log('📊 Fetching subdomain status from:', `${backendUrl}/api/v1/users/${finalUserId}/tenant/status`)
        const subdomainResponse = await fetch(`${backendUrl}/api/v1/users/${finalUserId}/tenant/status`)
        if (subdomainResponse.ok) {
          const subdomainData = await subdomainResponse.json()
          console.log('📊 Subdomain response data:', subdomainData)
          if (subdomainData && subdomainData.subdomain) {
            subdomain = subdomainData.subdomain
            // Map backend status to frontend status
            subdomainStatus = subdomainData.status === 'active' ? 'active' :
                             subdomainData.status === 'provisioning' ? 'provisioning' :
                             subdomainData.status === 'failed' ? 'suspended' : 'suspended'
            console.log('📊 Mapped subdomain:', subdomain, 'status:', subdomainStatus)
          }
        } else {
          console.log('📊 Subdomain response failed with status:', subdomainResponse.status)
        }
      }
    } catch (error) {
      console.error('Backend API error:', error)
      // Fallback to checking local storage or session
    }

    const stats = {
      subdomain: subdomain,
      subdomainStatus: subdomainStatus,
      currentPlan: currentPlan,
      nextBilling: nextBilling,
      avatar: userAvatar,
      usage: {
        apiCalls: currentPlan === 'pro' ? 1000 : currentPlan === 'basis' ? 100 : 0,
        aiGenerations: currentPlan === 'pro' ? 500 : 0
      },
      academyUrl: subdomain ? `https://${subdomain}.kurs24.io` : undefined,
      createdAt: '2025-09-01',
      lastLogin: new Date().toISOString(),
      totalStudents: currentPlan === 'pro' ? 'unlimited' : currentPlan === 'basis' ? 100 : 0,
      activeCourses: currentPlan !== 'free' ? 10 : 0
    }

    console.log('📊 User stats for', session.user.email, ':', stats)

    const response = NextResponse.json(stats)

    // Add cache-busting headers to ensure fresh data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    return response

  } catch (error) {
    console.error('User stats fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    )
  }
}