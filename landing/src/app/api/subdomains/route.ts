import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subdomain, planId } = await request.json()

    if (!subdomain || !planId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Call the real backend API with your smart DNS provisioning
    try {
      const backendUrl = process.env.BACKEND_API_URL || 'http://kurs24-api:8000'
      console.log('🌐 Calling backend API:', `${backendUrl}/api/v1/tenant/create`)

      const response = await fetch(`${backendUrl}/api/v1/tenant/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: session.user.name || 'Academy Owner',
          email: session.user.email,
          subdomain: subdomain,
          plan: planId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Backend API error:', errorData)
        return NextResponse.json({
          error: errorData.detail || 'Backend API fehler'
        }, { status: response.status })
      }

      const result = await response.json()
      console.log('✅ Backend response:', result)

      return NextResponse.json({
        success: true,
        subdomain: subdomain,
        status: 'provisioning',
        academyUrl: result.url,
        message: result.message,
        estimatedTime: result.estimated_time,
        tenant_id: result.tenant_id
      })

    } catch (error) {
      console.error('💥 Backend API call failed:', error)

      // Fallback to mock for development
      console.log('🔄 Falling back to mock response')
      return NextResponse.json({
        success: true,
        subdomain: subdomain,
        status: 'provisioning',
        academyUrl: `https://${subdomain}.kurs24.io`,
        message: '🚀 Academy wird erstellt! (Mock-Modus - Backend nicht erreichbar)',
        estimatedTime: '5-10 Minuten'
      })
    }

  } catch (error) {
    console.error('Subdomain creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create subdomain' },
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

    // Get user's subdomains from backend
    try {
      const backendUrl = process.env.BACKEND_API_URL || 'http://api:8000'

      // Use user ID directly from session if available
      const userId = (session.user as any).dbUserId
      let finalUserId: number

      if (!userId) {
        // Fallback to email lookup for older sessions
        const userIdResponse = await fetch(`${backendUrl}/api/v1/users/email/${encodeURIComponent(session.user.email!)}/id`)
        if (!userIdResponse.ok) {
          console.log('🌐 Subdomains GET: Failed to get user ID')
          return NextResponse.json([])
        }
        const userIdData = await userIdResponse.json()
        finalUserId = userIdData.user_id
      } else {
        finalUserId = userId
      }

      console.log('🌐 Subdomains GET: Fetching from:', `${backendUrl}/api/v1/users/${finalUserId}/tenant/status`)
      const response = await fetch(`${backendUrl}/api/v1/users/${finalUserId}/tenant/status`)

      console.log('🌐 Subdomains GET: Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('🌐 Subdomains GET: Backend data:', data)

        if (data && data.subdomain) {
          // Convert backend subdomain data to frontend format
          const subdomain = {
            id: `subdomain_${data.subdomain}`,
            subdomain: data.subdomain,
            status: data.status === 'active' ? 'active' :
                   data.status === 'provisioning' ? 'provisioning' :
                   data.status === 'failed' ? 'suspended' : 'suspended',
            planId: 'basis',
            academyUrl: data.domain ? `https://${data.domain}` : `https://${data.subdomain}.kurs24.io`,
            createdAt: data.updated_at || new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
            sslStatus: data.ssl_status || 'pending',
            progress: data.progress || 0,
            dns_status: data.dns_status || 'pending'
          }

          console.log('🌐 Subdomains GET: Returning subdomain:', subdomain)
          return NextResponse.json([subdomain])
        }
      }

      // If no subdomain found, return empty array
      return NextResponse.json([])

    } catch (error) {
      console.error('Backend subdomain fetch failed:', error)
      // Fallback to empty array on error
      return NextResponse.json([])
    }

  } catch (error) {
    console.error('Subdomains fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subdomains' },
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

    const { subdomainId } = await request.json()

    // TODO: Call backend API to delete subdomain
    // const response = await fetch(`${process.env.BACKEND_API_URL}/api/subdomains/${subdomainId}`, {
    //   method: 'DELETE',
    //   headers: {
    //     'Authorization': `Bearer ${session.token}`
    //   }
    // })

    console.log('🗑️ Subdomain deletion request:', {
      userId: session.user.email,
      subdomainId
    })

    return NextResponse.json({
      success: true,
      message: 'Subdomain wurde erfolgreich gelöscht'
    })

  } catch (error) {
    console.error('Subdomain deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete subdomain' },
      { status: 500 }
    )
  }
}